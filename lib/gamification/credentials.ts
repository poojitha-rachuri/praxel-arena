import { prisma } from "@/lib/db";
import { CREDENTIAL_THRESHOLDS } from "./constants";
import type { CredentialType } from "@/app/generated/prisma/client";
import { getPostHogServer } from "@/lib/posthog";

/**
 * Check if a user's new Elo crosses any credential thresholds.
 * Grants all missing credentials up to current Elo.
 * Called after Elo update in duel completion.
 */
export async function processCredentials(
  userId: string,
  skillId: string,
  newElo: number
): Promise<{ type: string; skillName: string }[]> {
  const earned: { type: string; skillName: string }[] = [];

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { name: true },
  });
  if (!skill) return earned;

  for (const threshold of CREDENTIAL_THRESHOLDS) {
    if (newElo >= threshold.elo) {
      try {
        // Use create with try/catch to handle race condition (P2002 unique constraint)
        // instead of check-then-act which allows double creation
        await prisma.credential.create({
          data: {
            userId,
            skillId,
            type: threshold.type as CredentialType,
            eloAtGrant: newElo,
          },
        });
        earned.push({ type: threshold.label, skillName: skill.name });

        const ph = getPostHogServer();
        ph?.capture({
          distinctId: userId,
          event: "credential_earned",
          properties: {
            credentialType: threshold.type,
            skillName: skill.name,
            skillId,
            eloAtGrant: newElo,
          },
        });
      } catch (error: unknown) {
        // P2002 = unique constraint violation — credential already exists, skip
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          continue;
        }
        throw error;
      }
    }
  }

  return earned;
}
