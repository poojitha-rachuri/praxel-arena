"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { AIChallenger } from "@/components/ai-challenger/AIChallenger";
import {
  CHALLENGE_TYPE_CONFIG,
  type AIChallengeTypeName,
} from "@/lib/ai/prompts/challenge-types";

interface ChallengeSessionClientProps {
  sessionId: string;
  skillId: string;
  skillName: string;
  challengeType: "MOCK_INTERVIEW" | "SCENARIO_DRILL" | "SOCRATIC_COACHING";
}

export default function ChallengeSessionClient({
  sessionId,
  skillId,
  skillName,
  challengeType,
}: ChallengeSessionClientProps) {
  const router = useRouter();
  const config = CHALLENGE_TYPE_CONFIG[challengeType as AIChallengeTypeName];

  const handleClose = useCallback(() => {
    router.push("/challenge");
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3"
      >
        <button
          onClick={handleClose}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Back to challenges"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{config.title}</h1>
          <p className="text-xs text-muted-foreground">{skillName}</p>
        </div>
      </motion.div>

      {/* Chat */}
      <AIChallenger
        context={{
          type: "standalone",
          skillId,
          challengeType,
        }}
        onClose={handleClose}
        timeLimit={120}
      />
    </div>
  );
}
