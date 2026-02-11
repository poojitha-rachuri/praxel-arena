import Anthropic from "@anthropic-ai/sdk";
import {
  AI_MODEL_GENERATION,
  AI_MODEL_EVALUATION,
} from "@/lib/utils/constants";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

function extractJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract first JSON object from response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(
      `AI returned invalid JSON: ${text.slice(0, 200)}`
    );
  }
}

async function callClaude<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return extractJSON<T>(text);
}

// For sprint generation (non-streaming, need full JSON)
export const generateJSON = <T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> => callClaude<T>(AI_MODEL_GENERATION, systemPrompt, userPrompt);

// For evaluation (faster, cheaper model)
export const evaluateJSON = <T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> => callClaude<T>(AI_MODEL_EVALUATION, systemPrompt, userPrompt);
