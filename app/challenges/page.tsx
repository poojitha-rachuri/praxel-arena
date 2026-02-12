import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import ChallengesClient from "./ChallengesClient";

export default async function ChallengesPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  return (
    <AppShell>
      <ChallengesClient />
    </AppShell>
  );
}
