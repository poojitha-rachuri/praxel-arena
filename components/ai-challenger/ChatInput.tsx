"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Type your response...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || submittedRef.current) return;

    submittedRef.current = true;
    onSend(trimmed);
    setValue("");
    // Reset after a tick to allow next message
    requestAnimationFrame(() => {
      submittedRef.current = false;
      inputRef.current?.focus();
    });
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background p-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 500))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "min-h-[44px] max-h-[120px] flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Chat message input"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          "flex size-[44px] shrink-0 items-center justify-center rounded-xl transition-colors",
          value.trim() && !disabled
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground"
        )}
        aria-label="Send message"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}
