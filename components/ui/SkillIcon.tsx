import {
  BarChart3,
  Rocket,
  Calculator,
  DollarSign,
  Scale,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
  "data-interpretation": { icon: BarChart3, bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  "gtm-strategy": { icon: Rocket, bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  "guesstimation": { icon: Calculator, bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  "pricing-monetization": { icon: DollarSign, bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  "prioritization": { icon: Scale, bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  "stakeholder-communication": { icon: MessageSquare, bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
};

const DEFAULT_ICON = { icon: BarChart3, bg: "bg-muted", text: "text-muted-foreground" };

interface SkillIconProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SkillIcon({ slug, size = "md", className }: SkillIconProps) {
  const config = SKILL_ICON_MAP[slug] ?? DEFAULT_ICON;
  const Icon = config.icon;
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };
  const iconSizes = { sm: "size-4", md: "size-5", lg: "size-6" };

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center shrink-0",
        sizeClasses[size],
        config.bg,
        className
      )}
    >
      <Icon className={cn(iconSizes[size], config.text)} />
    </div>
  );
}
