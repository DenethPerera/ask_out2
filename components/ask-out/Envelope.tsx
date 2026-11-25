"use client";

import { useCallback, useRef, useState } from "react";
import type { EnvelopeStage } from "./useAskOutExperience";

interface EnvelopeProps {
  stage: EnvelopeStage;
}

const SEAM_POSITION = "55%";
const EASTER_EGG_THRESHOLD = 5;
const EASTER_EGG_VISIBLE_MS = 2600;

const SHARDS = [
  { x: -22, y: -30, rot: -35 },
  { x: 26, y: -18, rot: 40 },
  { x: 4, y: -34, rot: -10 },
];

export default function Envelope({ stage }: EnvelopeProps) {
  const isOpen = stage === "opening" || stage === "opened";
  const isCracking = stage === "opening";

  const tapCountRef = useRef(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const easterEggTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSealTap = useCallback(() => {
    if (stage !== "closed") return;
    tapCountRef.current += 1;
    if (tapCountRef.current >= EASTER_EGG_THRESHOLD) {
      tapCountRef.current = 0;
      setShowEasterEgg(true);
      if (easterEggTimeoutRef.current) clearTimeout(easterEggTimeoutRef.current);
      easterEggTimeoutRef.current = setTimeout(() => setShowEasterEgg(false), EASTER_EGG_VISIBLE_MS);
    }
  }, [stage]);

  return (
    <div
      className={`absolute inset-0 z-20 transition-transform duration-700 ease-[cubic-bezier(0.34,1.15,0.64,1)] motion-reduce:transition-none ${
        stage === "closed" ? "animate-envelope-float motion-reduce:animate-none" : ""
      }`}
      style={{ perspective: "1200px", transform: isOpen ? "translateY(10px)" : "translateY(0)" }}
    >
      {showEasterEgg && (
        <div
          role="status"
          className="absolute -top-11 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal px-4 py-1.5 text-xs font-medium text-ivory shadow-lg animate-fade-in-up"
        >
          Okay okay, open it already 😂❤️
        </div>
      )}

      <div
        aria-hidden
        className={`absolute -bottom-4 left-1/2 h-6 w-[85%] -translate-x-1/2 rounded-full bg-wine/25 blur-md ${
          stage === "closed" ? "animate-shadow-breathe motion-reduce:animate-none" : ""
        }`}
      />

      {/* back panel */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-soft via-blush to-rose/40 shadow-lg ring-1 ring-rose/20" />

      {/* front pocket */}
      <div
        className="absolute inset-0 rounded-b-2xl bg-gradient-to-t from-rose/30 via-blush to-blush-soft"
        style={{
          clipPath: `polygon(0% 100%, 50% ${SEAM_POSITION}, 100% 100%)`,
          zIndex: isOpen ? 5 : 15,
        }}
      />

      {/* flap */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] rounded-t-2xl bg-gradient-to-b from-rose/30 via-blush to-blush-soft shadow-sm transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.2,1)] motion-reduce:duration-150"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
          transformOrigin: "top center",
          transform: isOpen ? "rotateX(-165deg)" : "rotateX(0deg)",
          zIndex: isOpen ? 4 : 25,
        }}
      />

      {/* wax seal — tap a few times before opening for a small surprise */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={handleSealTap}
        className={`absolute left-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-wine text-sm text-gold-soft shadow-md ring-2 ring-gold/50 transition-opacity duration-200 ${
          stage === "closed" ? "cursor-pointer" : "cursor-default"
        } ${isCracking ? "" : isOpen ? "opacity-0" : "opacity-100"}`}
        style={{ top: SEAM_POSITION, zIndex: 26, transform: "translate(-50%, -50%)" }}
      >
        {isCracking ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-wine text-gold-soft animate-seal-crack">
            ❤
          </span>
        ) : (
          "❤"
        )}
      </button>

      {isCracking &&
        SHARDS.map((shard, index) => (
          <span
            key={index}
            aria-hidden
            className="absolute left-1/2 h-1.5 w-1.5 rounded-full bg-gold animate-seal-shard motion-reduce:hidden"
            style={
              {
                top: SEAM_POSITION,
                zIndex: 26,
                "--shard-x": `${shard.x}px`,
                "--shard-y": `${shard.y}px`,
                "--shard-rot": `${shard.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}
