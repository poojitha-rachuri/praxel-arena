import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Get the svix headers
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await request.text();

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle events
  const eventType = event.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;

    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      console.error("No email address found for user:", id);
      return NextResponse.json(
        { error: "No email address found" },
        { status: 400 }
      );
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          name,
          imageUrl: image_url ?? null,
        },
      });
      console.log("Created user:", id);
    } catch (error) {
      // Handle duplicate - user might already exist
      console.error("Failed to create user:", error);
      // Try to update instead
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email: primaryEmail,
          name,
          imageUrl: image_url ?? null,
        },
        create: {
          clerkId: id,
          email: primaryEmail,
          name,
          imageUrl: image_url ?? null,
        },
      });
    }
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, image_url } = event.data;

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          name,
          imageUrl: image_url ?? null,
        },
      });
      console.log("Updated user:", id);
    } catch (error) {
      console.error("Failed to update user:", error);
      // User might not exist yet - create them
    }
  }

  return NextResponse.json({ success: true });
}
