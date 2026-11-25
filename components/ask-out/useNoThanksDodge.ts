"use client";

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export interface UseNoThanksDodgeOptions {
  containerRef: RefObject<HTMLElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  /** Elements the button must never end up underneath (For Sure button, heading, etc). */
  exclusionRefs: RefObject<HTMLElement | null>[];
  /**
   * Once attempts reach this, the button stops dodging and behaves like a normal button.
   * Defaults to unlimited — the joke is meant to run for as long as the visitor keeps
   * trying. Consent never depends on catching it: the stationary decline is separate.
   */
  maxAttempts?: number;
  /** When true (prefers-reduced-motion), the button never moves. */
  disabled?: boolean;
  onDodge?: (attempts: number, fromCenter: Point) => void;
}

const MOVE_TRANSITION_MS = 220;
const SAFE_PADDING = 14;
const CANDIDATE_COUNT = 10;
const RESIZE_DEBOUNCE_MS = 150;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function rectsOverlap(a: { left: number; top: number; right: number; bottom: number }, b: Rect) {
  return a.left < b.left + b.width && a.right > b.left && a.top < b.top + b.height && a.bottom > b.top;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Drives the "No Thanks" dodge behavior: measures a safe play area, scores several
 * candidate destinations (favoring distance from the pointer and the current spot,
 * while avoiding exclusion zones and edges), and exposes a transform offset to render.
 * No unrestricted Math.random() across the viewport — every candidate is bounds-checked.
 */
export function useNoThanksDodge({
  containerRef,
  buttonRef,
  exclusionRefs,
  maxAttempts = Number.POSITIVE_INFINITY,
  disabled = false,
  onDodge,
}: UseNoThanksDodgeOptions) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [attempts, setAttempts] = useState(0);

  const baselineRef = useRef<Rect>({ left: 0, top: 0, width: 0, height: 0 });
  const currentAbsoluteRef = useRef<Point>({ x: 0, y: 0 });
  const lockedRef = useRef(false);
  const attemptsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const latestPointerRef = useRef<Point | null>(null);

  const measureBaseline = useCallback(() => {
    const container = containerRef.current;
    const button = buttonRef.current;
    if (!container || !button) return;

    const containerRect = container.getBoundingClientRect();
    const previousTransform = button.style.transform;
    button.style.transform = "translate3d(0px, 0px, 0)";
    const buttonRect = button.getBoundingClientRect();
    button.style.transform = previousTransform;

    const baseline: Rect = {
      left: buttonRect.left - containerRect.left,
      top: buttonRect.top - containerRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    };
    baselineRef.current = baseline;
    currentAbsoluteRef.current = { x: baseline.left, y: baseline.top };
  }, [containerRef, buttonRef]);

  useLayoutEffect(() => {
    measureBaseline();
  }, [measureBaseline]);

  const clampCurrentIntoBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width: buttonWidth, height: buttonHeight } = baselineRef.current;
    const containerRect = container.getBoundingClientRect();
    const maxX = Math.max(containerRect.width - SAFE_PADDING - buttonWidth, SAFE_PADDING);
    const maxY = Math.max(containerRect.height - SAFE_PADDING - buttonHeight, SAFE_PADDING);

    const current = currentAbsoluteRef.current;
    const clampedX = clamp(current.x, SAFE_PADDING, maxX);
    const clampedY = clamp(current.y, SAFE_PADDING, maxY);
    if (clampedX !== current.x || clampedY !== current.y) {
      currentAbsoluteRef.current = { x: clampedX, y: clampedY };
      setOffset({ x: clampedX - baselineRef.current.left, y: clampedY - baselineRef.current.top });
    }
  }, [containerRef]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        measureBaseline();
        clampCurrentIntoBounds();
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureBaseline, clampCurrentIntoBounds]);

  const getExclusionRects = useCallback((): Rect[] => {
    const container = containerRef.current;
    if (!container) return [];
    const containerRect = container.getBoundingClientRect();
    return exclusionRefs
      .map((ref) => ref.current)
      .filter((element): element is HTMLElement => element !== null)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const gap = 18;
        return {
          left: rect.left - containerRect.left - gap,
          top: rect.top - containerRect.top - gap,
          width: rect.width + gap * 2,
          height: rect.height + gap * 2,
        };
      });
  }, [containerRef, exclusionRefs]);

  const dodge = useCallback(
    (pointer: Point | null) => {
      if (disabled || lockedRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const { width: buttonWidth, height: buttonHeight } = baselineRef.current;
      const containerRect = container.getBoundingClientRect();
      const minX = SAFE_PADDING;
      const minY = SAFE_PADDING;
      const maxX = Math.max(containerRect.width - SAFE_PADDING - buttonWidth, minX);
      const maxY = Math.max(containerRect.height - SAFE_PADDING - buttonHeight, minY);

      const exclusions = getExclusionRects();
      const current = currentAbsoluteRef.current;
      const currentCenter: Point = {
        x: current.x + buttonWidth / 2,
        y: current.y + buttonHeight / 2,
      };

      let bestCandidate: Point | null = null;
      let bestScore = -Infinity;
      let bestNonOverlapping: Point | null = null;

      for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
        const candidate: Point = {
          x: minX + Math.random() * Math.max(maxX - minX, 0),
          y: minY + Math.random() * Math.max(maxY - minY, 0),
        };
        const candidateRect = {
          left: candidate.x,
          top: candidate.y,
          right: candidate.x + buttonWidth,
          bottom: candidate.y + buttonHeight,
        };
        const overlaps = exclusions.some((exclusion) => rectsOverlap(candidateRect, exclusion));
        const candidateCenter: Point = {
          x: candidate.x + buttonWidth / 2,
          y: candidate.y + buttonHeight / 2,
        };

        let score = distance(candidateCenter, currentCenter) * 1;
        if (pointer) score += distance(candidateCenter, pointer) * 1.6;
        if (overlaps) score -= 100000;

        if (!overlaps && (bestNonOverlapping === null || score > bestScore)) {
          bestNonOverlapping = candidate;
        }
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      const destination = bestNonOverlapping ?? bestCandidate;
      if (!destination) return;

      lockedRef.current = true;
      currentAbsoluteRef.current = destination;
      setOffset({
        x: destination.x - baselineRef.current.left,
        y: destination.y - baselineRef.current.top,
      });

      setAttempts((prev) => {
        const next = prev + 1;
        attemptsRef.current = next;
        return next;
      });
      onDodge?.(attemptsRef.current + 1, currentCenter);

      window.setTimeout(() => {
        lockedRef.current = false;
      }, MOVE_TRANSITION_MS);
    },
    [containerRef, disabled, getExclusionRects, onDodge],
  );

  const scheduleProximityCheck = useCallback(
    (point: Point) => {
      latestPointerRef.current = point;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pointer = latestPointerRef.current;
        if (!pointer || disabled || lockedRef.current || attemptsRef.current >= maxAttempts) return;

        const { width, height } = baselineRef.current;
        const current = currentAbsoluteRef.current;
        const buttonCenter: Point = { x: current.x + width / 2, y: current.y + height / 2 };
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const radius = clamp(Math.min(containerRect.width, containerRect.height) * 0.22, 70, 120);

        if (distance(pointer, buttonCenter) < radius) {
          dodge(pointer);
        }
      });
    },
    [containerRef, disabled, dodge, maxAttempts],
  );

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleContainerPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse" || attemptsRef.current >= maxAttempts) return;
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      scheduleProximityCheck({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top,
      });
    },
    [containerRef, maxAttempts, scheduleProximityCheck],
  );

  const pointToContainerSpace = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [containerRef],
  );

  const handleButtonPointerEnter = useCallback(
    (event: React.PointerEvent) => {
      if (attemptsRef.current >= maxAttempts) return;
      const point = pointToContainerSpace(event.clientX, event.clientY);
      dodge(point);
    },
    [dodge, maxAttempts, pointToContainerSpace],
  );

  const handleButtonPointerDown = useCallback(
    (event: React.PointerEvent) => {
      // Touch is handled exclusively by the native touchstart listener below (it needs
      // { passive: false } to preventDefault, which a React-attached listener can't do) —
      // handling it here too would dodge twice for a single tap.
      if (event.pointerType === "touch" || attemptsRef.current >= maxAttempts) return;
      if (event.pointerType === "pen") {
        event.preventDefault();
      }
      const point = pointToContainerSpace(event.clientX, event.clientY);
      dodge(point);
    },
    [dodge, maxAttempts, pointToContainerSpace],
  );

  // React attaches touchstart as a passive listener by default, so preventDefault()
  // silently no-ops there — a native listener is the only way to actually suppress
  // the synthetic click/tap-highlight that would otherwise fire on the button's old spot.
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const handleTouchStart = (event: TouchEvent) => {
      if (attemptsRef.current >= maxAttempts) return;
      event.preventDefault();
      const touch = event.touches[0];
      const point = touch ? pointToContainerSpace(touch.clientX, touch.clientY) : null;
      dodge(point);
    };
    button.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => button.removeEventListener("touchstart", handleTouchStart);
  }, [buttonRef, dodge, maxAttempts, pointToContainerSpace]);

  const hasEscapedCap = attempts >= maxAttempts;

  return {
    offset,
    attempts,
    hasEscapedCap,
    triggerDodge: dodge,
    containerPointerHandlers: { onPointerMove: handleContainerPointerMove },
    buttonEscapeHandlers: {
      onPointerEnter: handleButtonPointerEnter,
      onPointerDown: handleButtonPointerDown,
    },
  };
}
