"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { CountdownTimer } from "./CountdownTimer";
import { VoiceToggle } from "./VoiceToggle";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

// ─── Types ──────────────────────────────────────────────

export type PostSprintContext = {
  type: "post-sprint";
  attemptId: string;
};

export type StandaloneContext = {
  type: "standalone";
  skillId: string;
  challengeType: "MOCK_INTERVIEW" | "SCENARIO_DRILL" | "SOCRATIC_COACHING";
};

export type ChallengerContext = PostSprintContext | StandaloneContext;

interface AIChallengerProps {
  sessionId?: string; // present for standalone sessions, used to persist completion
  context: ChallengerContext;
  onClose: () => void;
  timeLimit?: number; // seconds, default 90 for post-sprint, 120 for standalone
}

// ─── Helper: extract text from UIMessage parts ──────────

function getMessageText(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

// ─── Component ──────────────────────────────────────────

export function AIChallenger({
  sessionId,
  context,
  onClose,
  timeLimit,
}: AIChallengerProps) {
  const defaultTime = context.type === "post-sprint" ? 90 : 120;
  const seconds = timeLimit ?? defaultTime;

  // Race condition guards (matching SprintRunner patterns)
  const endingRef = useRef(false);
  const mountedRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  const [ended, setEnded] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");

  // Transport configured to send to our challenge API with the context
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/challenge",
        body: { context },
      }),
    // Context should be stable for the lifetime of the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

  // Count user exchanges
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const maxExchanges = context.type === "post-sprint" ? 4 : 5;

  // ─── Auto-send initial AI message ──────────────────

  useEffect(() => {
    if (mountedRef.current) return; // Prevent double-mount in StrictMode
    mountedRef.current = true;

    // Send an initial user message to trigger the AI's opening
    sendMessage({
      text:
        context.type === "post-sprint"
          ? "I just finished a sprint. Challenge my thinking on my weakest areas."
          : "I'm ready for the challenge. Let's begin.",
    });

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-scroll to bottom ────────────────────────

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: isStreaming ? "instant" : "smooth",
      });
    }
  }, [messages, isStreaming]);

  // ─── Mobile keyboard handling ──────────────────────

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "instant",
      });
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  // ─── Handle send (with race guard) ────────────────

  const handleSend = useCallback(
    (content: string) => {
      if (endingRef.current || ended) return;
      if (exchangeCount >= maxExchanges) return;

      sendMessage({ text: content });
    },
    [ended, exchangeCount, maxExchanges, sendMessage]
  );

  // ─── Handle end ───────────────────────────────────

  const handleEnd = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnded(true);

    // Persist session completion for standalone sessions
    if (sessionId) {
      const durationSeconds = Math.round(
        (Date.now() - startTimeRef.current) / 1000
      );
      fetch(`/api/challenge/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          exchangeCount,
          durationSeconds,
        }),
      }).catch(() => {
        // Best-effort persistence — don't block the UI
      });
    }
  }, [sessionId, exchangeCount]);

  // ─── Voice mode handler ──────────────────────────

  const handleVoiceStateChange = useCallback(
    (active: boolean) => {
      setInputMode(active ? "voice" : "text");
    },
    []
  );

  // ─── Render messages ──────────────────────────────

  const renderedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const text = getMessageText(msg.parts as Array<{ type: string; text?: string }>);
      if (!text) return null;

      // For the initial trigger message, skip rendering it
      if (i === 0 && msg.role === "user") return null;

      const isLastMessage = i === messages.length - 1;
      const isStreamingThis =
        isLastMessage && msg.role === "assistant" && isStreaming;

      return (
        <ChatMessage
          key={msg.id}
          role={msg.role as "user" | "assistant"}
          content={text}
          isStreaming={isStreamingThis && !text}
        />
      );
    });
  }, [messages, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", ...CARD_SPRING }}
      className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
      style={{ maxHeight: "70vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <CountdownTimer
            totalSeconds={seconds}
            onExpire={handleEnd}
          />
          <div className="text-xs text-muted-foreground">
            {exchangeCount} of {maxExchanges} exchanges
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VoiceToggle
            onStateChange={handleVoiceStateChange}
            disabled={ended}
            challengeContext={
              context.type === "standalone"
                ? { skillId: context.skillId, challengeType: context.challengeType }
                : undefined
            }
          />
          <button
            onClick={handleEnd}
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
            aria-label="End conversation"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <AnimatePresence mode="popLayout">
          {renderedMessages}
        </AnimatePresence>

        {/* Streaming indicator when AI is thinking but no text yet */}
        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-xs">AI</span>
              </div>
              <div className="rounded-2xl bg-card border border-border px-3.5 py-2.5">
                <span
                  className="inline-flex gap-1"
                  aria-label="AI is thinking"
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <p>
              {error.message?.includes("429")
                ? "You've had a great session! Come back in a bit for more challenges."
                : error.message?.includes("timeout") || error.message?.includes("abort")
                  ? "AI is taking a moment. Try again."
                  : "Something went wrong. Please try again."}
            </p>
          </div>
        )}

        {/* Ended state */}
        {ended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", ...CARD_SPRING }}
            className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center"
          >
            <p className="text-sm font-medium text-primary">
              Challenge complete!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Great conversation. Keep building those skills.
            </p>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!ended && inputMode === "text" && (
        <ChatInput
          onSend={handleSend}
          disabled={
            isStreaming ||
            ended ||
            exchangeCount >= maxExchanges
          }
          placeholder={
            exchangeCount >= maxExchanges
              ? "Maximum exchanges reached"
              : "Type your response..."
          }
        />
      )}

      {/* Voice active indicator */}
      {!ended && inputMode === "voice" && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-4">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span className="size-2 rounded-full bg-red-500 animate-pulse [animation-delay:150ms]" />
            <span className="size-2 rounded-full bg-red-500 animate-pulse [animation-delay:300ms]" />
          </div>
          <span className="text-sm text-muted-foreground">
            Voice mode active — speak to respond
          </span>
        </div>
      )}

      {/* Close button when ended */}
      {ended && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            Continue
          </button>
        </div>
      )}
    </motion.div>
  );
}
