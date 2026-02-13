import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getModePageData } from "@/lib/data/mode-page-data";
import AppShell from "@/components/layout/AppShell";
import SkillAccordion from "@/components/layout/SkillAccordion";
import CareerCarousel from "@/components/layout/CareerCarousel";

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

        {data.allCareerMatches.length > 0 && (
          <CareerCarousel careers={data.allCareerMatches} />
        )}

        <SkillAccordion
          skills={data.skills}
          topics={data.topics}
          sprints={data.sprints}
          completedSprints={data.completedSprints}
          mode="PRACTICE"
          basePath="/practice"
        />
      </div>
    </AppShell>
  );
}
