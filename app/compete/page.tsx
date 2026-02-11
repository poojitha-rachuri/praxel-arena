import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import CompeteLobby from "@/components/arena/CompeteLobby";

export default async function CompetePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  // Get internal user ID
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  // Fetch skills
  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <CompeteLobby skills={skills} userId={user?.id ?? ""} />
    </AppShell>
  );
}
