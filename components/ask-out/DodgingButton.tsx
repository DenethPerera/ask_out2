"use client";

import type { RefObject } from "react";
import HeartTrail, { type TrailHeart } from "./HeartTrail";

export interface DodgePuff {
  id: number;
  x: number;
  y: number;
}

interface DodgingButtonProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
  label: string;
  offset: { x: number; y: number };
  reducedMotion: boolean;
  onClick: () => void;
  escapeHandlers: {
    onPointerEnter: (event: React.PointerEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
  };
  trailHearts: TrailHeart[];
  onTrailHeartSettled: (id: number) => void;
  puffs?: DodgePuff[];
  onPuffSettled?: (id: number) => void;
}

/** Purely presentational — all movement math lives in useNoThanksDodge, owned by the parent. */
export default function DodgingButton({
  buttonRef,
  label,
  offset,
  reducedMotion,
  onClick,
  escapeHandlers,
  trailHearts,
  onTrailHeartSettled,
  puffs = [],
  onPuffSettled,
}: DodgingButtonProps) {
  return (
    <>
      {!reducedMotion && puffs.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {puffs.map((puff) => (
            <span
              key={puff.id}
              className="absolute h-10 w-10 rounded-full border border-gold/65 bg-[radial-gradient(circle,rgba(231,211,163,0.45),transparent_70%)] animate-dodge-puff"
              style={{ left: puff.x, top: puff.y }}
              onAnimationEnd={() => onPuffSettled?.(puff.id)}
            />
          ))}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        {...(reducedMotion ? {} : escapeHandlers)}
        style={
          reducedMotion
            ? undefined
            : { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }
        }
        className="absolute rounded-full border border-rose/45 bg-gradient-to-b from-ivory to-cream/95 px-6 py-2.5 text-sm font-semibold text-wine shadow-[0_8px_20px_-8px_rgba(107,42,58,0.35)] ring-1 ring-white/60 transition-transform duration-200 ease-[cubic-bezier(0.34,1.35,0.64,1)] will-change-transform hover:border-gold/60 hover:text-wine-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose sm:text-base motion-reduce:static motion-reduce:transition-none"
      >
        <span key={label} className="inline-block animate-fade-in">
          {label}
        </span>
      </button>

      {!reducedMotion && <HeartTrail hearts={trailHearts} onSettled={onTrailHeartSettled} />}
    </>
  );
}
