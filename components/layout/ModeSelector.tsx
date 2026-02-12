"use client";

import { useRouter, usePathname } from "next/navigation";
import { BookOpen, Target, Swords } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modes = [
  { value: "learn", label: "Learn", icon: BookOpen },
  { value: "practice", label: "Practice", icon: Target },
  { value: "compete", label: "Compete", icon: Swords },
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
        {modes.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex-1 gap-1.5">
            <Icon className="size-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
