"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Swords, Copy, Check, ArrowRight, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CARD_SPRING } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { SignInButton } from "@clerk/nextjs";

interface InviteAcceptorProps {
  duelId: string;
  skillName: string;
  challengerName: string;
  challengerImage: string | null;
  isOwnDuel: boolean;
  isTaken: boolean;
  isAuthenticated: boolean;
}

export default function InviteAcceptor({
  duelId,
  skillName,
  challengerName,
  challengerImage,
  isOwnDuel,
  isTaken,
  isAuthenticated,
}: InviteAcceptorProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAccept = useCallback(async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duelId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.duel?.id) {
        router.push(`/compete/${data.duel.id}`);
        return;
      }

      setError(data.error || "Failed to accept challenge");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  }, [duelId, isAccepting, router]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const initials = challengerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", ...CARD_SPRING }}
        className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-border/50 bg-card/80 p-6 text-center backdrop-blur-sm shadow-xl"
      >
        {/* Swords icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Swords className="size-8 text-primary" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold">
            {isTaken
              ? "Challenge Unavailable"
              : isOwnDuel
                ? "Your Challenge"
                : "You've Been Challenged!"}
          </h1>
        </div>

        {/* Challenger info */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="size-12">
            {challengerImage ? (
              <AvatarImage src={challengerImage} alt={challengerName} />
            ) : null}
            <AvatarFallback className="text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {challengerName}
            </span>{" "}
            challenged you to a
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <span className="text-sm font-bold text-primary">{skillName}</span>
            <span className="text-xs text-muted-foreground">duel</span>
          </div>
        </div>

        {/* Actions */}
        {isTaken ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              This challenge has already been accepted
            </div>
            <button
              onClick={() => router.push("/compete")}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Go to Arena
            </button>
          </div>
        ) : isOwnDuel ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Share this link with a friend to start the duel
            </p>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy Invite Link
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/compete")}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Back to Arena
            </button>
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Sign in to accept this challenge
            </p>
            <SignInButton
              mode="modal"
              forceRedirectUrl={`/compete/invite/${duelId}`}
            >
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">
                Sign In to Accept
                <ArrowRight className="size-4" />
              </button>
            </SignInButton>
          </div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}
            <motion.button
              onClick={handleAccept}
              disabled={isAccepting}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors min-h-[48px]",
                "bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-primary/20"
              )}
            >
              {isAccepting ? (
                "Accepting..."
              ) : (
                <>
                  <Swords className="size-4" />
                  Accept Challenge
                </>
              )}
            </motion.button>
            <button
              onClick={() => router.push("/compete")}
              className="w-full rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Decline
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
