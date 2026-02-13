import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getModePageData } from "@/lib/data/mode-page-data";
import AppShell from "@/components/layout/AppShell";
import SkillAccordion from "@/components/layout/SkillAccordion";
import CareerCarousel from "@/components/layout/CareerCarousel";

export default async function LearnPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const data = await getModePageData(user.id, "LEARN");

  return (
    <AppShell>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Learn</h1>
          <p className="text-xs text-muted-foreground">
            Guided micro-lessons across 6 business skills
          </p>
        </div>

        {data.allCareerMatches.length > 0 && (
          <CareerCarousel careers={data.allCareerMatches} />
        )}

        <SkillAccordion
          skills={data.skills}
          topics={data.topics}
          sprints={data.sprints}
          completedSprints={data.completedSprints}
          mode="LEARN"
          basePath="/learn"
        />
      </div>
    </AppShell>
  );
}
