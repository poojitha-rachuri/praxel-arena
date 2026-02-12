"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  const isAI = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...CARD_SPRING }}
      className={cn(
        "flex gap-2.5",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      {isAI && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isAI
            ? "bg-card border border-border text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {/* Render as plain text — never dangerouslySetInnerHTML */}
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {isStreaming && (
          <span className="inline-flex gap-1 mt-1" aria-label="AI is typing">
            <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>

      {!isAI && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-4" />
        </div>
      )}
    </motion.div>
  );
});
