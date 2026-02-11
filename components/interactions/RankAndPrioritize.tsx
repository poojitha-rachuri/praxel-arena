"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock } from "lucide-react";
import type { InteractionOption } from "@/types";

// ─── Sortable Item ──────────────────────────────────────

interface SortableItemProps {
  id: string;
  text: string;
  rank: number;
  isLocked: boolean;
}

function SortableItem({ id, text, rank, isLocked }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        "flex items-center gap-3 min-h-[56px] px-4 py-3 rounded-xl border-2",
        "bg-card text-card-foreground touch-manipulation",
        isDragging &&
          "border-primary bg-primary/10 shadow-lg shadow-primary/20 z-50 scale-[1.02]",
        !isDragging && !isLocked && "border-border",
        isLocked && "border-border/50 opacity-70 cursor-default"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        disabled={isLocked}
        className={cn(
          "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg",
          "touch-manipulation active:bg-muted",
          isLocked && "cursor-default"
        )}
        aria-label={`Drag to reorder: ${text}`}
      >
        <GripVertical
          className={cn(
            "size-5",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />
      </button>

      {/* Rank Number */}
      <span
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          "text-xs font-bold",
          isDragging
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {rank}
      </span>

      {/* Text */}
      <span className="flex-1 text-sm font-medium leading-snug">{text}</span>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────

interface RankAndPrioritizeProps {
  id: string;
  prompt: string;
  options: InteractionOption[];
  correctAnswer: string | null;
  insightAnswer: string | null;
  timeTarget: number;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function RankAndPrioritize({
  prompt,
  options,
  correctAnswer,
  insightAnswer,
  onAnswer,
  disabled = false,
}: RankAndPrioritizeProps) {
  const [items, setItems] = useState(() => options.map((o) => o.id));
  const [isLocked, setIsLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setItems((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    []
  );

  const handleLockIn = useCallback(() => {
    if (isLocked || disabled) return;
    setIsLocked(true);
    setShowResult(true);

    const answer = items.join(",");

    setTimeout(() => {
      onAnswer(answer);
    }, 1200);
  }, [isLocked, disabled, items, onAnswer]);

  // Check if ranking matches correct answer
  const isCorrect = correctAnswer ? items.join(",") === correctAnswer : null;

  const optionMap = new Map(options.map((o) => [o.id, o]));

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Type Badge */}
      <Badge variant="secondary" className="self-start text-xs">
        Rank & Prioritize
      </Badge>

      {/* Prompt */}
      <p className="text-lg font-medium text-foreground leading-relaxed">
        {prompt}
      </p>

      {/* Instruction hint */}
      {!isLocked && (
        <p className="text-xs text-muted-foreground -mt-2">
          Drag items to reorder by priority, then lock in your ranking.
        </p>
      )}

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {items.map((itemId, index) => {
              const option = optionMap.get(itemId);
              if (!option) return null;
              return (
                <SortableItem
                  key={itemId}
                  id={itemId}
                  text={option.text}
                  rank={index + 1}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Lock In Button */}
      {!isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleLockIn}
            disabled={disabled}
            size="lg"
            className="w-full min-h-[44px] text-base font-semibold gap-2"
          >
            <Lock className="size-4" />
            Lock In Ranking
          </Button>
        </motion.div>
      )}

      {/* Result feedback */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className={cn(
            "px-4 py-3 rounded-xl border",
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          )}
        >
          <p
            className={cn(
              "text-sm font-medium",
              isCorrect ? "text-emerald-300" : "text-amber-300"
            )}
          >
            {isCorrect ? "Excellent prioritization!" : "Ranking locked in."}
          </p>
          {insightAnswer && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {insightAnswer}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
