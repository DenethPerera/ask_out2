"use client";

import { useMemo } from "react";
import type { Point } from "./geometry";

interface HeartConstellationProps {
  centre: Point;
  /** Radius of the constellation in px — smaller on phones. */
  scale: number;
  /** 8–14. Fewer on small screens. */
  pointCount: number;
  width: number;
  height: number;
}

/**
 * Moment 5 — points of light appear around the scene and, for about a second, lines
 * connect them into an abstract heart. Then it disperses.
 *
 * The points sit on the classic parametric heart curve, so the shape is genuinely a
 * heart rather than a scatter that hopes to read as one. One SVG polyline plus N small
 * circles — the whole moment is a dozen nodes.
 */
export default function HeartConstellation({
  centre,
  scale,
  pointCount,
  width,
  height,
}: HeartConstellationProps) {
  const { points, polyline, length } = useMemo(() => {
    // x = 16sin³t, y = 13cos t − 5cos2t − 2cos3t − cos4t  (normalised to ±1)
    const list: Point[] = Array.from({ length: pointCount }, (_, index) => {
      const t = (index / pointCount) * Math.PI * 2;
      const hx = 16 * Math.sin(t) ** 3;
      const hy =
        13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return {
        x: centre.x + (hx / 17) * scale,
        // SVG y grows downward, so the curve is flipped.
        y: centre.y - (hy / 17) * scale,
      };
    });

    const d = list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    let estimate = 0;
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const b = list[(i + 1) % list.length];
      estimate += Math.hypot(b.x - a.x, b.y - a.y);
    }

    return { points: list, polyline: d, length: Math.ceil(estimate) };
  }, [centre, scale, pointCount]);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <polygon
        points={polyline}
        stroke="var(--color-gold-soft)"
        strokeOpacity={0.5}
        strokeWidth={5}
        strokeLinejoin="round"
        className="animate-line-draw"
        style={
          {
            "--path-length": length,
            "--draw-duration": "1700ms",
          } as React.CSSProperties
        }
      />
      <polygon
        points={polyline}
        stroke="var(--color-wine-soft)"
        strokeOpacity={0.9}
        strokeWidth={1.4}
        strokeLinejoin="round"
        className="animate-line-draw"
        style={
          {
            "--path-length": length,
            "--draw-duration": "1700ms",
          } as React.CSSProperties
        }
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index % 3 === 0 ? 3.4 : 2.2}
          fill={index % 3 === 0 ? "var(--color-rose-deep)" : "var(--color-gold)"}
          className="animate-constellation-point"
          style={
            {
              transformBox: "fill-box",
              transformOrigin: "center",
              "--point-delay": `${index * 46}ms`,
              "--point-duration": "1750ms",
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}
