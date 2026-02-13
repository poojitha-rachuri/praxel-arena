"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCareerIcon } from "@/lib/utils/career-icons";
import Link from "next/link";

interface CareerCardData {
  name: string;
  slug: string;
  icon: string | null;
  matchPercentage: number;
}

interface CareerCarouselProps {
  careers: CareerCardData[];
}

function MatchRing({ percentage }: { percentage: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted/40"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        className="text-primary"
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[10px] font-bold"
      >
        {percentage}%
      </text>
    </svg>
  );
}

export default function CareerCarousel({ careers }: CareerCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const single = careers.length <= 1;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || single) return;
    const cardWidth = el.scrollWidth / careers.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, careers.length - 1));
  }, [careers.length, single]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || single) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, single]);

  if (careers.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-3 pb-1",
          !single && "overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
        )}
      >
        {careers.map((career) => {
          const Icon = getCareerIcon(career.slug);
          return (
            <Link
              key={career.slug}
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 snap-center shrink-0 transition-colors hover:bg-card/80",
                single ? "flex-1" : "min-w-[240px]"
              )}
            >
              <MatchRing percentage={career.matchPercentage} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold truncate">
                    {career.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Career match
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dot indicators for multi-career */}
      {!single && (
        <div className="flex justify-center gap-1">
          {careers.map((career, i) => (
            <div
              key={career.slug}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === activeIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
