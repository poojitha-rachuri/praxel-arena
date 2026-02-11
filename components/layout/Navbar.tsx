"use client";

import { UserButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <Link href="/learn" className="flex items-center gap-2">
        <Zap className="size-5 text-primary" />
        <span className="text-base font-bold tracking-tight">
          Praxel Arena
        </span>
      </Link>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "size-8",
          },
        }}
      />
    </header>
  );
}
