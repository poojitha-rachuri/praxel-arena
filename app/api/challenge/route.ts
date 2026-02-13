import { type NextRequest, NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import {
  buildPostSprintPrompt,
  buildChallengePrompt,
} from "@/lib/ai/prompts/challenger";
import { AI_MODEL_EVALUATION } from "@/lib/utils/constants";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Zod Schemas ────────────────────────────────────────

// Vercel AI SDK sends various part types (text, step-start, tool-invocation, etc.)
// We accept all part types but validate text content length after parsing.
const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]), // Never allow 'system' from client
  parts: z.array(z.object({ type: z.string() }).passthrough()),
});

const PostSprintContext = z.object({
  type: z.literal("post-sprint"),
  attemptId: z.string(),
});

const ChallengeContext = z.object({
  type: z.literal("standalone"),
  skillId: z.string(),
  challengeType: z.enum([
    "MOCK_INTERVIEW",
    "SCENARIO_DRILL",
    "SOCRATIC_COACHING",
  ]),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).max(20),
  context: z.discriminatedUnion("type", [PostSprintContext, ChallengeContext]),
});

// ─── Route Handler ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body
  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.safeParse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const { messages, context } = parsed.data;

  // Validate text parts don't exceed max length
  for (const msg of messages) {
    for (const part of msg.parts) {
      if (
        part.type === "text" &&
        typeof part.text === "string" &&
        part.text.length > 2000
      ) {
        return NextResponse.json(
          { error: "Message too long" },
          { status: 400 }
        );
      }
    }
  }

  // Build system prompt — server fetches all context data
  // Rate limiting is enforced at session creation (/api/challenge/sessions)
  let systemPrompt: string;

  try {
    if (context.type === "post-sprint") {
      const attempt = await prisma.sprintAttempt.findUnique({
        where: { id: context.attemptId, userId: user.id },
        include: { sprint: { include: { skill: true } } },
      });
      if (!attempt) {
        return NextResponse.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }
      systemPrompt = buildPostSprintPrompt(attempt);
    } else {
      const skill = await prisma.skill.findUnique({
        where: { id: context.skillId },
      });
      if (!skill) {
        return NextResponse.json(
          { error: "Skill not found" },
          { status: 404 }
        );
      }
      systemPrompt = buildChallengePrompt(
        skill,
        context.challengeType,
        "intermediate"
      );
    }

    const result = streamText({
      model: anthropic(AI_MODEL_EVALUATION),
      system: systemPrompt,
      messages: await convertToModelMessages(messages as UIMessage[]),
      maxOutputTokens: 300,
      abortSignal: AbortSignal.timeout(15_000),
    });

    const response = result.toUIMessageStreamResponse();
    // Railway proxy compatibility — prevents response buffering
    response.headers.set("X-Accel-Buffering", "no");
    response.headers.set("Cache-Control", "no-cache, no-store");
    return response;
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Challenge API error:`, {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
      userId: user.id,
      contextType: context.type,
    });
    return NextResponse.json(
      { error: "Challenge failed", correlationId },
      { status: 500 }
    );
  }
}
