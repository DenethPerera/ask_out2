"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DodgingButton from "./DodgingButton";
import type { AcceptanceGeometry, Point } from "./geometry";
import type { TrailHeart } from "./HeartTrail";
import { useNoThanksDodge } from "./useNoThanksDodge";
import { useReducedMotion } from "./useReducedMotion";

interface DateQuestionProps {
  /**
   * Receives where she pressed and the card's own rect, so the celebration can start
   * under her fingertip and trace this card's outline before it goes to light.
   */
  onAccept: (geometry: AcceptanceGeometry) => void;
  /** The stationary, respectful decline. Never wired to the dodging button. */
  onDecline: () => void;
}

const PERSONALITY_PHRASES = ["Nope 😌", "Too slow 😂", "Almost 👀"];
const PERSONALITY_CHANCE = 0.35;
const PERSONALITY_DURATION_MS = 850;
const TRAIL_CHANCE = 0.4;
const MAX_TRAIL_HEARTS = 7;
/**
 * Celebration phase 1 lives here: the button compresses, springs back, throws a glow
 * ring and a tiny heart burst. Only once that has registered do we hand over to the
 * full celebration scene.
 */
const ACCEPT_REACTION_MS = 300;

const MILESTONES: Array<[threshold: number, message: string]> = [
  [3, "Nice try 😌"],
  [8, "Still trying? 😂"],
  [15, "You’re very determined 👀"],
  [25, "Okay, I’m impressed 💫"],
  [40, "This is becoming a whole thing 😅"],
];
const MILESTONE_VISIBLE_MS = 2400;

const DECORATIVE_SPARKLES = [
  { top: "-6%", left: "12%" },
  { top: "4%", left: "88%" },
  { top: "-10%", left: "55%" },
];

const BURST_PARTICLES: Array<{ x: number; y: number; glyph?: string }> = [
  { x: -34, y: -18 },
  { x: 30, y: -22 },
  { x: -20, y: 22 },
  { x: 26, y: 20 },
  { x: 0, y: -34 },
  { x: 0, y: 32 },
  { x: -46, y: -6, glyph: "❤" },
  { x: 44, y: 2, glyph: "❤" },
  { x: -10, y: -48, glyph: "❤" },
  { x: 14, y: 44, glyph: "❤" },
];

let trailIdCounter = 0;

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
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  /** Viewport point of the actual press, for the point of light in Moment 1. */
  const [spark, setSpark] = useState<Point | null>(null);

  const handleDodge = useCallback((attempts: number, fromCenter: { x: number; y: number }) => {
    if (Math.random() < TRAIL_CHANCE) {
      trailIdCounter += 1;
      const heart: TrailHeart = { id: trailIdCounter, x: fromCenter.x, y: fromCenter.y };
      setTrailHearts((current) => [...current.slice(-(MAX_TRAIL_HEARTS - 1)), heart]);
    }

    if (Math.random() < PERSONALITY_CHANCE) {
      const phrase = PERSONALITY_PHRASES[Math.floor(Math.random() * PERSONALITY_PHRASES.length)];
      setPersonalityLabel(phrase);
      if (personalityTimeoutRef.current) clearTimeout(personalityTimeoutRef.current);
      personalityTimeoutRef.current = setTimeout(() => setPersonalityLabel(null), PERSONALITY_DURATION_MS);
    }

    for (const [threshold, message] of MILESTONES) {
      if (attempts >= threshold && !shownMilestonesRef.current.has(threshold)) {
        shownMilestonesRef.current.add(threshold);
        setMilestoneMessage(message);
        if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
        milestoneTimeoutRef.current = setTimeout(() => setMilestoneMessage(null), MILESTONE_VISIBLE_MS);
        break;
      }
    }
  }, []);

  const { offset, triggerDodge, containerPointerHandlers, buttonEscapeHandlers } =
    useNoThanksDodge({
      containerRef: playAreaRef,
      buttonRef: noThanksRef,
      exclusionRefs: [forSureRef, headingRef],
      disabled: reducedMotion,
      onDodge: handleDodge,
    });

  const handleTrailHeartSettled = useCallback((id: number) => {
    setTrailHearts((current) => current.filter((heart) => heart.id !== id));
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

      // Moment 1 — the spark belongs under her fingertip when there is one; a keyboard
      // activation reports (0, 0), so fall back to the button's centre.
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

  // Every timer this component owns is cleared on unmount — the celebration replaces
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
      <div className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle,rgba(198,161,91,0.22),transparent_65%)] blur-2xl" />

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
        className="relative flex flex-col items-center gap-6 overflow-visible rounded-3xl bg-ivory/90 p-6 text-center shadow-xl backdrop-blur sm:p-10"
      >
        <div className="relative">
          {!reducedMotion &&
            DECORATIVE_SPARKLES.map((sparkle, index) => (
              <span
                key={index}
                aria-hidden
                className="absolute h-1 w-1 rounded-full bg-gold animate-sparkle"
                style={{ top: sparkle.top, left: sparkle.left, animationDelay: `${index * 0.5}s` }}
              />
            ))}
          <h2
            ref={headingRef}
            className="text-balance font-display text-2xl font-semibold text-wine sm:text-3xl"
          >
            So honey, would you be down for a good date? ❤️
          </h2>
        </div>

        <div className="h-5">
          {milestoneMessage && (
            <p className="animate-fade-in text-xs font-medium text-charcoal-soft">{milestoneMessage}</p>
          )}
        </div>

        <div className="relative hover:scale-105 transition-transform duration-200">
          {/* Phase 1 — soft glow expanding out from under the button. */}
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
            className={`relative rounded-full bg-wine px-6 py-3 text-base font-semibold text-ivory shadow-lg transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(198,161,91,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-100 motion-reduce:animate-none ${
              accepting
                ? "animate-accept-press shadow-[0_0_32px_rgba(198,161,91,0.7)]"
                : "animate-heartbeat active:scale-95"
            }`}
          >
            For sure{" "}
            <span className="inline-block hover:animate-heart-wiggle motion-reduce:inline">❤️</span>
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

        {/* Dodge play area. The 9rem floor (was 11rem) keeps landscape phones from
            pushing the card past the viewport; portrait sizing is unchanged. */}
        <div
          ref={playAreaRef}
          {...containerPointerHandlers}
          className="relative h-[clamp(9rem,32vh,18rem)] w-full"
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
          />
        </div>

        {/* Stationary on purpose: consent must never depend on catching a moving button. */}
        <button
          type="button"
          onClick={onDecline}
          className="text-xs font-medium text-charcoal-soft/70 underline-offset-4 transition-colors hover:text-charcoal-soft hover:underline"
        >
          Maybe another time ❤️
        </button>
      </div>
    </div>
  );
}
