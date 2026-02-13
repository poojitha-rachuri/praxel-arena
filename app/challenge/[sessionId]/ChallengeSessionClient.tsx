"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MessageSquare, Mic } from "lucide-react";
import { AIChallenger } from "@/components/ai-challenger/AIChallenger";
import {
  CHALLENGE_TYPE_CONFIG,
  type AIChallengeTypeName,
} from "@/lib/ai/prompts/challenge-types";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

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

  const [selectedMode, setSelectedMode] = useState<"TEXT" | "VOICE" | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);

  // Check voice availability on mount
  useEffect(() => {
    fetch("/api/elevenlabs/signed-url")
      .then((res) => res.json())
      .then((data) => setVoiceAvailable(data.available === true))
      .catch(() => setVoiceAvailable(false));
  }, []);

  const handleClose = useCallback(() => {
    router.push("/challenges");
  }, [router]);

  // Mode picker screen
  if (selectedMode === null) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3"
        >
          <button
            onClick={handleClose}
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Back to challenges"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{config.title}</h1>
            <p className="text-xs text-muted-foreground">{skillName}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", ...CARD_SPRING }}
          className="flex flex-col items-center gap-6 pt-8"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold">How do you want to take this challenge?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your preferred interaction mode
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {/* Text option */}
            <button
              onClick={() => setSelectedMode("TEXT")}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97] min-h-[140px]"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <MessageSquare className="size-7 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">Text Chat</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Type your responses</p>
              </div>
            </button>

            {/* Voice option */}
            <button
              onClick={() => voiceAvailable && setSelectedMode("VOICE")}
              disabled={voiceAvailable === false}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all min-h-[140px]",
                voiceAvailable === false
                  ? "border-border/50 bg-muted/30 cursor-not-allowed opacity-50"
                  : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]"
              )}
            >
              <div className={cn(
                "flex size-14 items-center justify-center rounded-2xl",
                voiceAvailable === false ? "bg-muted" : "bg-violet-500/10"
              )}>
                <Mic className={cn(
                  "size-7",
                  voiceAvailable === false ? "text-muted-foreground" : "text-violet-500"
                )} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">Voice Call</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {voiceAvailable === false ? "Not configured" : "Speak with AI"}
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Challenge session with locked mode
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
          className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
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
        sessionId={sessionId}
        context={{
          type: "standalone",
          skillId,
          challengeType,
        }}
        onClose={handleClose}
        lockedMode={selectedMode}
      />
    </div>
  );
}
