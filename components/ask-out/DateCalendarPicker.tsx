"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CALENDAR_COPY,
  TIME_SLOTS,
  type DateDetails,
  type TimeSlotId,
} from "./content";
import type { AcceptanceGeometry, Point } from "./geometry";
import { useReducedMotion } from "./useReducedMotion";

interface DateCalendarPickerProps {
  onConfirm: (details: DateDetails, geometry: AcceptanceGeometry) => void;
  onBack: () => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const FULL_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CONFIRM_REACTION_MS = 300;

const BURST_PARTICLES: Array<{ x: number; y: number; glyph?: string }> = [
  { x: -38, y: -20 },
  { x: 34, y: -24 },
  { x: -24, y: 24 },
  { x: 28, y: 22 },
  { x: 0, y: -36 },
  { x: 0, y: 34 },
  { x: -48, y: -6, glyph: "❤" },
  { x: 46, y: 4, glyph: "❤" },
  { x: -12, y: -50, glyph: "❤" },
  { x: 16, y: 46, glyph: "❤" },
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDateDetails(date: Date, slotId: TimeSlotId): DateDetails {
  const weekday = FULL_WEEKDAYS[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  const day = String(date.getDate());
  const year = String(date.getFullYear());
  const slot = TIME_SLOTS.find((item) => item.id === slotId) ?? TIME_SLOTS[3];

  return {
    isoDate: toIsoDate(date),
    displayDate: `${weekday}, ${month} ${day}, ${year}`,
    weekday,
    month,
    day,
    year,
    time: slot.detail,
    location: "",
  };
}

export default function DateCalendarPicker({ onConfirm, onBack }: DateCalendarPickerProps) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Default suggested date: upcoming Saturday (or tomorrow if today is Saturday)
  const initialDate = useMemo(() => {
    const next = new Date(today);
    const daysUntilSat = (6 - today.getDay() + 7) % 7 || 1;
    next.setDate(today.getDate() + daysUntilSat);
    return next;
  }, [today]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());
  const [slideDir, setSlideDir] = useState<"next" | "prev" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId>("dinner");
  const [confirming, setConfirming] = useState(false);
  const [spark, setSpark] = useState<Point | null>(null);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  // Cap forward navigation to 18 months so it stays sensible.
  const maxMonthIndex = today.getFullYear() * 12 + today.getMonth() + 18;
  const currentMonthIndex = viewYear * 12 + viewMonth;
  const canGoNext = currentMonthIndex < maxMonthIndex;

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrev || confirming) return;
    setSlideDir("prev");
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [canGoPrev, confirming, viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (!canGoNext || confirming) return;
    setSlideDir("next");
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [canGoNext, confirming, viewMonth]);

  const cells = useMemo(() => {
    const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: Array<{ day: number; date: Date; isPast: boolean; isToday: boolean } | null> = [];

    for (let i = 0; i < firstDayWeekday; i += 1) {
      list.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(viewYear, viewMonth, day);
      const time = date.getTime();
      list.push({
        day,
        date,
        isPast: time < today.getTime(),
        isToday: time === today.getTime(),
      });
    }
    return list;
  }, [today, viewMonth, viewYear]);

  const selectedIso = selectedDate ? toIsoDate(selectedDate) : null;
  const previewDetails = useMemo(
    () => (selectedDate ? buildDateDetails(selectedDate, selectedSlot) : null),
    [selectedDate, selectedSlot],
  );

  const handleConfirm = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!selectedDate || confirming) return;
      setConfirming(true);

      const buttonRect = confirmBtnRef.current?.getBoundingClientRect();
      const buttonCentre: Point = buttonRect
        ? { x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight * 0.75 };

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

      const details = buildDateDetails(selectedDate, selectedSlot);

      confirmTimeoutRef.current = setTimeout(
        () => onConfirm(details, geometry),
        reducedMotion ? 0 : CONFIRM_REACTION_MS,
      );
    },
    [confirming, onConfirm, reducedMotion, selectedDate, selectedSlot],
  );

  useEffect(
    () => () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    },
    [],
  );

  const monthKey = `${viewYear}-${viewMonth}`;
  const gridAnimationClass =
    slideDir === "next"
      ? "animate-calendar-next"
      : slideDir === "prev"
        ? "animate-calendar-prev"
        : "";

  return (
    <div className="relative mx-auto max-w-md">
      {/* Ambient gold-rose aura behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(198,161,91,0.32),rgba(196,139,143,0.16)_52%,transparent_72%)] blur-2xl animate-halo-breathe"
      />

      {/* Moment 1 — fingertip spark when she locks in the date */}
      {spark && !reducedMotion && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 h-14 w-14 animate-touch-spark rounded-full bg-[radial-gradient(circle,rgba(255,252,244,0.95),rgba(231,211,163,0.7)_40%,transparent_70%)]"
          style={{ left: spark.x, top: spark.y }}
        />
      )}

      <div
        ref={cardRef}
        className="paper-texture relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-ivory/92 p-5 text-center shadow-[0_22px_50px_-14px_rgba(107,42,58,0.35)] ring-1 ring-gold/35 backdrop-blur-md sm:gap-5 sm:p-7"
      >
        {/* Subtle gold corner hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-[1.15rem] border border-gold/25"
        />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-gold sm:text-xs">
            {CALENDAR_COPY.eyebrow}
          </p>
          <h2 className="text-glow mt-1.5 font-display text-2xl font-semibold text-wine sm:text-3xl">
            {CALENDAR_COPY.heading}
          </h2>
          <p className="mt-1 font-script text-lg text-rose-deep sm:text-xl">
            {CALENDAR_COPY.subtitle}
          </p>
        </div>

        {/* Calendar Sheet */}
        <div className="relative z-10 w-full rounded-2xl bg-gradient-to-b from-ivory via-ivory to-cream/85 p-3.5 shadow-inner ring-1 ring-blush sm:p-4">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrev || confirming}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/35 bg-ivory text-sm text-wine shadow-sm transition-all duration-200 hover:scale-105 hover:border-gold hover:bg-blush-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            >
              ‹
            </button>

            <div key={monthKey} className="animate-fade-in text-center">
              <span className="font-display text-base font-semibold tracking-wide text-wine sm:text-lg">
                {MONTH_NAMES[viewMonth]}
              </span>{" "}
              <span className="text-xs font-semibold tracking-[0.22em] text-charcoal-soft">
                {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canGoNext || confirming}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/35 bg-ivory text-sm text-wine shadow-sm transition-all duration-200 hover:scale-105 hover:border-gold hover:bg-blush-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            >
              ›
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1.5 grid grid-cols-7 text-center">
            {WEEKDAYS.map((day, idx) => (
              <span
                key={day}
                className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  idx === 0 || idx === 6 ? "text-rose-deep" : "text-charcoal-soft/75"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div key={`grid-${monthKey}`} className={`grid grid-cols-7 gap-1 ${gridAnimationClass}`}>
            {cells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} className="h-9 sm:h-10" />;
              }

              const iso = toIsoDate(cell.date);
              const isSelected = selectedIso === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={cell.isPast || confirming}
                  onClick={() => setSelectedDate(cell.date)}
                  aria-label={`${MONTH_NAMES[viewMonth]} ${cell.day}, ${viewYear}`}
                  aria-pressed={isSelected}
                  className={`group relative flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine sm:h-10 ${
                    cell.isPast
                      ? "cursor-not-allowed text-charcoal-soft/30"
                      : isSelected
                        ? "animate-day-pop bg-gradient-to-br from-wine-soft via-wine to-wine font-semibold text-ivory shadow-[0_6px_16px_-4px_rgba(107,42,58,0.65),0_0_12px_rgba(198,161,91,0.45)] ring-1 ring-gold/75"
                        : cell.isToday
                          ? "bg-blush-soft/75 font-semibold text-wine ring-1 ring-rose/50 hover:scale-105 hover:bg-blush"
                          : "text-charcoal hover:scale-105 hover:bg-blush-soft/80 hover:text-wine"
                  }`}
                >
                  <span>{cell.day}</span>
                  {isSelected && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-0.5 -top-1 text-[10px] leading-none text-gold-soft drop-shadow-[0_1px_3px_rgba(107,42,58,0.8)]"
                    >
                      ❤
                    </span>
                  )}
                  {!isSelected && cell.isToday && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute bottom-1 h-1 w-1 rounded-full bg-rose-deep"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time-of-day selector */}
        <div className="relative z-10 w-full">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-charcoal-soft">
            {CALENDAR_COPY.timeLabel}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={confirming}
                  onClick={() => setSelectedSlot(slot.id)}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-wine active:scale-95 ${
                    active
                      ? "bg-wine text-ivory shadow-[0_6px_14px_-4px_rgba(107,42,58,0.55)] ring-1 ring-gold/65"
                      : "border border-rose/35 bg-ivory/85 text-charcoal hover:border-gold/60 hover:bg-blush-soft/70 hover:text-wine"
                  }`}
                >
                  <span aria-hidden>{slot.icon}</span>
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live invitation preview strip */}
        {previewDetails && (
          <div
            key={`${previewDetails.isoDate}-${selectedSlot}`}
            className="animate-ticket-in relative z-10 flex w-full items-center justify-between gap-3 rounded-2xl border border-gold/45 bg-gradient-to-r from-cream/90 via-ivory to-cream/90 px-4 py-2.5 text-left shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-deep">
                Our Date
              </p>
              <p className="truncate font-display text-sm font-semibold text-wine sm:text-base">
                {previewDetails.displayDate}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blush-soft/90 px-3 py-1 text-xs font-semibold text-wine ring-1 ring-rose/30">
              {previewDetails.time}
            </span>
          </div>
        )}

        {/* Confirm CTA + Back */}
        <div className="relative z-10 mt-1 flex w-full flex-col items-center gap-2.5">
          <div className="relative">
            {confirming && !reducedMotion && (
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(198,161,91,0.75),rgba(196,139,143,0.35)_55%,transparent_75%)] animate-accept-glow"
              />
            )}

            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate || confirming}
              className={`group relative overflow-hidden rounded-full bg-gradient-to-br from-wine-soft via-wine to-wine px-8 py-3 text-base font-semibold text-ivory shadow-lg ring-1 ring-gold/40 transition-all duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 ${
                confirming
                  ? "animate-accept-press shadow-[0_0_32px_rgba(198,161,91,0.7)]"
                  : selectedDate
                    ? "animate-glow-pulse"
                    : ""
              }`}
            >
              {selectedDate && !confirming && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-sheen"
                  style={{ "--sheen-duration": "3.8s", "--sheen-delay": "1.2s" } as React.CSSProperties}
                />
              )}
              <span className="relative">
                {selectedDate ? CALENDAR_COPY.confirmReady : CALENDAR_COPY.confirmIdle}
              </span>
            </button>

            {confirming && !reducedMotion && (
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

          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className="text-xs font-medium text-charcoal-soft/75 underline-offset-4 transition-colors hover:text-wine hover:underline disabled:opacity-40"
          >
            {CALENDAR_COPY.back}
          </button>
        </div>
      </div>
    </div>
  );
}
