import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";

const CompleteSessionSchema = z.object({
  completed: z.literal(true),
  exchangeCount: z.number().int().min(0).max(20),
  durationSeconds: z.number().int().min(0).max(600),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  let body;
  try {
    body = CompleteSessionSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const session = await prisma.challengeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.completed) {
      return NextResponse.json({ error: "Already completed" }, { status: 409 });
    }

    await prisma.challengeSession.update({
      where: { id: sessionId },
      data: {
        completed: true,
        completedAt: new Date(),
        exchangeCount: body.data.exchangeCount,
        durationSeconds: body.data.durationSeconds,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[challenge-session] Completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
