import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  // Fetch all careers with their skill mappings
  const careers = await prisma.careerOutcome.findMany({
    include: {
      skillMaps: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Format for client component
  const formattedCareers = careers.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
  }));

  // Build skill-by-career lookup
  const skillsByCareerId: Record<
    string,
    { id: string; name: string; slug: string; icon: string | null; description: string | null }[]
  > = {};
  for (const career of careers) {
    skillsByCareerId[career.id] = career.skillMaps.map((sm) => sm.skill);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <OnboardingFlow
        careers={formattedCareers}
        skillsByCareerId={skillsByCareerId}
      />
    </main>
  );
}
