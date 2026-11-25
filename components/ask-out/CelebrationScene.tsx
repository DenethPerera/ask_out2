"use client";

import { useEffect, useMemo, useState } from "react";
import CardDissolve from "./CardDissolve";
import CelebrationParticles from "./CelebrationParticles";
import { CELEBRATION_COPY } from "./content";
import DateCard from "./DateCard";
import HeartConstellation from "./HeartConstellation";
import LoveNotes from "./LoveNotes";
import MagicRibbon from "./MagicRibbon";
import type { AcceptanceGeometry, Point } from "./geometry";
import { clamp } from "./geometry";
import { useCelebrationTimeline, type TimelineStep } from "./useCelebrationTimeline";
import { prefersReducedMotion } from "./useReducedMotion";

/**
 * The cinematic timeline, measured from the moment this scene mounts — roughly 300ms
 * after the press, once the button has finished its own reaction. Lands the whole thing
 * at ~5.1s: long enough to feel composed, short enough that nobody waits.
 *
 * The moments deliberately overlap. Each one hands off while the previous is still
 * finishing, which is what makes it read as one sequence rather than a playlist.
 */
const FULL_TIMELINE: readonly TimelineStep[] = [
  { key: "rings", at: 0 }, // 2 — heartbeat wave out of the button
  { key: "dissolve", at: 90 }, // 3 — the card's outline traces, then lets go
  { key: "ribbon", at: 480 }, // 4 — the line travels up the screen
  { key: "burst", at: 620 }, // texture under the ribbon
  { key: "constellation", at: 980 }, // 5 — points connect into a heart
  { key: "title", at: 1220 }, // 6 — YESSS written by light
  { key: "notes", at: 1500 }, // 8 — love notes drift in behind
  { key: "second", at: 1760 }, // 9 — you just made my day
  { key: "third", at: 2200 }, // 9 — best answer ever
  { key: "shower", at: 2300 },
  { key: "textOut", at: 2820 }, // the words step aside for the date
  { key: "invitation", at: 3020 }, // 10 — the card is drawn
  { key: "orbit", at: 3620 }, // 11 — a partial orbit, then gone
  { key: "calm", at: 4560 }, // 12 — everything settles
  { key: "done", at: 5100 }, // hand over to Thank you
];

/** Same beats, no travel: light and typography only. */
const REDUCED_TIMELINE: readonly TimelineStep[] = [
  { key: "rings", at: 0 },
  { key: "title", at: 140 },
  { key: "second", at: 560 },
  { key: "third", at: 940 },
  { key: "textOut", at: 1320 },
  { key: "invitation", at: 1460 },
  { key: "calm", at: 2400 },
  { key: "done", at: 2900 },
];

/** Three rings, staggered like a pulse rather than fired all at once. */
const RINGS = [
  { delay: 0, duration: 1500, opacity: 0.7 },
  { delay: 190, duration: 1600, opacity: 0.5 },
  { delay: 420, duration: 1700, opacity: 0.32 },
];

/** Two or four hearts, depending on the screen, each on its own arc. */
const ORBITERS = [
  { from: -20, to: 190, radius: 1, glyph: "❤", delay: 0 },
  { from: 160, to: 372, radius: 1, glyph: "✨", delay: 160 },
  { from: 76, to: 250, radius: 1.16, glyph: "❤", delay: 320 },
  { from: 250, to: 430, radius: 1.16, glyph: "✨", delay: 470 },
];

function budgetFor(width: number) {
  if (width < 380) return { burst: 16, shower: 9, edge: 10, points: 8, orbiters: 2, notes: true };
  if (width < 640) return { burst: 22, shower: 11, edge: 12, points: 10, orbiters: 2, notes: true };
  if (width < 1024) return { burst: 28, shower: 15, edge: 16, points: 12, orbiters: 4, notes: false };
  return { burst: 34, shower: 17, edge: 18, points: 14, orbiters: 4, notes: false };
}

interface CelebrationSceneProps {
  geometry: AcceptanceGeometry | null;
  onComplete: () => void;
}

export default function CelebrationScene({ geometry, onComplete }: CelebrationSceneProps) {
  // Captured once so the timeline can't restart mid-celebration if the OS setting flips.
  const [reduced] = useState(() => prefersReducedMotion());

  const stage = useMemo(() => {
    const width = typeof window === "undefined" ? 390 : window.innerWidth;
    const height = typeof window === "undefined" ? 780 : window.innerHeight;
    const origin: Point = geometry?.origin ?? { x: width / 2, y: height * 0.68 };
    return {
      width,
      height,
      origin,
      cardRect: geometry?.cardRect ?? null,
      budget: budgetFor(width),
      // Where the ribbon lands and the constellation sits: just above the headline.
      headline: { x: width / 2, y: height * 0.34 },
      ringSize: clamp(Math.max(width, height) * 1.5, 520, 1500),
      burstSpread: clamp(Math.min(width, height) * 0.4, 140, 320),
      constellationScale: clamp(Math.min(width, height) * 0.3, 96, 230),
      orbitRadius: clamp(Math.min(width, height) * 0.24, 118, 205),
    };
  }, [geometry]);

  const reached = useCelebrationTimeline(reduced ? REDUCED_TIMELINE : FULL_TIMELINE);

  useEffect(() => {
    if (reached.has("done")) onComplete();
  }, [reached, onComplete]);

  const settled = reached.has("calm");
  const wordsOut = reached.has("textOut");
  const showInvitation = reached.has("invitation");

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Moment 7 — the page itself turns warmer, and stays that way. */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(231,211,163,0.44),rgba(236,211,206,0.3)_45%,transparent_78%)] transition-opacity duration-1000 ${
          reached.has("rings") ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Moment 8 — behind everything else. */}
      {!reduced && reached.has("notes") && !settled && (
        <LoveNotes compact={stage.budget.notes} />
      )}

      {/* Moment 2 — heartbeat wave. Thin rings, warm, no flash. */}
      {!reduced &&
        reached.has("rings") &&
        !reached.has("constellation") &&
        RINGS.map((ring, index) => (
          <span
            key={index}
            aria-hidden
            className="absolute rounded-full border border-gold/70 animate-pulse-ring"
            style={
              {
                left: stage.origin.x,
                top: stage.origin.y,
                width: stage.ringSize,
                height: stage.ringSize,
                "--ring-delay": `${ring.delay}ms`,
                "--ring-duration": `${ring.duration}ms`,
                "--ring-opacity": ring.opacity,
              } as React.CSSProperties
            }
          />
        ))}

      {/* Moment 3 — the question card comes apart into light. */}
      {!reduced && reached.has("dissolve") && !reached.has("title") && stage.cardRect && (
        <CardDissolve rect={stage.cardRect} particleCount={stage.budget.edge} />
      )}

      {/* Moment 4 — the ribbon bridges the button and the headline. */}
      {!reduced && reached.has("ribbon") && !reached.has("second") && (
        <MagicRibbon
          origin={stage.origin}
          target={stage.headline}
          width={stage.width}
          height={stage.height}
        />
      )}

      {!reduced && reached.has("burst") && !reached.has("constellation") && (
        <CelebrationParticles
          variant="burst"
          origin={stage.origin}
          count={stage.budget.burst}
          spread={stage.burstSpread}
        />
      )}

      {/* Moment 5 — the heart constellation, for about a second. */}
      {!reduced && reached.has("constellation") && !reached.has("second") && (
        <HeartConstellation
          centre={stage.headline}
          scale={stage.constellationScale}
          pointCount={stage.budget.points}
          width={stage.width}
          height={stage.height}
        />
      )}

      {!reduced && reached.has("shower") && !settled && (
        <CelebrationParticles variant="shower" count={stage.budget.shower} />
      )}

      {/* Moments 6, 9 and 10 share the centre of the screen, in turn. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <div
          className={`relative flex w-full max-w-[min(92vw,40rem)] flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)] transition-opacity duration-700 ${
            settled ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Contrast plate for the words. Held back until there are words: rendered any
              earlier it hazes over the dissolve, the ribbon and the constellation. */}
          {reached.has("title") && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -inset-y-10 animate-fade-in bg-[radial-gradient(closest-side,rgba(250,244,236,0.8),rgba(250,244,236,0.3)_60%,transparent)]"
              style={{ animationDuration: "500ms" }}
            />
          )}

          <div
            aria-live="polite"
            className={`relative flex flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)] transition-all duration-500 ${
              wordsOut ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            {reached.has("title") && (
              /* Moment 6 — written by light: a wipe uncovers the letters, a glare rides
                 across them, then it settles into plain readable type. */
              <h2 className="relative font-display text-[clamp(2.5rem,min(15vw,17vh),5.5rem)] font-semibold leading-[1.05] text-wine">
                <span className="relative inline-block animate-light-write">
                  {CELEBRATION_COPY.title}
                  {!reduced && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-4 w-8 animate-light-write-glare bg-[linear-gradient(90deg,transparent,rgba(231,211,163,0.95),transparent)]"
                    />
                  )}
                </span>{" "}
                <span
                  className="inline-block animate-fade-in"
                  style={{ animationDelay: "420ms" }}
                >
                  {CELEBRATION_COPY.titleEmoji}
                </span>
              </h2>
            )}

            {reached.has("second") && (
              <p className="animate-fade-in-up font-script text-[clamp(1.15rem,min(6vw,7vh),1.9rem)] leading-snug text-rose-deep">
                {CELEBRATION_COPY.second}
              </p>
            )}

            {reached.has("third") && (
              <p className="animate-fade-in-up text-[clamp(0.8rem,min(3.6vw,4.2vh),1rem)] font-medium tracking-wide text-charcoal-soft">
                {CELEBRATION_COPY.third}
              </p>
            )}
          </div>

          {/* Moment 10 — the invitation is drawn, and Moment 11 orbits it. */}
          {showInvitation && (
            <div className="absolute flex items-center justify-center">
              <DateCard draw />

              {!reduced &&
                reached.has("orbit") &&
                ORBITERS.slice(0, stage.budget.orbiters).map((orbiter, index) => (
                  <span
                    key={index}
                    aria-hidden
                    className="pointer-events-none absolute animate-orbit-sweep"
                    style={
                      {
                        "--orbit-from": `${orbiter.from}deg`,
                        "--orbit-to": `${orbiter.to}deg`,
                        "--orbit-delay": `${orbiter.delay}ms`,
                        "--orbit-duration": "1500ms",
                      } as React.CSSProperties
                    }
                  >
                    <span
                      className="block text-sm text-rose-deep"
                      style={{
                        transform: `translateY(-${stage.orbitRadius * orbiter.radius}px)`,
                      }}
                    >
                      {orbiter.glyph}
                    </span>
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
