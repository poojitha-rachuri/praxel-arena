"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronDown, Lock, Check, Play, RotateCcw } from "lucide-react";
import { CARD_SPRING } from "@/lib/utils/constants";
import type { TopicMeta, SprintMeta } from "@/lib/data/mode-page-data";

interface SkillNodePathProps {
  skill: { id: string; name: string; slug: string; icon: string | null };
  topics: TopicMeta[];
  sprints: SprintMeta[];
  completedSprints: Record<string, number>;
  mode: "LEARN" | "PRACTICE";
  basePath: string;
}

type NodeState = "completed" | "active" | "locked";

interface PathNode {
  sprint: SprintMeta;
  state: NodeState;
  score: number | null;
  globalIndex: number;
}

interface PathSection {
  topic: TopicMeta | null;
  nodes: PathNode[];
}

export default function SkillNodePath({
  skill,
  topics,
  sprints,
  completedSprints,
  mode,
  basePath,
}: SkillNodePathProps) {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);
  const activeNodeRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showJumpBack, setShowJumpBack] = useState(false);

  // Build the path sections from topics and sprints
  const sections = useMemo(() => {
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const result: PathSection[] = [];
    let globalIndex = 0;
    let foundActive = false;

    // Group sprints by topic
    const sprintsByTopic = new Map<string | null, SprintMeta[]>();
    for (const sprint of sprints) {
      const key = sprint.topicId;
      const existing = sprintsByTopic.get(key) ?? [];
      existing.push(sprint);
      sprintsByTopic.set(key, existing);
    }

    // Build sections in topic order
    const orderedTopicIds = topics.map((t) => t.id);

    // Add sprints with topics first
    for (const topicId of orderedTopicIds) {
      const topicSprints = sprintsByTopic.get(topicId) ?? [];
      if (topicSprints.length === 0) continue;

      const nodes: PathNode[] = topicSprints.map((sprint) => {
        const isCompleted = completedSprints[sprint.id] !== undefined;
        let state: NodeState;
        if (isCompleted) {
          state = "completed";
        } else if (!foundActive) {
          state = "active";
          foundActive = true;
        } else {
          state = "locked";
        }
        return {
          sprint,
          state,
          score: completedSprints[sprint.id] ?? null,
          globalIndex: globalIndex++,
        };
      });

      result.push({ topic: topicMap.get(topicId) ?? null, nodes });
    }

    // Add sprints without topics
    const noTopicSprints = sprintsByTopic.get(null) ?? [];
    if (noTopicSprints.length > 0) {
      const nodes: PathNode[] = noTopicSprints.map((sprint) => {
        const isCompleted = completedSprints[sprint.id] !== undefined;
        let state: NodeState;
        if (isCompleted) {
          state = "completed";
        } else if (!foundActive) {
          state = "active";
          foundActive = true;
        } else {
          state = "locked";
        }
        return {
          sprint,
          state,
          score: completedSprints[sprint.id] ?? null,
          globalIndex: globalIndex++,
        };
      });
      result.push({ topic: null, nodes });
    }

    return result;
  }, [topics, sprints, completedSprints]);

  // Auto-scroll to active node on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      activeNodeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Track if active node is visible for jump-back button
  useEffect(() => {
    if (!activeNodeRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowJumpBack(!entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(activeNodeRef.current);
    return () => observer.disconnect();
  }, [sections]);

  const handleJumpBack = useCallback(() => {
    activeNodeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const handleNodeTap = useCallback(
    (node: PathNode) => {
      if (node.state === "locked") return;
      setSelectedNode(node);
    },
    []
  );

  const handleStartSprint = useCallback(
    (node: PathNode) => {
      router.push(`${basePath}/${skill.slug}/${node.sprint.id}`);
    },
    [router, basePath, skill.slug]
  );

  // Calculate S-curve x positions
  const getNodeX = (index: number, containerWidth: number) => {
    const center = containerWidth / 2;
    const amplitude = Math.min(80, (containerWidth - 80) / 2 - 28);
    return center + amplitude * Math.sin(index * (Math.PI / 2.5));
  };

  return (
    <div className="flex h-[calc(100vh-108px)] flex-col" ref={scrollContainerRef}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => router.push(`${basePath}`)}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-lg">{skill.icon || "📊"}</span>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{skill.name}</h1>
          <p className="text-[10px] text-muted-foreground">
            {mode === "LEARN" ? "Learning Path" : "Practice Path"}
          </p>
        </div>
      </div>

      {/* Scrollable path */}
      <div className="relative flex-1 overflow-y-auto px-4 pb-24">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Topic divider */}
            {section.topic && (
              <div className="my-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {section.topic.icon || ""} {section.topic.name}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {/* Nodes */}
            <div className="relative" style={{ height: section.nodes.length * 80 }}>
              {/* Connecting lines (SVG) */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width="100%"
                height={section.nodes.length * 80}
              >
                {section.nodes.map((node, nIdx) => {
                  if (nIdx === 0) return null;
                  const prevNode = section.nodes[nIdx - 1];
                  const w = 343; // ~375 - 32px padding
                  const x1 = getNodeX(prevNode.globalIndex, w);
                  const y1 = (nIdx - 1) * 80 + 28;
                  const x2 = getNodeX(node.globalIndex, w);
                  const y2 = nIdx * 80 + 28;
                  const midY = (y1 + y2) / 2;

                  return (
                    <path
                      key={nIdx}
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      fill="none"
                      strokeWidth="2"
                      className={
                        node.state === "locked"
                          ? "stroke-muted"
                          : "stroke-primary/40"
                      }
                      strokeDasharray={node.state === "locked" ? "4 4" : "none"}
                    />
                  );
                })}
              </svg>

              {/* Node circles */}
              {section.nodes.map((node, nIdx) => {
                const w = 343;
                const x = getNodeX(node.globalIndex, w);

                return (
                  <motion.button
                    key={node.sprint.id}
                    ref={node.state === "active" ? activeNodeRef : undefined}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: node.globalIndex * 0.04,
                      type: "spring",
                      ...CARD_SPRING,
                    }}
                    whileTap={node.state !== "locked" ? { scale: 0.9 } : undefined}
                    onClick={() => handleNodeTap(node)}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: x - 28,
                      top: nIdx * 80,
                      width: node.state === "active" ? 56 : 48,
                      height: node.state === "active" ? 56 : 48,
                    }}
                  >
                    {/* Node visual */}
                    <div
                      className={`flex items-center justify-center rounded-full transition-all ${
                        node.state === "completed"
                          ? "size-12 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : node.state === "active"
                            ? "size-14 bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                            : "size-12 bg-muted text-muted-foreground opacity-50"
                      }`}
                    >
                      {node.state === "completed" ? (
                        <Check className="size-5" strokeWidth={3} />
                      ) : node.state === "active" ? (
                        <Play className="size-5 ml-0.5" fill="currentColor" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                    </div>

                    {/* Score badge for completed */}
                    {node.state === "completed" && node.score !== null && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-background px-1.5 py-0.5 text-[9px] font-bold text-emerald-500 ring-1 ring-emerald-500/30">
                        {node.score}
                      </div>
                    )}

                    {/* Active pulse ring */}
                    {node.state === "active" && (
                      <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Jump-back button */}
      <AnimatePresence>
        {showJumpBack && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleJumpBack}
            className="fixed bottom-24 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <ChevronDown className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sprint popup (bottom sheet) */}
      <AnimatePresence>
        {selectedNode && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="fixed inset-0 z-50 bg-black/40"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card p-5 pb-8 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
              <h3 className="text-base font-semibold">
                {selectedNode.sprint.title}
              </h3>
              {selectedNode.sprint.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {selectedNode.sprint.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {selectedNode.sprint.levelLabel && (
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                    {selectedNode.sprint.levelLabel}
                  </span>
                )}
                <span>{selectedNode.sprint.interactionCount} questions</span>
              </div>

              {selectedNode.state === "completed" && selectedNode.score !== null && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                  <Check className="size-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">
                    Score: {selectedNode.score}/100
                  </span>
                </div>
              )}

              <button
                onClick={() => handleStartSprint(selectedNode)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground min-h-[44px]"
              >
                {selectedNode.state === "completed" ? (
                  <>
                    <RotateCcw className="size-4" />
                    Retry Sprint
                  </>
                ) : (
                  <>
                    <Play className="size-4" fill="currentColor" />
                    Start Sprint
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
