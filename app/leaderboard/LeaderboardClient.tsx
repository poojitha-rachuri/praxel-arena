"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Leaderboard from "@/components/arena/Leaderboard";

interface LeaderboardClientProps {
  skills: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
  currentUserId?: string;
}

export default function LeaderboardClient({
  skills,
  currentUserId,
}: LeaderboardClientProps) {
  const [activeSkill, setActiveSkill] = useState(skills[0]?.slug ?? "");

  if (skills.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-muted-foreground">
          No skills available yet. Check back soon!
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top performers by skill
        </p>
      </motion.div>

      <Tabs
        value={activeSkill}
        onValueChange={setActiveSkill}
        className="mt-6"
      >
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          {skills.map((skill) => (
            <TabsTrigger key={skill.slug} value={skill.slug} className="gap-1">
              {skill.icon && <span>{skill.icon}</span>}
              <span className="truncate">{skill.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {skills.map((skill) => (
          <TabsContent key={skill.slug} value={skill.slug} className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Leaderboard
                skillSlug={skill.slug}
                currentUserId={currentUserId}
              />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Bottom padding for mobile nav */}
      <div className="h-20" />
    </main>
  );
}
