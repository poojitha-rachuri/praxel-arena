/**
 * Compute career match percentages from user skill scores and career goal mappings.
 * Uses plain interfaces to avoid coupling to Prisma types.
 */

interface SkillScoreInput {
  skillId: string;
  overallScore: number;
}

interface CareerMappingInput {
  name: string;
  slug: string;
  icon: string | null;
  skillMaps: { skillId: string; weight: number }[];
}

export interface CareerMatch {
  name: string;
  slug: string;
  icon: string | null;
  matchPercentage: number;
}

/** Minimum number of attempted skills before showing a career match percentage */
const MIN_ATTEMPTED_SKILLS = 1;

export function computeCareerMatches(
  skillScores: SkillScoreInput[],
  careerGoals: CareerMappingInput[]
): CareerMatch[] {
  const scoreLookup = new Map(
    skillScores.map((ss) => [ss.skillId, ss.overallScore])
  );

  return careerGoals.map((career) => {
    const mappings = career.skillMaps;

    if (mappings.length === 0) {
      return { name: career.name, slug: career.slug, icon: career.icon, matchPercentage: 0 };
    }

    let weightedSum = 0;
    let careerWeight = 0;
    let attemptedCount = 0;

    for (const mapping of mappings) {
      const score = scoreLookup.get(mapping.skillId);
      // Skip unattempted skills instead of treating them as 0
      if (score === undefined) continue;
      attemptedCount++;
      weightedSum += score * mapping.weight;
      careerWeight += mapping.weight;
    }

    // Require minimum skill coverage before showing a percentage
    if (attemptedCount < MIN_ATTEMPTED_SKILLS || careerWeight === 0) {
      return { name: career.name, slug: career.slug, icon: career.icon, matchPercentage: 0 };
    }

    return {
      name: career.name,
      slug: career.slug,
      icon: career.icon,
      matchPercentage: Math.round(weightedSum / careerWeight),
    };
  });
}
