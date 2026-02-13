import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getModePageData } from "@/lib/data/mode-page-data";
import AppShell from "@/components/layout/AppShell";
import SkillCardsGrid from "@/components/layout/SkillCardsGrid";
import { ActiveChallengeBanner } from "@/components/gamification/ActiveChallengeBanner";
import { getCareerIcon } from "@/lib/utils/career-icons";

export default async function PracticePage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const data = await getModePageData(user.id, "PRACTICE");

  return (
    <AppShell>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Practice</h1>
          <p className="text-xs text-muted-foreground">
            Sharpen your skills with harder questions and AI debriefs
          </p>
        </div>

        <ActiveChallengeBanner />

        {data.topCareerMatch && (() => {
          const CareerIcon = getCareerIcon(data.topCareerMatch.slug);
          return (
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-primary/5 px-3 py-2">
              <CareerIcon className="size-4 text-primary" />
              <span className="flex-1 truncate text-xs font-medium">
                Path to {data.topCareerMatch.name}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                {data.topCareerMatch.matchPercentage}%
              </span>
            </div>
          );
        })()}

        <SkillCardsGrid
          skills={data.skills}
          sprints={data.sprints}
          completedSprints={data.completedSprints}
          basePath="/practice"
        />
      </div>
    </AppShell>
  );
}
