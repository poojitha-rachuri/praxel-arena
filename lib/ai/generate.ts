import { generateJSON } from "@/lib/ai/client";
import { buildCompeteSprintPrompt } from "@/lib/ai/prompts/compete-sprint";
import { buildLearnSprintPrompt } from "@/lib/ai/prompts/learn-sprint";
import { buildPracticeSprintPrompt } from "@/lib/ai/prompts/practice-sprint";
import { buildAdaptiveAssessPrompt } from "@/lib/ai/prompts/adaptive-assess";
import { SPRINT_INTERACTIONS_COUNT } from "@/lib/utils/constants";
import type { DimensionScores } from "@/lib/scoring/dimensions";

// ─── Types ─────────────────────────────────────────────────

export interface GeneratedInteraction {
  type: string;
  order: number;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string | null;
  insightAnswer: string | null;
  teachingPreamble?: string | null;
  priorContext?: string | null;
  timeTarget: number;
  targetDimension?: string;
}

export interface GeneratedSprint {
  title: string;
  interactions: GeneratedInteraction[];
}

// ─── Validation ────────────────────────────────────────────

const VALID_TYPES = new Set([
  "SPOT_THE_SIGNAL",
  "FORCED_TRADEOFF",
  "FILL_THE_GAP",
  "RANK_AND_PRIORITIZE",
  "CURVEBALL",
  "TEACH_AND_TEST",
]);

const VALID_OPTION_IDS = new Set(["a", "b", "c", "d"]);

function validateInteraction(
  interaction: GeneratedInteraction,
  index: number
): string[] {
  const errors: string[] = [];
  const prefix = `Interaction ${index + 1}`;

  if (!VALID_TYPES.has(interaction.type)) {
    errors.push(`${prefix}: invalid type "${interaction.type}"`);
  }

  if (interaction.order !== index + 1) {
    errors.push(
      `${prefix}: order should be ${index + 1}, got ${interaction.order}`
    );
  }

  if (!interaction.prompt || interaction.prompt.trim().length === 0) {
    errors.push(`${prefix}: missing prompt`);
  }

  if (!Array.isArray(interaction.options) || interaction.options.length !== 4) {
    errors.push(`${prefix}: must have exactly 4 options`);
  } else {
    for (const opt of interaction.options) {
      if (!opt.id || !opt.text) {
        errors.push(`${prefix}: option missing id or text`);
      }
      if (!VALID_OPTION_IDS.has(opt.id)) {
        errors.push(`${prefix}: invalid option id "${opt.id}"`);
      }
    }
  }

  // correctAnswer validation
  if (interaction.type === "RANK_AND_PRIORITIZE") {
    // Should be comma-separated option IDs
    if (interaction.correctAnswer) {
      const parts = interaction.correctAnswer.split(",").map((s) => s.trim());
      if (parts.length !== 4 || !parts.every((p) => VALID_OPTION_IDS.has(p))) {
        errors.push(
          `${prefix}: RANK_AND_PRIORITIZE correctAnswer must be 4 comma-separated option IDs`
        );
      }
    }
  } else if (
    interaction.correctAnswer &&
    !VALID_OPTION_IDS.has(interaction.correctAnswer)
  ) {
    errors.push(
      `${prefix}: correctAnswer "${interaction.correctAnswer}" is not a valid option ID`
    );
  }

  if (interaction.type === "CURVEBALL" && !interaction.priorContext) {
    errors.push(`${prefix}: CURVEBALL must have priorContext`);
  }

  if (interaction.type === "TEACH_AND_TEST" && !interaction.teachingPreamble) {
    errors.push(`${prefix}: TEACH_AND_TEST must have teachingPreamble`);
  }

  if (
    !interaction.timeTarget ||
    interaction.timeTarget < 5 ||
    interaction.timeTarget > 60
  ) {
    errors.push(`${prefix}: timeTarget must be 5-60 seconds`);
  }

  return errors;
}

function validateSprint(
  sprint: GeneratedSprint,
  expectedCount: number
): string[] {
  const errors: string[] = [];

  if (!sprint.title || sprint.title.trim().length === 0) {
    errors.push("Missing sprint title");
  }

  if (
    !Array.isArray(sprint.interactions) ||
    sprint.interactions.length !== expectedCount
  ) {
    errors.push(
      `Expected ${expectedCount} interactions, got ${sprint.interactions?.length ?? 0}`
    );
    return errors; // Can't validate individual interactions if count is wrong
  }

  for (let i = 0; i < sprint.interactions.length; i++) {
    errors.push(...validateInteraction(sprint.interactions[i], i));
  }

  return errors;
}

/**
 * Fix common minor issues in AI-generated sprint data.
 * Mutates the sprint in place and returns it.
 */
function sanitizeSprint(sprint: GeneratedSprint): GeneratedSprint {
  if (!sprint.interactions) return sprint;

  for (let i = 0; i < sprint.interactions.length; i++) {
    const interaction = sprint.interactions[i];

    // Fix order if it doesn't match index
    interaction.order = i + 1;

    // Trim whitespace from correctAnswer
    if (interaction.correctAnswer) {
      interaction.correctAnswer = interaction.correctAnswer.trim();
    }

    // Ensure null for optional fields if undefined
    interaction.teachingPreamble = interaction.teachingPreamble ?? null;
    interaction.priorContext = interaction.priorContext ?? null;
    interaction.insightAnswer = interaction.insightAnswer ?? null;

    // Clamp timeTarget to valid range
    if (!interaction.timeTarget || interaction.timeTarget < 5) {
      interaction.timeTarget = 15;
    } else if (interaction.timeTarget > 60) {
      interaction.timeTarget = 30;
    }
  }

  return sprint;
}

// ─── Sprint Generation ────────────────────────────────────

type SprintMode = "LEARN" | "PRACTICE" | "COMPETE";

/**
 * Generate a sprint using Claude AI.
 *
 * - LEARN mode: requires a theme parameter, generates TEACH_AND_TEST interactions
 * - PRACTICE mode: generates mixed interaction types without teaching preambles
 * - COMPETE mode: generates a coherent business narrative with the fixed compete sequence
 *
 * All modes use Claude Opus for generation (via generateJSON).
 * Validates response schema and retries once on validation failure.
 */
export async function generateSprint(
  skillName: string,
  skillDescription: string,
  mode: SprintMode,
  difficulty: number,
  options?: {
    playerElo?: number;
    theme?: string;
  }
): Promise<GeneratedSprint> {
  let promptResult: { system: string; user: string };

  switch (mode) {
    case "COMPETE":
      promptResult = buildCompeteSprintPrompt(
        skillName,
        skillDescription,
        difficulty,
        options?.playerElo ?? 1200
      );
      break;
    case "LEARN":
      promptResult = buildLearnSprintPrompt(
        skillName,
        skillDescription,
        options?.theme ?? "Core Fundamentals"
      );
      break;
    case "PRACTICE":
      promptResult = buildPracticeSprintPrompt(
        skillName,
        skillDescription,
        difficulty
      );
      break;
    default:
      throw new Error(`Unknown sprint mode: ${mode}`);
  }

  // First attempt
  let sprint = await generateJSON<GeneratedSprint>(
    promptResult.system,
    promptResult.user
  );
  sprint = sanitizeSprint(sprint);

  let errors = validateSprint(sprint, SPRINT_INTERACTIONS_COUNT);

  // Retry once on validation failure
  if (errors.length > 0) {
    console.warn(
      `[generateSprint] First attempt had ${errors.length} validation errors, retrying:`,
      errors
    );

    sprint = await generateJSON<GeneratedSprint>(
      promptResult.system,
      promptResult.user +
        `\n\nIMPORTANT: Your previous response had validation errors:\n${errors.join("\n")}\nPlease fix these issues in your response.`
    );
    sprint = sanitizeSprint(sprint);

    errors = validateSprint(sprint, SPRINT_INTERACTIONS_COUNT);
    if (errors.length > 0) {
      console.error(
        `[generateSprint] Second attempt still has ${errors.length} errors:`,
        errors
      );
      // Throw on critical errors (wrong count), but tolerate minor ones
      const criticalErrors = errors.filter(
        (e) => e.includes("Expected") || e.includes("invalid type")
      );
      if (criticalErrors.length > 0) {
        throw new Error(
          `Sprint generation failed after retry: ${criticalErrors.join("; ")}`
        );
      }
    }
  }

  return sprint;
}

/**
 * Generate an adaptive skill assessment (5 questions).
 * Used during onboarding or re-calibration.
 */
export async function generateAdaptiveAssessment(
  skillName: string,
  currentScores: Partial<DimensionScores> | null
): Promise<GeneratedSprint> {
  const { system, user } = buildAdaptiveAssessPrompt(skillName, currentScores);

  let sprint = await generateJSON<GeneratedSprint>(system, user);
  sprint = sanitizeSprint(sprint);

  let errors = validateSprint(sprint, 5);

  if (errors.length > 0) {
    console.warn(
      `[generateAdaptiveAssessment] First attempt had errors, retrying:`,
      errors
    );

    sprint = await generateJSON<GeneratedSprint>(
      system,
      user +
        `\n\nIMPORTANT: Your previous response had validation errors:\n${errors.join("\n")}\nPlease fix these issues.`
    );
    sprint = sanitizeSprint(sprint);

    errors = validateSprint(sprint, 5);
    if (errors.length > 0) {
      const criticalErrors = errors.filter(
        (e) => e.includes("Expected") || e.includes("invalid type")
      );
      if (criticalErrors.length > 0) {
        throw new Error(
          `Assessment generation failed after retry: ${criticalErrors.join("; ")}`
        );
      }
    }
  }

  return sprint;
}
