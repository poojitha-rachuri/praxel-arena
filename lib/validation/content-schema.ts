import { z } from "zod";

const optionSchema = z.object({
  id: z.enum(["a", "b", "c", "d"]),
  text: z.string().min(1).max(200),
});

const baseInteraction = z.object({
  order: z.number().int().min(1).max(8),
  prompt: z.string().min(1).max(500),
  options: z.array(optionSchema).length(4),
  correctAnswer: z.string().min(1),
  insightAnswer: z.string().min(1).nullable(),
  teachingPreamble: z.string().nullable(),
  priorContext: z.string().nullable(),
  timeTarget: z.number().int().min(5).max(60),
  chartData: z.unknown().optional(),
  dimensionWeights: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

const interactionSchema = z.discriminatedUnion("type", [
  baseInteraction.extend({
    type: z.literal("TEACH_AND_TEST"),
    teachingPreamble: z.string().min(1),
    correctAnswer: z.enum(["a", "b", "c", "d"]),
  }),
  baseInteraction.extend({
    type: z.literal("SPOT_THE_SIGNAL"),
    correctAnswer: z.enum(["a", "b", "c", "d"]),
  }),
  baseInteraction.extend({
    type: z.literal("FORCED_TRADEOFF"),
    correctAnswer: z.enum(["a", "b", "c", "d"]),
  }),
  baseInteraction.extend({
    type: z.literal("FILL_THE_GAP"),
    correctAnswer: z.enum(["a", "b", "c", "d"]),
  }),
  baseInteraction.extend({
    type: z.literal("CURVEBALL"),
    priorContext: z.string().min(1),
    correctAnswer: z.enum(["a", "b", "c", "d"]),
  }),
  baseInteraction.extend({
    type: z.literal("RANK_AND_PRIORITIZE"),
    correctAnswer: z.string().regex(/^[a-d],[a-d],[a-d],[a-d]$/),
  }),
]);

export const sprintFileSchema = z.object({
  skillSlug: z.string().min(1),
  topicSlug: z.string().min(1),
  mode: z.enum(["LEARN", "PRACTICE"]),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  sprintOrder: z.number().int().min(1),
  interactions: z.array(interactionSchema).length(8),
});

export const topicDefinitionSchema = z.object({
  skillSlug: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(1),
  icon: z.string().optional(),
});

export const topicsFileSchema = z.array(topicDefinitionSchema);

export type SprintFile = z.infer<typeof sprintFileSchema>;
export type TopicDefinition = z.infer<typeof topicDefinitionSchema>;
export type InteractionData = z.infer<typeof interactionSchema>;
