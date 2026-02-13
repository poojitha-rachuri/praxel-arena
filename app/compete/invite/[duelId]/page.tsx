import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import InviteAcceptor from "./InviteAcceptor";

// Prisma CUIDs are 25 chars, alphanumeric starting with 'c'
const CUID_RE = /^c[a-z0-9]{24}$/;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ duelId: string }>;
}) {
  const { duelId } = await params;

  if (!CUID_RE.test(duelId)) {
    redirect("/compete");
  }

  const { userId: clerkId } = await auth();

  // Fetch duel info (public — anyone with the link can see the invite)
  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    include: {
      skill: { select: { name: true, slug: true } },
      player1: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  if (!duel) {
    redirect("/compete");
  }

  // If the user is logged in, find their internal user ID
  let internalUserId: string | null = null;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    internalUserId = user?.id ?? null;
  }

  const isOwnDuel = internalUserId === duel.player1Id;
  const isTaken = duel.status !== "WAITING";

  return (
    <InviteAcceptor
      duelId={duel.id}
      skillName={duel.skill.name}
      challengerName={duel.player1.name ?? "A Praxel user"}
      challengerImage={duel.player1.imageUrl}
      isOwnDuel={isOwnDuel}
      isTaken={isTaken}
      isAuthenticated={!!clerkId}
    />
  );
}
