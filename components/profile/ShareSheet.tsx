"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Share2,
  Copy,
  Check,
  X,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
  userName: string;
  referralCode: string | null;
}

export default function ShareSheet({
  isOpen,
  onClose,
  profileUrl,
  userName,
  referralCode,
}: ShareSheetProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s Praxel Arena Profile`,
          text: `Check out my business skill credentials on Praxel Arena!`,
          url: profileUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }, [profileUrl, userName]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [profileUrl]);

  const handleCopyCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [referralCode]);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I'm leveling up my business skills on Praxel Arena! Check out my profile:`
  )}&url=${encodeURIComponent(profileUrl)}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    profileUrl
  )}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-card p-5 pb-[calc(76px+env(safe-area-inset-bottom))] shadow-2xl"
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Share Profile</h3>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Native share (mobile) */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Share2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Share via...</p>
                    <p className="text-xs text-muted-foreground">
                      Use your device&apos;s share menu
                    </p>
                  </div>
                </button>
              )}

              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  {linkCopied ? (
                    <Check className="size-5 text-emerald-500" />
                  ) : (
                    <Copy className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {profileUrl}
                  </p>
                </div>
              </button>

              {/* Social links */}
              <div className="flex gap-2">
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter/X
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              </div>

              {/* Referral code */}
              {referralCode && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Referral
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <Gift className="size-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-bold tracking-wider">
                        {referralCode}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Share this code — you both earn 500 XP!
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        codeCopied
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {codeCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
