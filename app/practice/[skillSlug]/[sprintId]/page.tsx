// TODO: SprintRunner in PRACTICE mode
export default async function PracticeSprintPage({
  params,
}: {
  params: Promise<{ skillSlug: string; sprintId: string }>;
}) {
  const { skillSlug, sprintId } = await params;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <p className="text-muted-foreground">
        Practice: {skillSlug} / {sprintId}
      </p>
    </main>
  );
}
