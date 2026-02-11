import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { User } from "@/app/generated/prisma/client";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Ensures the authenticated Clerk user exists in the Prisma database.
 * Fast path (~8ms): user already exists, returns from DB.
 * Slow path (~120ms, first visit only): creates user from Clerk data.
 *
 * This is the fallback for when the Clerk webhook doesn't fire.
 */
export async function ensureUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Fast path: user already exists (JWT read + DB lookup, no network call)
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  // Slow path: user not in DB — fetch from Clerk Backend API (one-time cost)
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ??
    `${clerkId}@placeholder.local`;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = clerkUser.imageUrl ?? null;

  return upsertWithRetry(clerkId, email, name, imageUrl);
}

/**
 * Upsert with P2002 retry: handles the race condition where two concurrent
 * requests both pass findUnique before either inserts.
 */
async function upsertWithRetry(
  clerkId: string,
  email: string,
  name: string | null,
  imageUrl: string | null
): Promise<User> {
  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, imageUrl },
      create: { clerkId, email, name, imageUrl },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Unique constraint race — retry once, the row now exists
      return await prisma.user.upsert({
        where: { clerkId },
        update: { email, name, imageUrl },
        create: { clerkId, email, name, imageUrl },
      });
    }
    throw error;
  }
}
