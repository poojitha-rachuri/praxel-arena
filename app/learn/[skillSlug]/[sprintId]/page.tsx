// TODO: SprintRunner in LEARN mode
export default async function LearnSprintPage({
  params,
}: {
  params: Promise<{ skillSlug: string; sprintId: string }>;
}) {
  const { skillSlug, sprintId } = await params;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <p className="text-muted-foreground">
        Sprint: {skillSlug} / {sprintId}
      </p>
    </main>
  );
}
