"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Voice State Machine ────────────────────────────────

type VoiceState =
  | "idle" // Voice off, text mode active
  | "requesting" // Fetching signed URL from server
  | "connecting" // ElevenLabs WebSocket connecting
  | "active" // Voice session live
  | "error" // Failed, showing error + fallback
  | "cooldown"; // Just ended, prevent rapid re-toggle

interface VoiceToggleProps {
  onStateChange: (active: boolean) => void;
  disabled?: boolean;
}

export function VoiceToggle({
  onStateChange,
  disabled,
}: VoiceToggleProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const conversation = useConversation({
    onConnect: (_props: { conversationId: string }) => {
      setVoiceState("active");
      onStateChangeRef.current(true);
    },
    onDisconnect: () => {
      setVoiceState("cooldown");
      onStateChangeRef.current(false);
      cooldownTimer.current = setTimeout(() => {
        setVoiceState("idle");
      }, 1000);
    },
    onError: (message: string) => {
      console.error("[voice] Error:", message);
      setVoiceState("error");
      setTimeout(() => {
        setVoiceState("idle");
        onStateChangeRef.current(false);
      }, 2000);
    },
    onMessage: (_props: { message: string; source: "user" | "ai" }) => {
      // Voice transcripts handled by ElevenLabs agent directly
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const startVoice = useCallback(async () => {
    if (voiceState !== "idle") return;

    setVoiceState("requesting");

    try {
      const res = await fetch("/api/elevenlabs/signed-url");
      if (!res.ok) {
        const data = await res.json();
        console.error("[voice] Signed URL error:", data.error);
        setVoiceState("error");
        setTimeout(() => setVoiceState("idle"), 2000);
        return;
      }

      const { signedUrl } = await res.json();
      setVoiceState("connecting");

      // No client-side prompt overrides — agent prompt configured server-side via ElevenLabs dashboard
      await conversation.startSession({ signedUrl });
    } catch (err) {
      console.error("[voice] Failed to start:", err);
      setVoiceState("error");
      setTimeout(() => {
        setVoiceState("idle");
        onStateChangeRef.current(false);
      }, 2000);
    }
  }, [voiceState, conversation]);

  const stopVoice = useCallback(async () => {
    if (voiceState !== "active") return;
    await conversation.endSession();
  }, [voiceState, conversation]);

  const handleToggle = useCallback(() => {
    if (voiceState === "active") {
      stopVoice();
    } else if (voiceState === "idle") {
      startVoice();
    }
  }, [voiceState, startVoice, stopVoice]);

  const isLoading = voiceState === "requesting" || voiceState === "connecting";
  const isActive = voiceState === "active";
  const isError = voiceState === "error";
  const canToggle =
    !disabled &&
    (voiceState === "idle" || voiceState === "active") &&
    !isLoading;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={!canToggle}
        className={cn(
          "flex size-10 items-center justify-center rounded-xl transition-all min-h-[44px] min-w-[44px]",
          isActive
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 ring-2 ring-red-500/30"
            : isError
              ? "bg-destructive/10 text-destructive"
              : isLoading
                ? "bg-muted text-muted-foreground animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
        aria-label={isActive ? "Stop voice mode" : "Start voice mode"}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isActive ? (
          <MicOff className="size-4" />
        ) : (
          <Mic className="size-4" />
        )}
      </button>

      {isActive && (
        <span className="text-xs font-medium text-red-500 animate-pulse">
          Voice active
        </span>
      )}

      {isError && (
        <span className="text-xs text-destructive">
          Voice unavailable
        </span>
      )}
    </div>
  );
}
