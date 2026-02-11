// TODO: Duel SprintRunner
export default async function DuelPage({
  params,
}: {
  params: Promise<{ duelId: string }>;
}) {
  const { duelId } = await params;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <p className="text-muted-foreground">Duel: {duelId}</p>
    </main>
  );
}
