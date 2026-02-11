// TODO: Onboarding flow
// 1. Pick 1-3 career goals (CareerSelector)
// 2. See skill recommendations based on career choices
// 3. Start first sprint
// Redirect here if user.onboardingComplete === false
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Welcome to Praxel Arena</h1>
      <p className="mt-2 text-muted-foreground">
        Let&apos;s set up your profile
      </p>
    </main>
  );
}
