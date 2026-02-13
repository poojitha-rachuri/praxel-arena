import {
  Layers,
  Briefcase,
  Megaphone,
  Rocket,
  TrendingUp,
  Handshake,
  Settings2,
  type LucideIcon,
} from "lucide-react";

/**
 * Map career outcome slugs → Lucide icons for consistent styling.
 */
export const CAREER_ICONS: Record<string, LucideIcon> = {
  "product-management": Layers,
  consulting: Briefcase,
  marketing: Megaphone,
  founder: Rocket,
  growth: TrendingUp,
  "sales-strategy": Handshake,
  "business-operations": Settings2,
};

/** Fallback icon when slug is unknown. */
export const DEFAULT_CAREER_ICON: LucideIcon = Briefcase;

export function getCareerIcon(slug: string): LucideIcon {
  return CAREER_ICONS[slug] ?? DEFAULT_CAREER_ICON;
}
