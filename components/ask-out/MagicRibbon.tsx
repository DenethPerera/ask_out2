"use client";

import { useMemo } from "react";
import type { Point } from "./geometry";

interface MagicRibbonProps {
  /** Where the ribbon starts: the pressed button. */
  origin: Point;
  /** Where it ends: roughly where YESSS is about to appear. */
  target: Point;
  width: number;
  height: number;
}

/**
 * Moment 4 — the same hairline of light, now travelling across the whole screen: a
 * curve from the button up to where YESSS is about to be written.
 *
 * Built from one cubic bezier drawn with stroke-dashoffset, a soft echo of itself
 * underneath for glow (a second stroke rather than a filter — much cheaper on phones),
 * and a bright tip riding the same path via offset-path.
 */
export default function MagicRibbon({ origin, target, width, height }: MagicRibbonProps) {
  const { path, length } = useMemo(() => {
    const dy = target.y - origin.y;

    /*
     * The button and the headline sit close together vertically, so a curve derived from
     * their separation alone would be a squiggle. The arc gets its own presence instead:
     * a lift proportional to the viewport, and a sideways swing away from whichever half
     * of the screen the press happened in, so it never runs off the edge.
     */
    const lift = Math.max(Math.abs(dy), height * 0.3);
    const swing = Math.min(width * 0.34, 250) * (origin.x > width / 2 ? -1 : 1);

    /*
     * Both control points sit on the same side, horizontally and vertically. Opposing
     * them cancels the curve out into a flat squiggle barely 40px tall — this way the
     * ribbon opens into a tall arc that actually travels across the scene.
     */
    const c1x = origin.x + swing * 1.35;
    const c1y = origin.y + lift * 0.12;
    const c2x = target.x + swing * 1.35;
    const c2y = target.y - lift * 0.85;

    const d = `M ${origin.x} ${origin.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;

    // Cheap polyline estimate of the arc length — good enough for a dash array, and it
    // avoids needing a DOM measurement pass.
    const cubic = (t: number) => {
      const mt = 1 - t;
      return {
        x: mt ** 3 * origin.x + 3 * mt ** 2 * t * c1x + 3 * mt * t ** 2 * c2x + t ** 3 * target.x,
        y: mt ** 3 * origin.y + 3 * mt ** 2 * t * c1y + 3 * mt * t ** 2 * c2y + t ** 3 * target.y,
      };
    };
    let estimate = 0;
    let previous = cubic(0);
    for (let step = 1; step <= 24; step += 1) {
      const current = cubic(step / 24);
      estimate += Math.hypot(current.x - previous.x, current.y - previous.y);
      previous = current;
    }

    return { path: d, length: Math.ceil(estimate) };
  }, [origin, target, width, height]);

  const drawStyle = {
    "--path-length": length,
    "--draw-duration": "1500ms",
  } as React.CSSProperties;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <defs>
        <linearGradient id="ribbon-stroke" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-rose)" stopOpacity="0.15" />
          <stop offset="35%" stopColor="var(--color-gold)" stopOpacity="0.9" />
          <stop offset="75%" stopColor="var(--color-gold-soft)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-gold-soft)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Wide, faint echo underneath — glow without a blur filter. */}
      <path
        d={path}
        stroke="var(--color-gold-soft)"
        strokeOpacity={0.28}
        strokeWidth={7}
        strokeLinecap="round"
        className="animate-line-draw"
        style={drawStyle}
      />
      <path
        d={path}
        stroke="url(#ribbon-stroke)"
        strokeWidth={1.75}
        strokeLinecap="round"
        className="animate-line-draw"
        style={drawStyle}
      />
      {/* The travelling tip. */}
      <circle
        r={3.5}
        fill="var(--color-gold-soft)"
        className="animate-line-tip"
        style={{ ...drawStyle, "--tip-path": `path("${path}")` } as React.CSSProperties}
      />
    </svg>
  );
}
