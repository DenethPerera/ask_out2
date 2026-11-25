"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DodgingButton, { type DodgePuff } from "./DodgingButton";
import type { AcceptanceGeometry, Point } from "./geometry";
import type { TrailHeart } from "./HeartTrail";
import { useNoThanksDodge } from "./useNoThanksDodge";
import { useReducedMotion } from "./useReducedMotion";

interface DateQuestionProps {
  /**
   * Receives where she pressed and the card's own rect, so the celebration or next step
   * can smoothly carry forward from her interaction.
   */
  onAccept: (geometry: AcceptanceGeometry) => void;
  /** The stationary, respectful decline. Never wired to the dodging button. */
  onDecline: () => void;
}

const HEADLINE = "So honey, would you be down for a good date?";
const HEADLINE_START_MS = 180;
const WORD_STEP_MS = 65;

const HEADLINE_WORDS = HEADLINE.split(" ").map((word, index) => ({
  word,
  delayMs: HEADLINE_START_MS + index * WORD_STEP_MS,
}));
const HEADLINE_END_MS = HEADLINE_START_MS + HEADLINE_WORDS.length * WORD_STEP_MS;

const PERSONALITY_PHRASES = [
  "Nope 😌",
  "Too slow 😂",
  "Almost 👀",
  "Nice try ✨",
  "Over here 😉",
];
const PERSONALITY_CHANCE = 0.48;
const PERSONALITY_DURATION_MS = 950;
const TRAIL_CHANCE = 0.55;
const MAX_TRAIL_HEARTS = 8;
const MAX_PUFFS = 5;

/**
 * Celebration phase 1 lives here: the button compresses, springs back, throws a glow
 * ring and a tiny heart burst before handing off to the next step.
 */
const ACCEPT_REACTION_MS = 300;

const MILESTONES: Array<[threshold: number, message: string]> = [
  [3, "Nice try 😌"],
  [8, "Still trying? 😂"],
  [15, "You’re very determined 👀"],
  [25, "Okay, I’m impressed 💫"],
  [40, "This is becoming a whole thing 😅"],
];
const MILESTONE_VISIBLE_MS = 2600;

const ORBITERS = [
  { rx: 225, ry: 52, duration: 9, delay: 0, glyph: "✦", className: "text-xs text-gold" },
  { rx: 205, ry: 68, duration: 12, delay: -4, glyph: "❤", className: "text-xs text-rose-deep/70" },
  { rx: 240, ry: 44, duration: 14, delay: -8, glyph: "✧", className: "text-[11px] text-gold/80" },
];

const CARD_HEARTS = [
  { left: "10%", delay: "0.2s", size: "0.85rem" },
  { left: "32%", delay: "1.4s", size: "0.7rem" },
  { left: "68%", delay: "0.8s", size: "0.9rem" },
  { left: "88%", delay: "2.1s", size: "0.75rem" },
];

const BURST_PARTICLES: Array<{ x: number; y: number; glyph?: string }> = [
  { x: -38, y: -20 },
  { x: 34, y: -24 },
  { x: -24, y: 24 },
  { x: 30, y: 22 },
  { x: 0, y: -38 },
  { x: 0, y: 36 },
  { x: -50, y: -8, glyph: "❤" },
  { x: 48, y: 4, glyph: "❤" },
  { x: -12, y: -52, glyph: "❤" },
  { x: 16, y: 48, glyph: "❤" },
];

let fxIdCounter = 0;

export default function DateQuestion({ onAccept, onDecline }: DateQuestionProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const forSureRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noThanksRef = useRef<HTMLButtonElement>(null);
  const personalityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownMilestonesRef = useRef<Set<number>>(new Set());

  const reducedMotion = useReducedMotion();
  const [personalityLabel, setPersonalityLabel] = useState<string | null>(null);
  const [trailHearts, setTrailHearts] = useState<TrailHeart[]>([]);
  const [puffs, setPuffs] = useState<DodgePuff[]>([]);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  /** Viewport point of the actual press, for the point of light in Moment 1. */
  const [spark, setSpark] = useState<Point | null>(null);

  const handleDodge = useCallback((attempts: number, fromCenter: { x: number; y: number }) => {
    fxIdCounter += 1;
    const puffId = fxIdCounter;
    setPuffs((current) => [...current.slice(-(MAX_PUFFS - 1)), { id: puffId, ...fromCenter }]);

    if (Math.random() < TRAIL_CHANCE) {
      fxIdCounter += 1;
      const heart: TrailHeart = { id: fxIdCounter, x: fromCenter.x, y: fromCenter.y };
      setTrailHearts((current) => [...current.slice(-(MAX_TRAIL_HEARTS - 1)), heart]);
    }

    if (Math.random() < PERSONALITY_CHANCE) {
      const phrase = PERSONALITY_PHRASES[Math.floor(Math.random() * PERSONALITY_PHRASES.length)];
      setPersonalityLabel(phrase);
      if (personalityTimeoutRef.current) clearTimeout(personalityTimeoutRef.current);
      personalityTimeoutRef.current = setTimeout(
        () => setPersonalityLabel(null),
        PERSONALITY_DURATION_MS,
      );
    }

    for (const [threshold, message] of MILESTONES) {
      if (attempts >= threshold && !shownMilestonesRef.current.has(threshold)) {
        shownMilestonesRef.current.add(threshold);
        setMilestoneMessage(message);
        if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
        milestoneTimeoutRef.current = setTimeout(
          () => setMilestoneMessage(null),
          MILESTONE_VISIBLE_MS,
        );
        break;
      }
    }
  }, []);

  const { offset, attempts, triggerDodge, containerPointerHandlers, buttonEscapeHandlers } =
    useNoThanksDodge({
      containerRef: playAreaRef,
      buttonRef: noThanksRef,
      exclusionRefs: [forSureRef, headingRef],
      disabled: reducedMotion,
      onDodge: handleDodge,
    });

  // Subtle playful nudge: the "For sure ❤️" button gently grows a touch more inviting
  // as she chases the dodging button (capped at 1.08x so layout stays rock solid).
  const yesBoostScale = reducedMotion ? 1 : Math.min(1 + attempts * 0.008, 1.08);

  const handleTrailHeartSettled = useCallback((id: number) => {
    setTrailHearts((current) => current.filter((heart) => heart.id !== id));
  }, []);

  const handlePuffSettled = useCallback((id: number) => {
    setPuffs((current) => current.filter((puff) => puff.id !== id));
  }, []);

  // The dodge never gives up, so a real click only lands when the button cannot move
  // (reduced motion) — in which case treating it as a decline is the honest behaviour.
  const handleNoThanksClick = useCallback(() => {
    if (reducedMotion) {
      onDecline();
      return;
    }
    triggerDodge(null);
  }, [onDecline, reducedMotion, triggerDodge]);

  const handleAccept = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (accepting) return;
      setAccepting(true);

      const buttonRect = forSureRef.current?.getBoundingClientRect();
      const buttonCentre: Point = buttonRect
        ? { x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight * 0.68 };

      const pressed: Point =
        event.clientX > 0 || event.clientY > 0
          ? { x: event.clientX, y: event.clientY }
          : buttonCentre;
      setSpark(pressed);

      const card = cardRef.current?.getBoundingClientRect();
      const geometry: AcceptanceGeometry = {
        origin: buttonCentre,
        cardRect: card
          ? { x: card.left, y: card.top, width: card.width, height: card.height }
          : null,
      };

      acceptTimeoutRef.current = setTimeout(
        () => onAccept(geometry),
        reducedMotion ? 0 : ACCEPT_REACTION_MS,
      );
    },
    [accepting, onAccept, reducedMotion],
  );

  // Every timer this component owns is cleared on unmount — the next scene replaces
  // this view mid-flight, so nothing may be left pending behind it.
  useEffect(
    () => () => {
      if (personalityTimeoutRef.current) clearTimeout(personalityTimeoutRef.current);
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
      if (acceptTimeoutRef.current) clearTimeout(acceptTimeoutRef.current);
    },
    [],
  );

  return (
    <div className="relative mx-auto max-w-md">
      {/* Breathing warm halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 rounded-[3rem] bg-[radial-gradient(circle,rgba(198,161,91,0.34),rgba(196,139,143,0.18)_52%,transparent_72%)] blur-2xl animate-halo-breathe"
      />

      {/* Orbiting sparkles & hearts outside the card */}
      {!reducedMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
          {ORBITERS.map((orbiter, index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/3 animate-orbit-x"
              style={
                {
                  "--orbit-rx": `min(${orbiter.rx}px, 46vw)`,
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

      {/* Moment 1 — a point of light right where she touched, before anything else moves. */}
      {spark && !reducedMotion && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 h-14 w-14 animate-touch-spark rounded-full bg-[radial-gradient(circle,rgba(255,252,244,0.95),rgba(231,211,163,0.7)_40%,transparent_70%)]"
          style={{ left: spark.x, top: spark.y }}
        />
      )}

      <div
        ref={cardRef}
        className="paper-texture relative flex flex-col items-center gap-5 overflow-visible rounded-3xl bg-ivory/92 p-6 text-center shadow-[0_24px_54px_-14px_rgba(107,42,58,0.38)] ring-1 ring-gold/35 backdrop-blur-md sm:gap-6 sm:p-10"
      >
        {/* Inner stationery gold frame + ambient rising hearts clipped inside the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-2.5 rounded-[1.15rem] border border-gold/25" />

          {/* Delicate corner flourishes */}
          <span className="absolute left-4 top-3.5 text-[10px] text-gold/65">✦</span>
          <span className="absolute right-4 top-3.5 text-[10px] text-gold/65">✦</span>
          <span className="absolute bottom-3.5 left-4 text-[10px] text-gold/65">✦</span>
          <span className="absolute bottom-3.5 right-4 text-[10px] text-gold/65">✦</span>

          {/* Faint hearts drifting upward inside the card */}
          {!reducedMotion &&
            CARD_HEARTS.map((heart, idx) => (
              <span
                key={idx}
                className="absolute bottom-0 text-rose/35 animate-heart-float"
                style={{
                  left: heart.left,
                  animationDelay: heart.delay,
                  fontSize: heart.size,
                }}
              >
                ❤
              </span>
            ))}
        </div>

        {/* Eyebrow + Staggered Headline + Gold Flourish */}
        <div className="relative z-10 flex flex-col items-center">
          <p
            className="animate-rise-in text-[10px] font-semibold uppercase tracking-[0.38em] text-gold sm:text-xs"
            style={{ "--rise-delay": "80ms" } as React.CSSProperties}
          >
            ✦ the real question ✦
          </p>

          <h2
            ref={headingRef}
            className="text-glow mt-2.5 text-balance font-display text-2xl font-semibold leading-snug text-wine sm:text-3xl"
          >
            <span className="sr-only">{HEADLINE} ❤️</span>
            <span aria-hidden>
              {HEADLINE_WORDS.map(({ word, delayMs }, idx) => (
                <span key={idx}>
                  <span
                    className="animate-char-rise inline-block"
                    style={{ "--char-delay": `${delayMs}ms` } as React.CSSProperties}
                  >
                    {word}
                  </span>
                  {idx < HEADLINE_WORDS.length - 1 ? " " : " "}
                </span>
              ))}
              <span
                className="inline-block animate-title-pop"
                style={{ animationDelay: `${HEADLINE_END_MS}ms` }}
              >
                ❤️
              </span>
            </span>
          </h2>

          {/* Drawn gold divider rule with central heart */}
          <div aria-hidden className="mx-auto mt-3 flex items-center justify-center gap-2.5">
            <svg width="64" height="8" viewBox="0 0 64 8" className="overflow-visible">
              <path
                d="M64 4 H2"
                pathLength={1}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="animate-line-draw-hold"
                style={
                  {
                    "--path-length": 1,
                    "--draw-delay": `${HEADLINE_END_MS - 120}ms`,
                    "--draw-duration": "850ms",
                  } as React.CSSProperties
                }
              />
            </svg>
            <span
              className="animate-title-pop text-xs text-rose-deep"
              style={{ animationDelay: `${HEADLINE_END_MS - 180}ms` }}
            >
              ❤
            </span>
            <svg width="64" height="8" viewBox="0 0 64 8" className="overflow-visible">
              <path
                d="M0 4 H62"
                pathLength={1}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="animate-line-draw-hold"
                style={
                  {
                    "--path-length": 1,
                    "--draw-delay": `${HEADLINE_END_MS - 120}ms`,
                    "--draw-duration": "850ms",
                  } as React.CSSProperties
                }
              />
            </svg>
          </div>
        </div>

        {/* Milestone toast badge */}
        <div className="relative z-10 flex h-6 items-center justify-center">
          {milestoneMessage ? (
            <span
              key={milestoneMessage}
              role="status"
              className="animate-milestone-pop inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-cream/95 px-3.5 py-0.5 text-xs font-semibold text-wine shadow-sm"
            >
              {milestoneMessage}
            </span>
          ) : (
            <p
              className="animate-rise-in font-script text-base text-rose-deep/90 sm:text-lg"
              style={{ "--rise-delay": `${HEADLINE_END_MS + 80}ms` } as React.CSSProperties}
            >
              Be honest with me… 😉
            </p>
          )}
        </div>

        {/* Primary "For sure ❤️" CTA */}
        <div
          className="animate-rise-in relative z-10"
          style={{ "--rise-delay": `${HEADLINE_END_MS + 160}ms` } as React.CSSProperties}
        >
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `scale(${yesBoostScale})` }}
          >
            <div className="relative transition-transform duration-200 hover:scale-105">
              {/* Soft halo rings radiating behind the button */}
              {!accepting && !reducedMotion && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/55 animate-seal-ping"
                  style={{ "--ping-delay": "0.6s" } as React.CSSProperties}
                />
              )}

              {/* Phase 1 — soft glow expanding out from under the button on press */}
              {accepting && !reducedMotion && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.75),rgba(196,139,143,0.35)_55%,transparent_75%)] animate-accept-glow"
                />
              )}

              <button
                ref={forSureRef}
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className={`group relative overflow-hidden rounded-full bg-gradient-to-br from-wine-soft via-wine to-wine px-8 py-3.5 text-base font-semibold text-ivory shadow-lg ring-1 ring-gold/45 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-100 motion-reduce:animate-none ${
                  accepting
                    ? "animate-accept-press shadow-[0_0_32px_rgba(198,161,91,0.75)]"
                    : "animate-glow-pulse active:scale-95"
                }`}
              >
                {!accepting && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-sheen"
                    style={
                      { "--sheen-duration": "3.6s", "--sheen-delay": "1.4s" } as React.CSSProperties
                    }
                  />
                )}
                <span className="relative">
                  For sure{" "}
                  <span className="inline-block group-hover:animate-heart-wiggle motion-reduce:inline">
                    ❤️
                  </span>
                </span>
              </button>

              {accepting && !reducedMotion && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  {BURST_PARTICLES.map((particle, index) => (
                    <span
                      key={index}
                      className={`absolute left-1/2 top-1/2 animate-burst-particle ${
                        particle.glyph
                          ? "text-xs leading-none text-rose-deep"
                          : "h-1.5 w-1.5 rounded-full bg-gold"
                      }`}
                      style={
                        {
                          "--burst-x": `${particle.x}px`,
                          "--burst-y": `${particle.y}px`,
                        } as React.CSSProperties
                      }
                    >
                      {particle.glyph}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dodge play area */}
        <div
          ref={playAreaRef}
          {...containerPointerHandlers}
          className="relative z-10 h-[clamp(8.5rem,28vh,15rem)] w-full rounded-2xl border border-dashed border-rose/25 bg-gradient-to-b from-cream/35 via-blush-soft/20 to-cream/35"
        >
          <DodgingButton
            buttonRef={noThanksRef}
            label={personalityLabel ?? "No Thanks"}
            offset={offset}
            reducedMotion={reducedMotion}
            onClick={handleNoThanksClick}
            escapeHandlers={buttonEscapeHandlers}
            trailHearts={trailHearts}
            onTrailHeartSettled={handleTrailHeartSettled}
            puffs={puffs}
            onPuffSettled={handlePuffSettled}
          />
        </div>

        {/* Stationary on purpose: consent must never depend on catching a moving button. */}
        <button
          type="button"
          onClick={onDecline}
          className="relative z-10 text-xs font-medium text-charcoal-soft/75 underline-offset-4 transition-colors hover:text-wine hover:underline"
        >
          Maybe another time ❤️
        </button>
      </div>
    </div>
  );
}
