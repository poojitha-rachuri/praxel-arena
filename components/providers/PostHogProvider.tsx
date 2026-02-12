"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

function PostHogIdentifier() {
  const { isSignedIn, userId } = useAuth();
  const ph = usePostHog();

  useEffect(() => {
    if (isSignedIn && userId && ph) {
      ph.identify(userId);
    } else if (!isSignedIn && ph) {
      ph.reset();
    }
  }, [isSignedIn, userId, ph]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  );
}
