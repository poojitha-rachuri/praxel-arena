import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getModePageData } from "@/lib/data/mode-page-data";
import AppShell from "@/components/layout/AppShell";
import CareerProgressBanner from "@/components/layout/CareerProgressBanner";
import SkillAccordion from "@/components/layout/SkillAccordion";
import { ActiveChallengeBanner } from "@/components/gamification/ActiveChallengeBanner";
import ModeWelcomeBanner from "@/components/layout/ModeWelcomeBanner";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { skill: initialSkill } = await searchParams;

  const data = await getModePageData(user.id, "PRACTICE");

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sharpen your skills with harder questions and AI debriefs
          </p>
        </div>

        <ModeWelcomeBanner
          mode="PRACTICE"
          hasCompletions={Object.keys(data.completedSprints).length > 0}
        />

        <ActiveChallengeBanner />

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
          topics={data.topics}
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
