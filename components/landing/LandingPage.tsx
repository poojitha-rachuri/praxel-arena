"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import Link from "next/link";
import {
  BookOpen,
  Target,
  Swords,
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  BarChart3,
  Scale,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const SPRING = { stiffness: 300, damping: 25 };

interface DemoOption {
  letter: string;
  text: string;
  selected?: boolean;
}

interface DemoCard {
  type: string;
  icon: typeof BarChart3;
  badgeBg: string;
  badgeText: string;
  glowClass: string;
  question: string;
  options: DemoOption[];
}

const DEMO_CARDS: DemoCard[] = [
  {
    type: "Spot the Signal",
    icon: BarChart3,
    badgeBg: "bg-info/15",
    badgeText: "text-info",
    glowClass: "bg-info",
    question:
      "Q3 revenue dropped 12% while user growth increased 8%. What's the most likely driver?",
    options: [
      { letter: "A", text: "Pricing pressure from competitors" },
      { letter: "B", text: "Customer mix shift to lower tiers", selected: true },
      { letter: "C", text: "Seasonal revenue fluctuation" },
      { letter: "D", text: "Increased customer churn" },
    ],
  },
  {
    type: "Forced Tradeoff",
    icon: Scale,
    badgeBg: "bg-insight/15",
    badgeText: "text-insight",
    glowClass: "bg-insight",
    question:
      "Ship Feature A (high revenue, low retention) or Feature B (low revenue, high retention)?",
    options: [
      { letter: "A", text: "Feature A  -  Maximize short-term revenue" },
      { letter: "B", text: "Feature B  -  Build long-term retention", selected: true },
    ],
  },
  {
    type: "Rank & Prioritize",
    icon: TrendingUp,
    badgeBg: "bg-success/15",
    badgeText: "text-success",
    glowClass: "bg-success",
    question: "Rank these growth levers by ROI for a Series A B2B SaaS:",
    options: [
      { letter: "1", text: "Product-led growth motions" },
      { letter: "2", text: "Outbound sales expansion", selected: true },
      { letter: "3", text: "Content & SEO flywheel" },
      { letter: "4", text: "Strategic partnerships" },
    ],
  },
];

/* ─── Animation Variants ──────────────────────────────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

/* ═════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* ── Animated background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Primary orb */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-[180px] animate-[pulse_8s_ease-in-out_infinite]" />
        {/* Learn orb */}
        <div className="absolute top-[60%] -left-60 w-[500px] h-[500px] rounded-full bg-mode-learn/8 blur-[140px] animate-float" />
        {/* Compete orb */}
        <div className="absolute top-[50%] -right-60 w-[500px] h-[500px] rounded-full bg-mode-compete/8 blur-[140px] animate-float-delayed" />
      </div>

      {/* ── Landing Nav ── */}
      <header className="relative z-50 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
            <Zap className="size-4 text-primary" />
          </div>
          <span className="text-base font-bold tracking-tight">
            Praxel Arena
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full px-5 font-semibold"
          >
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* ── Hero + Card Preview ── */}
      <section className="relative px-5 pt-16 pb-4 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-5xl lg:flex lg:items-center lg:gap-16">
          {/* Text column */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center lg:flex-1 lg:text-left"
          >
            {/* AI badge */}
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 text-xs font-medium text-primary"
            >
              <Brain className="size-3.5" />
              Powered by Claude AI
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-extrabold tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl"
            >
              Prove Your Business Skills{" "}
              <span className="animate-shimmer-text bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
                In 2 Minutes
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg lg:mx-0"
            >
              AI-generated micro-sprints that test{" "}
              <em className="not-italic font-medium text-foreground">
                six dimensions
              </em>{" "}
              of business thinking. Learn, practice, and compete your way to
              credential.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="group min-h-[48px] w-full rounded-xl px-8 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 sm:w-auto"
              >
                <Link href="/sign-up">
                  Start Free
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-[48px] w-full rounded-xl px-8 text-base font-medium sm:w-auto"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex items-center justify-center gap-5 text-sm text-muted-foreground lg:justify-start"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-warning" />
                <span className="font-semibold text-foreground">96</span>{" "}
                Sprints
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Award className="size-3.5 text-primary" />
                <span className="font-semibold text-foreground">8</span> Skills
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Brain className="size-3.5 text-info" />
                AI Eval
              </div>
            </motion.div>
          </motion.div>

          {/* Card preview column */}
          <div className="mt-14 flex justify-center lg:mt-0 lg:flex-1">
            <CardPreview />
          </div>
        </div>
      </section>

      {/* ── Modes ── */}
      <ModesSection />

      {/* ── How It Works ── */}
      <HowItWorksSection />

      {/* ── Final CTA ── */}
      <FinalCTA />

      {/* ── Footer ── */}
      <footer className="relative border-t border-border/30 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Built with Claude AI for the Opus 4.6 Hackathon
        </p>
      </footer>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   CARD PREVIEW  -  Auto-cycling demo of interaction types
   ═════════════════════════════════════════════════════════════════════════════ */

function CardPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEMO_CARDS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isInView]);

  const card = DEMO_CARDS[activeIndex];
  const Icon = card.icon;

  return (
    <div ref={ref} className="relative w-full max-w-[380px]">
      {/* Glow behind card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${activeIndex}`}
          className="pointer-events-none absolute -inset-10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className={cn(
              "h-[280px] w-[280px] rounded-full opacity-20 blur-[100px]",
              card.glowClass
            )}
          />
        </motion.div>
      </AnimatePresence>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-2xl shadow-black/10 dark:shadow-black/30"
        >
          {/* Type badge */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                card.badgeBg
              )}
            >
              <Icon className={cn("size-4", card.badgeText)} />
            </div>
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                card.badgeText
              )}
            >
              {card.type}
            </span>
            <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              10s
            </div>
          </div>

          {/* Question */}
          <p className="mb-4 text-sm font-medium leading-snug">
            {card.question}
          </p>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {card.options.map((opt) => (
              <div
                key={opt.letter}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] transition-colors",
                  opt.selected
                    ? "border-primary/30 bg-primary/[0.06]"
                    : "border-transparent bg-surface-1/60"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    opt.selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 text-muted-foreground"
                  )}
                >
                  {opt.letter}
                </span>
                <span className={cn("flex-1", opt.selected && "font-medium")}>
                  {opt.text}
                </span>
                {opt.selected && (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                )}
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {DEMO_CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        2-minute sprints. Instant AI feedback.
      </p>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   MODES SECTION  -  Three distinctive mode cards
   ═════════════════════════════════════════════════════════════════════════════ */

const MODE_DATA = [
  {
    title: "Learn",
    description:
      "Guided micro-lessons with AI teaching preambles. Master concepts before you're tested.",
    icon: BookOpen,
    cta: "Start learning",
    cardClass: "border-mode-learn/25 hover:border-mode-learn/50",
    iconWrapClass: "bg-mode-learn/15",
    iconClass: "text-mode-learn",
    accentColor: "var(--mode-learn)",
  },
  {
    title: "Practice",
    description:
      "Adaptive sprints that scale to your performance. Build speed and accuracy under pressure.",
    icon: Target,
    cta: "Start practicing",
    cardClass: "border-mode-practice/25 hover:border-mode-practice/50",
    iconWrapClass: "bg-mode-practice/15",
    iconClass: "text-mode-practice",
    accentColor: "var(--mode-practice)",
  },
  {
    title: "Compete",
    description:
      "Head-to-head duels with Elo ranking. AI evaluates both players across 6 dimensions.",
    icon: Swords,
    cta: "Enter the arena",
    cardClass: "border-mode-compete/25 hover:border-mode-compete/50",
    iconWrapClass: "bg-mode-compete/15",
    iconClass: "text-mode-compete",
    accentColor: "var(--mode-compete)",
  },
] as const;

function ModesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ type: "spring", ...SPRING }}
          className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Three Paths to Mastery
        </motion.h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {MODE_DATA.map((mode, i) => {
            const ModeIcon = mode.icon;
            return (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 24 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
                }
                transition={{ type: "spring", ...SPRING, delay: i * 0.1 }}
              >
                <Link
                  href="/sign-up"
                  className={cn(
                    "group flex flex-col gap-4 rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
                    mode.cardClass
                  )}
                  style={{
                    background: `linear-gradient(to bottom, color-mix(in oklch, ${mode.accentColor} 8%, transparent), transparent)`,
                  }}
                >
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl",
                      mode.iconWrapClass
                    )}
                  >
                    <ModeIcon className={cn("size-6", mode.iconClass)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{mode.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {mode.cta}
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   HOW IT WORKS  -  3-step flow
   ═════════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: "01",
    title: "Choose a Skill",
    desc: "Pick from 8 business skills  -  from GTM Strategy to Financial Statement Analysis, Valuation, and more.",
    icon: Award,
  },
  {
    num: "02",
    title: "Sprint Through Cards",
    desc: "Answer interactive micro-challenges in under 2 minutes. Spot signals, make tradeoffs, rank priorities.",
    icon: Play,
  },
  {
    num: "03",
    title: "Get AI Evaluation",
    desc: "Claude AI scores you across 6 dimensions and provides personalized feedback to accelerate your growth.",
    icon: Brain,
  },
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative border-t border-border/30 px-5 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ type: "spring", ...SPRING }}
          className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          How It Works
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ type: "spring", ...SPRING, delay: i * 0.12 }}
                className="text-center sm:text-left"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 sm:mx-0">
                  <StepIcon className="size-5 text-primary" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {step.num}
                </div>
                <h3 className="text-base font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ═════════════════════════════════════════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section className="relative px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", ...SPRING }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent p-8 sm:p-12"
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to prove your skills?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Free forever. No credit card required.
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-6 min-h-[48px] rounded-xl px-8 text-base font-bold shadow-lg shadow-primary/25"
          >
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
