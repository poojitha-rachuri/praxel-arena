"use client";

import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export default function AppShell({
  children,
  hideBottomNav = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-12 pb-[76px]">{children}</main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
