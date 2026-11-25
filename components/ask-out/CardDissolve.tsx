"use client";

import { useMemo } from "react";
import type { Rect } from "./geometry";

const CORNER_RADIUS = 24;

interface CardDissolveProps {
  /** The question card's real viewport rect, measured at the moment of the press. */
  rect: Rect;
  /** Scales the particle count down on small phones. */
  particleCount: number;
}

interface EdgeParticle {
  id: number;
  x: number;
  y: number;
  outX: number;
  outY: number;
  heart: boolean;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Walks the card's perimeter at even intervals and throws each point outward, away from
 * the edge it came from. Module scope on purpose: the randomness has to live outside
 * render for the React Compiler's purity rules, and it only ever runs once per mount.
 */
function buildEdgeParticles(rect: Rect, count: number): EdgeParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const t = (index + 0.5) / count;
    const side = t * 4;
    let x: number;
    let y: number;
    let outX: number;
    let outY: number;

    if (side < 1) {
      x = rect.x + side * rect.width;
      y = rect.y;
      outX = (Math.random() - 0.5) * 40;
      outY = -30 - Math.random() * 60;
    } else if (side < 2) {
      x = rect.x + rect.width;
      y = rect.y + (side - 1) * rect.height;
      outX = 26 + Math.random() * 50;
      outY = (Math.random() - 0.5) * 50;
    } else if (side < 3) {
      x = rect.x + (3 - side) * rect.width;
      y = rect.y + rect.height;
      outX = (Math.random() - 0.5) * 40;
      outY = 22 + Math.random() * 46;
    } else {
      x = rect.x;
      y = rect.y + (4 - side) * rect.height;
      outX = -26 - Math.random() * 50;
      outY = (Math.random() - 0.5) * 50;
    }

    return {
      id: index,
      x,
      y,
      outX,
      outY,
      heart: index % 3 === 0,
      size: 0.4 + Math.random() * 0.45,
      duration: 1100 + Math.random() * 700,
      delay: t * 620 + Math.random() * 120,
      opacity: 0.55 + Math.random() * 0.4,
    };
  });
}

/** Rounded-rect perimeter: the straight runs plus one full circle of corner arc. */
function perimeterOf(rect: Rect) {
  const w = Math.max(rect.width - CORNER_RADIUS * 2, 0);
  const h = Math.max(rect.height - CORNER_RADIUS * 2, 0);
  return 2 * w + 2 * h + 2 * Math.PI * CORNER_RADIUS;
}

/**
 * Moment 3 — the question card does not fade out, it comes apart into light.
 *
 * Its own outline is traced by a travelling gold hairline (one SVG rect, animated with
 * stroke-dashoffset), while a handful of particles lift off points along that same
 * perimeter. Two elements plus N spans — no hundreds of nodes, and nothing that forces
 * layout: the rect is measured once and every animation is transform/opacity/stroke.
 */
export default function CardDissolve({ rect, particleCount }: CardDissolveProps) {
  const perimeter = useMemo(() => perimeterOf(rect), [rect]);
  const particles = useMemo(() => buildEdgeParticles(rect, particleCount), [rect, particleCount]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="dissolve-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-soft)" stopOpacity="0.2" />
            <stop offset="45%" stopColor="var(--color-gold)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-rose)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={CORNER_RADIUS}
          stroke="url(#dissolve-stroke)"
          strokeWidth={1.6}
          strokeLinecap="round"
          className="animate-line-draw"
          style={
            {
              "--path-length": perimeter,
              "--draw-duration": "1500ms",
            } as React.CSSProperties
          }
        />
      </svg>

      {particles.map((particle) => {
        const shape: React.CSSProperties = particle.heart
          ? { fontSize: `${particle.size + 0.25}rem`, lineHeight: 1 }
          : { width: `${particle.size * 0.4}rem`, height: `${particle.size * 0.4}rem` };

        return (
          <span
            key={particle.id}
            className={`absolute animate-edge-lift ${
              particle.heart ? "text-rose-deep" : "rounded-full bg-gold"
            }`}
            style={
              {
                ...shape,
                left: particle.x,
                top: particle.y,
                "--particle-x": `${particle.outX}px`,
                "--particle-y": `${particle.outY}px`,
                "--particle-opacity": particle.opacity,
                "--particle-duration": `${particle.duration}ms`,
                "--particle-delay": `${particle.delay}ms`,
              } as React.CSSProperties
            }
          >
            {particle.heart ? "❤" : null}
          </span>
        );
      })}
    </div>
  );
}
