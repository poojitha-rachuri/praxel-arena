import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getModePageData } from "@/lib/data/mode-page-data";
import AppShell from "@/components/layout/AppShell";
import ModeSelector from "@/components/layout/ModeSelector";
import CareerProgressBanner from "@/components/layout/CareerProgressBanner";
import SkillAccordion from "@/components/layout/SkillAccordion";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const { skill: initialSkill } = await searchParams;

  const data = await getModePageData(user.id, "PRACTICE");

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4">
        <ModeSelector />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sharpen your skills with harder questions and AI debriefs
          </p>
        </div>

        {data.topCareerMatch && (
          <CareerProgressBanner
            careerName={data.topCareerMatch.name}
            careerIcon={data.topCareerMatch.icon}
            matchPercentage={data.topCareerMatch.matchPercentage}
            completedSkills={data.completedSkillCount}
            totalSkills={data.totalSkillCount}
          />
        )}

        <SkillAccordion
          skills={data.skills}
          sprints={data.sprints}
          mode="PRACTICE"
          basePath="/practice"
          initialSkill={initialSkill}
          completedSprints={data.completedSprints}
        />
      </div>
    </AppShell>
  );
}
