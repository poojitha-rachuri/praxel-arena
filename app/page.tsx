import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import LandingPage from "@/components/landing/LandingPage";

export default async function HomePage() {
  const { userId: clerkId } = await auth();
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { onboardingComplete: true },
    });
    if (!user || !user.onboardingComplete) {
      redirect("/onboarding");
    }
    redirect("/learn");
  }

  return <LandingPage />;
}
