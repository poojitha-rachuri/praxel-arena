import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/learn");
  }

  return <LandingPage />;
}
