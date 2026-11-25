"use client";

import { useMemo } from "react";
import type { Point } from "./geometry";

type ParticleKind = "heart" | "sparkle" | "dot" | "petal";

/** Repeating mix — hearts lead, sparkles accent, dots and petals soften it. */
const KIND_CYCLE: ParticleKind[] = [
  "heart",
  "sparkle",
  "heart",
  "dot",
  "petal",
  "heart",
  "sparkle",
  "dot",
];

interface BurstParticle {
  id: number;
  kind: ParticleKind;
  dx: number;
  dy: number;
  rotate: number;
  endScale: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface ShowerParticle {
  id: number;
  kind: ParticleKind;
  leftPercent: number;
  rising: boolean;
  driftVw: number;
  rotate: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function buildBurst(count: number, spread: number): BurstParticle[] {
  return Array.from({ length: count }, (_, index) => {
    // Evenly spaced angles with jitter — controlled randomness, never a uniform ring.
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.55;
    const reach = spread * (0.42 + Math.random() * 0.78);
    return {
      id: index,
      kind: KIND_CYCLE[index % KIND_CYCLE.length],
      dx: Math.cos(angle) * reach,
      // Squashed vertically and biased upward so it reads as a lift, not an explosion.
      dy: Math.sin(angle) * reach * 0.8 - spread * 0.2,
      rotate: (Math.random() - 0.5) * 220,
      endScale: 0.3 + Math.random() * 0.5,
      size: 0.6 + Math.random() * 0.7,
      duration: 900 + Math.random() * 620,
      delay: Math.random() * 260,
      opacity: 0.7 + Math.random() * 0.3,
    };
  });
}

function buildShower(count: number, sizeScale: number): ShowerParticle[] {
  return Array.from({ length: count }, (_, index) => {
    // Every 4th one floats up instead of falling.
    const rising = index % 4 === 3;
    return {
      id: index,
      kind: KIND_CYCLE[index % KIND_CYCLE.length],
      leftPercent: ((index + 0.5) / count) * 100 + (Math.random() - 0.5) * 8,
      rising,
      driftVw: (Math.random() - 0.5) * 14,
      rotate: (Math.random() - 0.5) * 90,
      size: (0.65 + Math.random() * 0.6) * sizeScale,
      duration: (rising ? 4600 : 4000) + Math.random() * 1600,
      delay: Math.random() * 1400,
      opacity: 0.45 + Math.random() * 0.45,
    };
  });
}

interface KindProps {
  className: string;
  style: React.CSSProperties;
  content: string | null;
}

/** One DOM node per particle: the animated element is the glyph or the shape itself. */
function kindProps(kind: ParticleKind, size: number): KindProps {
  switch (kind) {
    case "heart":
      return {
        className: "text-rose-deep",
        style: { fontSize: `${size}rem`, lineHeight: 1 },
        content: "❤",
      };
    case "sparkle":
      return {
        className: "",
        style: { fontSize: `${size * 0.85}rem`, lineHeight: 1 },
        content: "✨",
      };
    case "petal":
      return {
        className: "block rounded-[100%_0_100%_0] bg-rose/70",
        style: { width: `${size * 0.55}rem`, height: `${size * 0.95}rem` },
        content: null,
      };
    case "dot":
    default:
      return {
        className: "block rounded-full bg-gold/80",
        style: { width: `${size * 0.32}rem`, height: `${size * 0.32}rem` },
        content: null,
      };
  }
}

interface CelebrationParticlesProps {
  /** "burst" throws from the pressed button, "shower" drifts across the whole screen. */
  variant: "burst" | "shower";
  count: number;
  /** Viewport coordinates the burst originates from. Ignored by "shower". */
  origin?: Point;
  /** Shrinks glyphs and travel distance on small phones. */
  sizeScale?: number;
  spread?: number;
}

export default function CelebrationParticles({
  variant,
  count,
  origin,
  sizeScale = 1,
  spread = 260,
}: CelebrationParticlesProps) {
  // Generated once per mount. The layer is unmounted when its phase ends, which is
  // also how the particles are cleaned up — no lingering invisible nodes.
  const burst = useMemo(
    () => (variant === "burst" ? buildBurst(count, spread) : []),
    [variant, count, spread],
  );
  const shower = useMemo(
    () => (variant === "shower" ? buildShower(count, sizeScale) : []),
    [variant, count, sizeScale],
  );

  if (variant === "burst") {
    if (!origin) return null;
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {burst.map((particle) => {
          const kind = kindProps(particle.kind, particle.size * sizeScale);
          return (
            <span
              key={particle.id}
              className={`absolute animate-celebration-burst ${kind.className}`}
              style={
                {
                  ...kind.style,
                  left: origin.x,
                  top: origin.y,
                  "--particle-x": `${particle.dx * sizeScale}px`,
                  "--particle-y": `${particle.dy * sizeScale}px`,
                  "--particle-rotate": `${particle.rotate}deg`,
                  "--particle-scale": particle.endScale,
                  "--particle-opacity": particle.opacity,
                  "--particle-duration": `${particle.duration}ms`,
                  "--particle-delay": `${particle.delay}ms`,
                } as React.CSSProperties
              }
            >
              {kind.content}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {shower.map((particle) => {
        const kind = kindProps(particle.kind, particle.size);
        return (
          <span
            key={particle.id}
            className={`absolute ${
              particle.rising ? "animate-celebration-rise" : "animate-celebration-drift"
            } ${kind.className}`}
            style={
              {
                ...kind.style,
                left: `${particle.leftPercent}%`,
                top: particle.rising ? "100%" : "-8%",
                "--particle-x": `${particle.driftVw}vw`,
                "--particle-rotate": `${particle.rotate}deg`,
                "--particle-opacity": particle.opacity,
                "--particle-duration": `${particle.duration}ms`,
                "--particle-delay": `${particle.delay}ms`,
              } as React.CSSProperties
            }
          >
            {kind.content}
          </span>
        );
      })}
    </div>
  );
}
