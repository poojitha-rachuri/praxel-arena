// TODO: Public profile (same layout, read-only)
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <main className="flex min-h-screen flex-col p-4">
      <p className="text-muted-foreground">Profile: {userId}</p>
    </main>
  );
}
