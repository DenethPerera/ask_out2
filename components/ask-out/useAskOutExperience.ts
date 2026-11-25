"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./useReducedMotion";

export type EnvelopeStage = "closed" | "opening" | "opened" | "closing";
export type Stage =
  | EnvelopeStage
  | "dateQuestion"
  | "celebrating"
  | "accepted"
  | "declining"
  | "declined";

const OPEN_ANIMATION_MS = 900;
const CLOSE_ANIMATION_MS = 700;
/** The "Wait…" beat before the decline punchline lands. Short on purpose. */
const DECLINE_TRANSITION_MS = 450;
const REDUCED_MOTION_MS = 60;

/**
 * Drives closed -> opening -> opened -> closing -> dateQuestion, then either
 * celebrating -> accepted or declining -> declined. Transient stages exist so buttons
 * can be disabled mid-animation, preventing double-triggers and race conditions.
 *
 * "celebrating" owns its own timing (see CelebrationScene) rather than a timeout here,
 * so the magical sequence decides when the final reveal has earned its entrance —
 * dateQuestion never jumps straight to accepted. "declining" is the short "Wait…" beat
 * before the decline punchline, so it is a plain timeout like the envelope stages.
 */
export function useAskOutExperience() {
  const [stage, setStage] = useState<Stage>("closed");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (stage === "opening") {
      const duration = prefersReducedMotion() ? REDUCED_MOTION_MS : OPEN_ANIMATION_MS;
      timeoutRef.current = setTimeout(() => setStage("opened"), duration);
    } else if (stage === "closing") {
      const duration = prefersReducedMotion() ? REDUCED_MOTION_MS : CLOSE_ANIMATION_MS;
      timeoutRef.current = setTimeout(() => setStage("dateQuestion"), duration);
    } else if (stage === "declining") {
      const duration = prefersReducedMotion() ? REDUCED_MOTION_MS : DECLINE_TRANSITION_MS;
      timeoutRef.current = setTimeout(() => setStage("declined"), duration);
    }
    return clearPendingTimeout;
  }, [stage, clearPendingTimeout]);

  const open = useCallback(() => {
    setStage((current) => (current === "closed" ? "opening" : current));
  }, []);

  const close = useCallback(() => {
    setStage((current) => (current === "opened" ? "closing" : current));
  }, []);

  const celebrate = useCallback(() => {
    setStage((current) => (current === "dateQuestion" ? "celebrating" : current));
  }, []);

  const finishCelebration = useCallback(() => {
    setStage((current) => (current === "celebrating" ? "accepted" : current));
  }, []);

  const decline = useCallback(() => {
    setStage((current) => (current === "dateQuestion" ? "declining" : current));
  }, []);

  return { stage, open, close, celebrate, finishCelebration, decline };
}
