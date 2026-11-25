"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

interface InteractiveCursorProps {
  children: ReactNode;
  className?: string;
}

const MAX_SPARKLES = 5;
const SPAWN_INTERVAL_MS = 90;
let sparkleIdCounter = 0;

/**
 * Desktop-only trailing sparkle scoped to whatever it wraps. No-ops on touch devices
 * and when the user prefers reduced motion — the cursor itself is never modified.
 */
export default function InteractiveCursor({ children, className = "" }: InteractiveCursorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastSpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const latestPointRef = useRef<{ x: number; y: number } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!pointerQuery.matches && !motionQuery.matches);
    update();
    pointerQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      pointerQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  const handleSettled = useCallback((id: number) => {
    setSparkles((current) => current.filter((sparkle) => sparkle.id !== id));
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      latestPointRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const now = performance.now();
        const point = latestPointRef.current;
        if (!point || now - lastSpawnRef.current < SPAWN_INTERVAL_MS) return;
        lastSpawnRef.current = now;
        sparkleIdCounter += 1;
        setSparkles((current) => [...current.slice(-(MAX_SPARKLES - 1)), { id: sparkleIdCounter, ...point }]);
      });
    },
    [enabled],
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`} onPointerMove={handlePointerMove}>
      {children}
      {enabled && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              className="absolute h-1.5 w-1.5 rounded-full bg-gold animate-cursor-trail-fade"
              style={{ left: sparkle.x, top: sparkle.y }}
              onAnimationEnd={() => handleSettled(sparkle.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
