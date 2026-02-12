import { prisma } from "@/lib/db";
import { CREDENTIAL_THRESHOLDS } from "./constants";
import type { CredentialType } from "@/app/generated/prisma/client";

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
      const existing = await prisma.credential.findUnique({
        where: {
          userId_skillId_type: {
            userId,
            skillId,
            type: threshold.type as CredentialType,
          },
        },
      });
      if (!existing) {
        await prisma.credential.create({
          data: {
            userId,
            skillId,
            type: threshold.type as CredentialType,
            eloAtGrant: newElo,
          },
        });
        earned.push({ type: threshold.label, skillName: skill.name });
      }
    }
  }

  return earned;
}
