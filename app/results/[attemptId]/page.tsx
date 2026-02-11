// TODO: Score reveal + debrief + updated skill graph
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <p className="text-muted-foreground">Results: {attemptId}</p>
    </main>
  );
}
