import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { duelId } = await params;

  try {
    // Look up user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: {
        skill: true,
        sprint: {
          include: {
            interactions: { orderBy: { order: "asc" } },
          },
        },
        player1: {
          select: { id: true, name: true, imageUrl: true },
        },
        player2: {
          select: { id: true, name: true, imageUrl: true },
        },
        winner: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    // Verify user is a participant
    if (duel.player1Id !== user.id && duel.player2Id !== user.id) {
      return NextResponse.json(
        { error: "Not a participant in this duel" },
        { status: 403 }
      );
    }

    return NextResponse.json({ duel });
  } catch (error) {
    console.error("Failed to fetch duel:", error);
    return NextResponse.json(
      { error: "Failed to fetch duel" },
      { status: 500 }
    );
  }
}
