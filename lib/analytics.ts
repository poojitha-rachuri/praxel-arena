export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, properties);
  }).catch(() => {});
}
