"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modes = [
  { value: "learn", label: "Learn" },
  { value: "practice", label: "Practice" },
  { value: "compete", label: "Compete" },
] as const;

export default function ModeSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const activeMode =
    modes.find((m) => pathname.startsWith(`/${m.value}`))?.value ?? "learn";

  return (
    <Tabs
      value={activeMode}
      onValueChange={(value) => router.push(`/${value}`)}
      className="w-full"
    >
      <TabsList className="w-full">
        {modes.map((mode) => (
          <TabsTrigger key={mode.value} value={mode.value} className="flex-1">
            {mode.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
