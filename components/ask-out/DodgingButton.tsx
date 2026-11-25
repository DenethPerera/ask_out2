"use client";

import type { RefObject } from "react";
import HeartTrail, { type TrailHeart } from "./HeartTrail";

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
}: DodgingButtonProps) {
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        {...(reducedMotion ? {} : escapeHandlers)}
        style={reducedMotion ? undefined : { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
        className="absolute rounded-full border border-rose/30 bg-ivory px-6 py-3 text-base font-medium text-wine shadow-md transition-transform duration-200 ease-out will-change-transform hover:text-wine-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose motion-reduce:static motion-reduce:transition-none"
      >
        {label}
      </button>
      {!reducedMotion && <HeartTrail hearts={trailHearts} onSettled={onTrailHeartSettled} />}
    </>
  );
}
