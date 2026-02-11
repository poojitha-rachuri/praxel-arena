import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Target, Swords, ArrowRight, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/learn");
  }

  return (
    <main className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Background gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-mode-learn/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-mode-compete/8 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        {/* AI badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full bg-surface-2/80 border border-border/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Brain className="size-3.5 text-primary" />
          Powered by Claude AI
        </div>

        <h1 className="max-w-2xl text-5xl font-extrabold tracking-tight sm:text-6xl leading-[1.1]">
          Master Business Skills{" "}
          <span className="bg-gradient-to-r from-primary via-info to-insight bg-clip-text text-transparent">
            That Matter
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground leading-relaxed">
          Micro-sprints. AI-powered evaluation. Six dimensions of skill credentialing for business professionals.
        </p>

        {/* Stats */}
        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-warning" />
            6 Skills
          </span>
          <span className="text-border">·</span>
          <span>3 Modes</span>
          <span className="text-border">·</span>
          <span>AI Evaluation</span>
        </div>

        {/* CTA */}
        <Button
          asChild
          size="lg"
          className="group mt-8 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground min-h-[48px] text-base font-semibold px-8 rounded-xl shadow-lg shadow-primary/20"
        >
          <Link href="/sign-up">
            Get Started Free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/60 bg-surface-1/50 backdrop-blur-sm px-4 py-16">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {/* Learn */}
          <div className="flex flex-col items-center gap-3 text-center p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-mode-learn/15">
              <BookOpen className="size-7 text-mode-learn" />
            </div>
            <h3 className="text-lg font-bold">Learn</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Micro-lessons with teaching preambles and instant feedback
            </p>
          </div>

          {/* Practice */}
          <div className="flex flex-col items-center gap-3 text-center p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-mode-practice/15">
              <Target className="size-7 text-mode-practice" />
            </div>
            <h3 className="text-lg font-bold">Practice</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Adaptive difficulty that scales to your performance
            </p>
          </div>

          {/* Compete */}
          <div className="flex flex-col items-center gap-3 text-center p-5 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-mode-compete/15">
              <Swords className="size-7 text-mode-compete" />
            </div>
            <h3 className="text-lg font-bold">Compete</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Head-to-head duels with Elo ranking and AI analysis
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
