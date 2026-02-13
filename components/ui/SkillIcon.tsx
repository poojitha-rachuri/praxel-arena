import {
  BarChart3,
  Rocket,
  Calculator,
  DollarSign,
  Scale,
  MessageSquare,
  FileSpreadsheet,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  "data-interpretation": BarChart3,
  "gtm-strategy": Rocket,
  "guesstimation": Calculator,
  "pricing-monetization": DollarSign,
  "prioritization": Scale,
  "stakeholder-communication": MessageSquare,
  "financial-statement-analysis": FileSpreadsheet,
  valuation: Landmark,
};

interface SkillIconProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SkillIcon({ slug, size = "md", className }: SkillIconProps) {
  const Icon = SKILL_ICON_MAP[slug] ?? BarChart3;
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };
  const iconSizes = { sm: "size-4", md: "size-5", lg: "size-6" };

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center shrink-0 bg-primary/10",
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], "text-primary")} />
    </div>
  );
}
