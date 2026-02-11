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
- Every interaction is TEACH_AND_TEST: a brief teaching moment followed by a test question
- The teachingPreamble introduces ONE concept in 2-3 sentences using a real-world business example
- The test question immediately applies that concept
- Progressive difficulty: start with foundational concepts, build to applied synthesis
- All 8 interactions must follow a coherent learning arc on the given theme
- Use realistic company names, metrics, and business situations in examples
- Each interaction must be completable within 20-30 seconds (reading + answering)

SCORING DIMENSIONS (what skills are being developed):
${dimensionList}

Each interaction should primarily develop 1-2 dimensions.

TEACH_AND_TEST RULES:
- teachingPreamble: 2-3 sentences that teach a specific concept with a concrete example
- prompt: A test question that requires applying the concept just taught (max 2 sentences)
- 4 options (a, b, c, d), each max 15 words
- correctAnswer: the option ID of the right answer
- insightAnswer: 1-2 sentences explaining WHY this answer demonstrates understanding
- timeTarget: 25 seconds (reading teaching + answering)

PROGRESSIVE DIFFICULTY:
- Interactions 1-2: Define and recognize (What is X? Which of these is an example of X?)
- Interactions 3-4: Apply in context (Given this situation, which approach uses X?)
- Interactions 5-6: Analyze and compare (How does X differ from Y in this scenario?)
- Interactions 7-8: Synthesize and evaluate (Which strategy best combines X and Y to address this challenge?)

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  const user = `Generate a LEARN mode sprint for the skill "${skillName}" (${skillDescription}).

Theme/topic: "${theme}"

The sprint must contain exactly ${SPRINT_INTERACTIONS_COUNT} interactions, ALL of type TEACH_AND_TEST.

Return JSON in this exact format:
{
  "title": "A clear, descriptive 3-6 word learning title",
  "interactions": [
    {
      "type": "TEACH_AND_TEST",
      "order": 1,
      "teachingPreamble": "2-3 sentences teaching a foundational concept with a real business example. E.g., 'Customer Acquisition Cost (CAC) measures how much a company spends to gain each new customer. When Dropbox launched its referral program in 2008, it reduced CAC from $388 per customer to near-zero for referred users.'",
      "prompt": "A test question applying the concept (max 2 sentences)",
      "options": [
        { "id": "a", "text": "Option A (max 15 words)" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswer": "a",
      "insightAnswer": "Why this answer shows real understanding (1-2 sentences)",
      "timeTarget": 25
    },
    {
      "type": "TEACH_AND_TEST",
      "order": 2,
      "teachingPreamble": "Next concept building on the first...",
      "prompt": "...",
      "options": [...],
      "correctAnswer": "b",
      "insightAnswer": "...",
      "timeTarget": 25
    }
  ]
}

CRITICAL REQUIREMENTS:
- ALL 8 interactions must be TEACH_AND_TEST type
- EVERY interaction must have a teachingPreamble (2-3 sentences with real-world example)
- The 8 interactions must form a coherent learning progression on "${theme}"
- Progressive difficulty: recognition -> application -> analysis -> synthesis
- correctAnswer must be one of "a", "b", "c", "d"
- Each option text max 15 words
- Teaching examples should use real (or realistic) company/market references
- insightAnswer explains the concept application, not just "this is correct"`;

  return { system, user };
}
