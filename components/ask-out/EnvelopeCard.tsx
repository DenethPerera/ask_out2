"use client";

import { useCallback, useEffect, useRef } from "react";
import Envelope from "./Envelope";
import Letter from "./Letter";
import type { EnvelopeStage } from "./useAskOutExperience";
import { useReducedMotion } from "./useReducedMotion";

interface EnvelopeCardProps {
  stage: EnvelopeStage;
  onOpen: () => void;
  onClose: () => void;
  onIgnore: () => void;
}

const HEADLINE = "I have something to tell you…";
const HEADLINE_START_MS = 450;
const CHAR_STEP_MS = 36;

/** Words keep their letters together (no mid-word wraps); each letter knows its delay. */
const HEADLINE_WORDS: Array<Array<{ char: string; delayMs: number }>> = (() => {
  let index = 0;
  return HEADLINE.split(" ").map((word) =>
    Array.from(word).map((char) => ({ char, delayMs: HEADLINE_START_MS + index++ * CHAR_STEP_MS })),
  );
})();

const HEADLINE_END_MS = HEADLINE_START_MS + HEADLINE.length * CHAR_STEP_MS;

/** Little companions circling the envelope while it waits to be opened. */
const ORBITERS = [
  { rx: 190, ry: 46, duration: 7, delay: 0, glyph: "❤", className: "text-sm text-rose-deep/70" },
  { rx: 170, ry: 38, duration: 9, delay: -3, glyph: "✦", className: "text-xs text-gold" },
  { rx: 215, ry: 56, duration: 11, delay: -7, glyph: "❤", className: "text-[10px] text-wine/50" },
  { rx: 150, ry: 62, duration: 13, delay: -5, glyph: "✧", className: "text-[11px] text-gold/80" },
];

const TILT_X_DEG = 9;
const TILT_Y_DEG = 13;

export default function EnvelopeCard({
  stage,
  onOpen,
  onClose,
  onIgnore,
}: EnvelopeCardProps) {
  const openDisabled = stage !== "closed";
  const closeDisabled = stage !== "opened";
  const ignoreDisabled = stage === "opening" || stage === "closing";
  const isClosed = stage === "closed";

  const reducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const canTilt = isClosed && !reducedMotion;

  const resetTilt = useCallback(() => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  }, []);

  // The letter must be read flat, so the tilt relaxes the moment the envelope opens.
  useEffect(() => {
    if (!canTilt) resetTilt();
  }, [canTilt, resetTilt]);

  /** Desktop-only parallax: the envelope leans gently toward the mouse. Written straight
   *  to the DOM so pointer movement never re-renders the scene. */
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canTilt || event.pointerType !== "mouse") return;
      const scene = sceneRef.current;
      const tilt = tiltRef.current;
      if (!scene || !tilt) return;
      const rect = scene.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateX(${(-py * TILT_X_DEG).toFixed(2)}deg) rotateY(${(
        px * TILT_Y_DEG
      ).toFixed(2)}deg)`;
    },
    [canTilt],
  );

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="mx-auto flex flex-col items-center gap-10"
    >
      <div
        className={`text-center transition-opacity duration-500 ${
          isClosed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p
          className="animate-rise-in text-[10px] font-semibold uppercase tracking-[0.4em] text-gold sm:text-xs"
          style={{ "--rise-delay": "150ms" } as React.CSSProperties}
        >
          ✦ just for you ✦
        </p>

        <p className="text-glow mt-3 font-script text-3xl leading-tight text-wine sm:text-4xl">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden>
            {HEADLINE_WORDS.map((word, wordIndex) => (
              <span key={wordIndex}>
                <span className="inline-block whitespace-nowrap">
                  {word.map(({ char, delayMs }, charIndex) => (
                    <span
                      key={charIndex}
                      className="animate-char-rise"
                      style={{ "--char-delay": `${delayMs}ms` } as React.CSSProperties}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                {wordIndex < HEADLINE_WORDS.length - 1 && " "}
              </span>
            ))}
          </span>
        </p>

        {/* Gold flourish drawn outward from a small heart. */}
        <div aria-hidden className="mx-auto mt-2 flex items-center justify-center gap-2">
          <svg width="72" height="8" viewBox="0 0 72 8" className="overflow-visible">
            <path
              d="M72 4 H2"
              pathLength={1}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="animate-line-draw-hold"
              style={
                {
                  "--path-length": 1,
                  "--draw-delay": `${HEADLINE_END_MS - 200}ms`,
                  "--draw-duration": "900ms",
                } as React.CSSProperties
              }
            />
          </svg>
          <span
            className="animate-title-pop text-xs text-rose-deep"
            style={{ animationDelay: `${HEADLINE_END_MS - 300}ms` }}
          >
            ❤
          </span>
          <svg width="72" height="8" viewBox="0 0 72 8" className="overflow-visible">
            <path
              d="M0 4 H70"
              pathLength={1}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="animate-line-draw-hold"
              style={
                {
                  "--path-length": 1,
                  "--draw-delay": `${HEADLINE_END_MS - 200}ms`,
                  "--draw-duration": "900ms",
                } as React.CSSProperties
              }
            />
          </svg>
        </div>

        <p
          className="animate-rise-in mt-2 text-xs font-medium tracking-wide text-charcoal-soft sm:text-sm"
          style={{ "--rise-delay": `${HEADLINE_END_MS}ms` } as React.CSSProperties}
        >
          Open when you&rsquo;re ready ❤️
        </p>
      </div>

      <div className="w-full pt-4 sm:pt-6">
        <div className="animate-envelope-enter" style={{ "--enter-delay": "200ms" } as React.CSSProperties}>
          <div
            ref={tiltRef}
            className="transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none"
          >
            <div className="relative mx-auto h-44 w-72 sm:h-48 sm:w-80 md:h-56 md:w-96">
              {/* Breathing halo behind the envelope. */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -inset-14 -z-10 rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.38),rgba(196,139,143,0.2)_45%,transparent_70%)] animate-halo-breathe transition-opacity duration-700 ${
                  isClosed ? "opacity-100" : "opacity-40"
                }`}
              />

              {/* Orbiting hearts and sparkles. */}
              {!reducedMotion && (
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-500 ${
                    isClosed ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {ORBITERS.map((orbiter, index) => (
                    <span
                      key={index}
                      className="absolute left-1/2 top-1/2 animate-orbit-x"
                      style={
                        {
                          "--orbit-rx": `min(${orbiter.rx}px, 44vw)`,
                          "--orbit-duration": `${orbiter.duration}s`,
                          "--orbit-delay": `${orbiter.delay}s`,
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className="block animate-orbit-y"
                        style={
                          {
                            "--orbit-ry": `${orbiter.ry}px`,
                            "--orbit-duration": `${orbiter.duration}s`,
                            "--orbit-delay": `${orbiter.delay}s`,
                          } as React.CSSProperties
                        }
                      >
                        <span
                          className={`-ml-1.5 -mt-2 block leading-none drop-shadow-[0_0_6px_rgba(231,211,163,0.9)] ${orbiter.className}`}
                        >
                          {orbiter.glyph}
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
              )}

              <Letter stage={stage} />
              <Envelope stage={stage} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="animate-rise-in flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        style={{ "--rise-delay": `${HEADLINE_END_MS + 150}ms` } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={onOpen}
          disabled={openDisabled}
          className={`group relative overflow-hidden rounded-full bg-gradient-to-br from-wine-soft via-wine to-wine px-7 py-3 text-base font-semibold text-ivory shadow-lg ring-1 ring-gold/30 transition-all duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
            openDisabled ? "" : "animate-glow-pulse"
          }`}
        >
          {!openDisabled && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-sheen"
              style={{ "--sheen-duration": "3.8s", "--sheen-delay": "2.4s" } as React.CSSProperties}
            />
          )}
          <span className="relative">
            Open the letter{" "}
            <span className="inline-block group-hover:animate-heart-wiggle group-focus-visible:animate-heart-wiggle">
              ❤️
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="rounded-full border border-rose/40 bg-ivory/80 px-6 py-3 text-base font-semibold text-wine shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-blush-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-ivory/80"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onIgnore}
          disabled={ignoreDisabled}
          className="rounded-full px-6 py-3 text-base font-medium text-charcoal-soft underline-offset-4 transition-all duration-200 hover:text-wine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}
