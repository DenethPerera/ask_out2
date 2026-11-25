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

/** A ring of hearts and gold sparks thrown out of the seal as it breaks. */
const OPEN_BURST = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2;
  const radius = index % 2 === 0 ? 120 : 78;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius * 0.75 - 24),
    glyph: index % 3 === 0 ? "❤" : undefined,
    delay: (index % 4) * 40,
  };
});

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
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-soft via-blush to-rose/40 shadow-[0_18px_40px_-12px_rgba(107,42,58,0.45)] ring-1 ring-rose/20" />

      {/* front pocket, with gold hairlines along its folds */}
      <div
        className="absolute inset-0 rounded-b-2xl bg-gradient-to-t from-rose/30 via-blush to-blush-soft"
        style={{
          clipPath: `polygon(0% 100%, 50% ${SEAM_POSITION}, 100% 100%)`,
          zIndex: isOpen ? 5 : 15,
        }}
      >
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,100 50,55 100,100"
            fill="none"
            stroke="rgba(198,161,91,0.55)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* flap */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] rounded-t-2xl bg-gradient-to-b from-rose/30 via-blush to-blush-soft shadow-sm transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.2,1)] motion-reduce:duration-150"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
          transformOrigin: "top center",
          transform: isOpen ? "rotateX(-165deg)" : "rotateX(0deg)",
          zIndex: isOpen ? 4 : 25,
        }}
      >
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,0 50,100 100,0"
            fill="none"
            stroke="rgba(198,161,91,0.7)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* glossy light gliding across the closed envelope */}
      {stage === "closed" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
          style={{ zIndex: 27 }}
        >
          <span
            className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-sheen"
            style={{ "--sheen-duration": "5.5s", "--sheen-delay": "1.8s" } as React.CSSProperties}
          />
        </div>
      )}

      {/* wax seal — tap a few times before opening for a small surprise */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={handleSealTap}
        className={`absolute left-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#a3566a,#6b2a3a_58%,#4a1a27)] text-sm text-gold-soft shadow-[0_4px_12px_rgba(74,26,39,0.5),inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_2px_3px_rgba(255,255,255,0.18)] ring-2 ring-gold/60 transition-[opacity,transform] duration-200 ${
          stage === "closed" ? "cursor-pointer hover:scale-110" : "cursor-default"
        } ${isCracking ? "" : isOpen ? "opacity-0" : "opacity-100"}`}
        style={{ top: SEAM_POSITION, zIndex: 26, translate: "-50% -50%" }}
      >
        {stage === "closed" && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/70 animate-seal-ping motion-reduce:hidden"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-rose/70 animate-seal-ping motion-reduce:hidden"
              style={{ "--ping-delay": "1.2s" } as React.CSSProperties}
            />
          </>
        )}
        {isCracking ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-wine text-gold-soft animate-seal-crack">
            ❤
          </span>
        ) : (
          <span className="drop-shadow-[0_0_4px_rgba(231,211,163,0.8)]">❤</span>
        )}
      </button>

      {isCracking &&
        OPEN_BURST.map((particle, index) => (
          <span
            key={`burst-${index}`}
            aria-hidden
            className={`absolute left-1/2 animate-burst-particle motion-reduce:hidden ${
              particle.glyph
                ? "text-sm leading-none text-rose-deep drop-shadow-[0_0_6px_rgba(231,211,163,0.9)]"
                : "h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_2px_rgba(231,211,163,0.8)]"
            }`}
            style={
              {
                top: SEAM_POSITION,
                zIndex: 35,
                animationDuration: "1000ms",
                animationDelay: `${particle.delay}ms`,
                "--burst-x": `${particle.x}px`,
                "--burst-y": `${particle.y}px`,
              } as React.CSSProperties
            }
          >
            {particle.glyph}
          </span>
        ))}

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
