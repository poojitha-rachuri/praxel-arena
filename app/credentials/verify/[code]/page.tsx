import { prisma } from "@/lib/db";
import { Shield, CheckCircle, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

const CREDENTIAL_LABELS: Record<string, string> = {
  PRACTITIONER: "Certified Practitioner",
  EXPERT: "Expert",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
};

const CREDENTIAL_COLORS: Record<string, string> = {
  PRACTITIONER: "text-zinc-300",
  EXPERT: "text-amber-400",
  MASTER: "text-cyan-400",
  GRANDMASTER: "text-violet-300",
};

export default async function CredentialVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const credential = await prisma.credential.findUnique({
    where: { verificationCode: code },
    include: {
      user: { select: { name: true, imageUrl: true } },
      skill: { select: { name: true, icon: true } },
    },
  });

  if (!credential) {
    notFound();
  }

  const label = CREDENTIAL_LABELS[credential.type] ?? credential.type;
  const color = CREDENTIAL_COLORS[credential.type] ?? "text-foreground";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/20">
          <Shield className={`size-8 ${color}`} />
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <CheckCircle className="size-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            Verified Credential
          </span>
        </div>

        <h1 className={`mb-1 text-2xl font-bold ${color}`}>{label}</h1>

        <p className="mb-6 text-muted-foreground">
          {credential.skill.name}
        </p>

        <div className="mb-6 space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Earned by</span>
            <span className="font-medium">{credential.user.name ?? "Anonymous"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Elo at Grant</span>
            <span className="font-mono font-medium tabular-nums">
              {credential.eloAtGrant}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date Earned</span>
            <span className="font-medium">
              {credential.grantedAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <ExternalLink className="mb-1 inline size-3" /> Verified by Praxel
          Arena
        </div>
      </div>
    </div>
  );
}
