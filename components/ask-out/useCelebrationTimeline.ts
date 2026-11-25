"use client";

import { useEffect, useMemo, useState } from "react";

export interface TimelineStep {
  key: string;
  /** Milliseconds after the timeline starts. */
  at: number;
}

/**
 * Declarative animation timeline: one chained setTimeout walks the sorted steps and
 * marks each as reached, so components read phases instead of juggling a pile of
 * independent timers. Re-renders once per step (never per frame) and clears itself
 * on unmount.
 *
 * `steps` must be a stable reference (a module-level constant) — it is a dependency.
 */
export function useCelebrationTimeline(steps: readonly TimelineStep[], enabled = true) {
  const [reachedKeys, setReachedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const ordered = [...steps].sort((a, b) => a.at - b.at);
    let index = 0;
    let elapsed = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      if (index >= ordered.length) return;
      const step = ordered[index];
      timeoutId = setTimeout(() => {
        elapsed = step.at;
        index += 1;
        setReachedKeys(ordered.slice(0, index).map((entry) => entry.key));
        scheduleNext();
      }, Math.max(step.at - elapsed, 0));
    };

    scheduleNext();

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [steps, enabled]);

  return useMemo(() => new Set(reachedKeys), [reachedKeys]);
}
