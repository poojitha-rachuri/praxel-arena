import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Target, Swords, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/learn");
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="max-w-lg text-4xl font-bold tracking-tight sm:text-5xl">
          Where Business Skills Become{" "}
          <span className="text-primary">Visible</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Micro-sprints. AI-powered evaluation. Skill credentials that matter.
        </p>
        <Button asChild size="lg" className="mt-8 gap-2">
          <Link href="/sign-up">
            Get Started Free
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="size-6 text-primary" />
            </div>
            <h3 className="font-semibold">Learn</h3>
            <p className="text-sm text-muted-foreground">
              Micro-lessons with teaching preambles and instant feedback
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Target className="size-6 text-primary" />
            </div>
            <h3 className="font-semibold">Practice</h3>
            <p className="text-sm text-muted-foreground">
              Adaptive difficulty that scales to your performance
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Swords className="size-6 text-primary" />
            </div>
            <h3 className="font-semibold">Compete</h3>
            <p className="text-sm text-muted-foreground">
              Head-to-head duels with Elo ranking and AI analysis
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
