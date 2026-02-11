import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const { userId: clerkId } = await auth();

  // Get current user's internal ID (if authenticated)
  let currentUserId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    currentUserId = user?.id;
  }

  // Get all skills for the tab filter
  const skills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, icon: true },
  });

  return (
    <AppShell>
      <LeaderboardClient
        skills={skills}
        currentUserId={currentUserId}
      />
    </AppShell>
  );
}
