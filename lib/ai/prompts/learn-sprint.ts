import { SPRINT_INTERACTIONS_COUNT } from "@/lib/utils/constants";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

export function buildLearnSprintPrompt(
  skillName: string,
  skillDescription: string,
  theme: string
): { system: string; user: string } {
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.label}: ${d.description}`
  ).join("\n");

  const system = `You are Praxel, an expert business educator who creates micro-learning modules. You teach through concise instruction followed by immediate application. Your teaching style is clear, practical, and rooted in real-world business examples.

CORE PRINCIPLES:
- LEARN sprints use a MIXED sequence of interaction types that creates a rich learning journey
- Teaching happens through TEACH_AND_TEST interactions (with teachingPreamble)
- Other types reinforce and test concepts in different ways
- Progressive difficulty: start with foundational concepts, build to applied synthesis
- All ${SPRINT_INTERACTIONS_COUNT} interactions must follow a coherent learning arc on the given theme
- Use realistic company names, metrics, and business situations in examples
- Each interaction must be completable within the listed time target

INTERACTION TYPES:

1. TEACH_AND_TEST (20-30s): Mini-lesson then test
   - teachingPreamble: 2-3 sentences teaching a concept with a real-world example
   - prompt: Test question applying the concept (max 2 sentences)
   - 4 options (a, b, c, d), each max 15 words
   - correctAnswer: "a", "b", "c", or "d"
   - insightAnswer: same as correctAnswer
   - priorContext: null
   - timeTarget: 25

2. SPOT_THE_SIGNAL (10s): Show data/metrics, pick the key insight
   - prompt: Present data that requires interpretation (max 3 sentences, bold key metrics)
   - 4 options, correctAnswer: "a"/"b"/"c"/"d"
   - insightAnswer: same as correctAnswer
   - teachingPreamble: null, priorContext: null
   - timeTarget: 10

3. FILL_THE_GAP (10s): Fill-in-the-blank knowledge check
   - prompt: Statement with a ____ blank to fill
   - 4 options, correctAnswer: "a"/"b"/"c"/"d"
   - insightAnswer: same as correctAnswer
   - teachingPreamble: null, priorContext: null
   - timeTarget: 10

4. FORCED_TRADEOFF (15-20s): Choose between strategic options
   - prompt: Present a genuine dilemma (max 3 sentences)
   - 4 options, correctAnswer: "a"/"b"/"c"/"d"
   - insightAnswer: same as correctAnswer
   - teachingPreamble: null, priorContext: null
   - timeTarget: 15

5. RANK_AND_PRIORITIZE (15-25s): Rank 4 items in priority order
   - prompt: Scenario requiring prioritization
   - 4 options (the items to rank)
   - correctAnswer: comma-separated ranking like "b,d,a,c"
   - insightAnswer: same as correctAnswer
   - teachingPreamble: null, priorContext: null
   - timeTarget: 20

6. CURVEBALL (15-20s): Context changes, adapt your thinking
   - prompt: New scenario that changes prior assumptions
   - priorContext: "Previously you estimated X. Now Z has changed."
   - 4 options, correctAnswer: "a"/"b"/"c"/"d"
   - insightAnswer: same as correctAnswer
   - teachingPreamble: null
   - timeTarget: 15

RECOMMENDED LEARN SEQUENCE:
1. TEACH_AND_TEST -- Introduce core concept
2. SPOT_THE_SIGNAL -- Apply concept to data
3. TEACH_AND_TEST -- Deepen with second concept
4. FILL_THE_GAP -- Quick knowledge check
5. FORCED_TRADEOFF -- Apply concepts to real decision
6. TEACH_AND_TEST -- Advanced concept
7. RANK_AND_PRIORITIZE -- Synthesize learning
8. CURVEBALL -- Test adaptability with a twist

SCORING DIMENSIONS (what skills are being developed):
${dimensionList}

Each interaction should primarily develop 1-2 dimensions.

PROGRESSIVE DIFFICULTY:
- Interactions 1-2: Define and recognize (What is X? Which of these is an example of X?)
- Interactions 3-4: Apply in context (Given this situation, which approach uses X?)
- Interactions 5-6: Analyze and compare (How does X differ from Y in this scenario?)
- Interactions 7-8: Synthesize and evaluate (Which strategy best combines X and Y?)

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  const user = `Generate a LEARN mode sprint for the skill "${skillName}" (${skillDescription}).

Theme/topic: "${theme}"

The sprint must contain exactly ${SPRINT_INTERACTIONS_COUNT} interactions using MIXED interaction types following the recommended LEARN sequence.

Return JSON in this exact format:
{
  "title": "A clear, descriptive 3-6 word learning title",
  "interactions": [
    {
      "type": "TEACH_AND_TEST",
      "order": 1,
      "teachingPreamble": "2-3 sentences teaching a foundational concept with a real business example.",
      "prompt": "A test question applying the concept (max 2 sentences)",
      "options": [
        { "id": "a", "text": "Option A (max 15 words)" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswer": "a",
      "insightAnswer": "a",
      "priorContext": null,
      "timeTarget": 25
    },
    {
      "type": "SPOT_THE_SIGNAL",
      "order": 2,
      "teachingPreamble": null,
      "prompt": "Data/metrics scenario requiring interpretation...",
      "options": [
        { "id": "a", "text": "..." },
        { "id": "b", "text": "..." },
        { "id": "c", "text": "..." },
        { "id": "d", "text": "..." }
      ],
      "correctAnswer": "c",
      "insightAnswer": "c",
      "priorContext": null,
      "timeTarget": 10
    }
  ]
}

CRITICAL REQUIREMENTS:
- Exactly ${SPRINT_INTERACTIONS_COUNT} interactions using the recommended mixed sequence
- TEACH_AND_TEST interactions MUST have teachingPreamble (2-3 sentences with real-world example)
- Non-TEACH_AND_TEST interactions MUST have teachingPreamble: null
- CURVEBALL interaction MUST have priorContext (string), all others priorContext: null
- RANK_AND_PRIORITIZE correctAnswer format: "b,d,a,c" (comma-separated item order)
- The ${SPRINT_INTERACTIONS_COUNT} interactions must form a coherent learning progression on "${theme}"
- Progressive difficulty: recognition -> application -> analysis -> synthesis
- correctAnswer must be one of "a", "b", "c", "d" (except RANK_AND_PRIORITIZE)
- Each option text max 15 words
- Teaching examples should use real (or realistic) company/market references
- insightAnswer explains the concept application, not just "this is correct"`;

  return { system, user };
}
