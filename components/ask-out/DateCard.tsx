import { CELEBRATION_COPY, DATE_DETAILS, type DateDetails } from "./content";

/** Perimeter of the border path below, for the draw-on animation. */
const CARD_W = 260;
const CARD_H = 300;
const CARD_R = 18;
const BORDER_LENGTH = Math.ceil(
  2 * (CARD_W - CARD_R * 2) + 2 * (CARD_H - CARD_R * 2) + 2 * Math.PI * CARD_R,
);

interface DateCardProps {
  /**
   * When true the gold border draws itself on and the face fills in behind it — the
   * card looks physically made. When false it simply appears (final screen, and the
   * reduced-motion path).
   */
  draw?: boolean;
  details?: DateDetails;
  className?: string;
}

/**
 * The invitation. A calendar plate rather than a form field: month tracked out in small
 * caps over a hairline rule, the day set large in the display face, weekday beneath it,
 * year as a quiet footnote, and a heart to close.
 */
export default function DateCard({
  draw = false,
  details = DATE_DETAILS,
  className = "",
}: DateCardProps) {
  const hasTime = details.time.trim().length > 0;
  const hasLocation = details.location.trim().length > 0;

  return (
    <div className={`relative w-[min(78vw,16.25rem)] ${className}`}>
      {/* The drawn border sits above the face, inset by half a stroke so it stays crisp. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <rect
          x={1}
          y={1}
          width={CARD_W - 2}
          height={CARD_H - 2}
          rx={CARD_R}
          stroke="var(--color-gold)"
          strokeOpacity={0.85}
          strokeWidth={1.25}
          className={draw ? "animate-line-draw-hold" : undefined}
          style={
            draw
              ? ({
                  "--path-length": BORDER_LENGTH,
                  "--draw-duration": "820ms",
                  vectorEffect: "non-scaling-stroke",
                } as React.CSSProperties)
              : { vectorEffect: "non-scaling-stroke" }
          }
        />
      </svg>

      <div
        className={`relative flex flex-col items-center overflow-hidden rounded-[1.125rem] bg-[linear-gradient(175deg,var(--color-ivory),var(--color-cream))] px-5 py-[clamp(0.75rem,min(4vw,3.5vh),1.5rem)] text-center shadow-[0_14px_34px_-16px_rgba(58,46,44,0.45)] ${
          draw ? "animate-invitation-fill" : ""
        }`}
        style={draw ? ({ "--fill-delay": "420ms" } as React.CSSProperties) : undefined}
      >
        <p
          className={`font-display text-sm font-semibold text-rose-deep ${
            draw ? "animate-fade-in" : ""
          }`}
          style={draw ? { animationDelay: "560ms" } : undefined}
        >
          {CELEBRATION_COPY.invitationEyebrow}
        </p>

        <div
          aria-hidden
          className={`mt-3 h-px w-14 bg-gold/60 ${draw ? "animate-fade-in" : ""}`}
          style={draw ? { animationDelay: "620ms" } : undefined}
        />

        <p
          className={`mt-[clamp(0.35rem,min(3vw,2.5vh),1rem)] text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-charcoal-soft ${
            draw ? "animate-fade-in-up" : ""
          }`}
          style={draw ? { animationDelay: "700ms" } : undefined}
        >
          {details.month}
        </p>

        <p
          className={`font-display text-[clamp(2.5rem,min(13vw,12vh),4.25rem)] font-semibold leading-[0.95] text-wine ${
            draw ? "animate-light-write" : ""
          }`}
          style={draw ? { animationDelay: "760ms" } : undefined}
        >
          {details.day}
        </p>

        <p
          className={`mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-rose-deep ${
            draw ? "animate-fade-in-up" : ""
          }`}
          style={draw ? { animationDelay: "980ms" } : undefined}
        >
          {details.weekday}
        </p>

        <p
          className={`mt-[clamp(0.3rem,min(2.5vw,2vh),0.75rem)] text-xs tracking-[0.3em] text-charcoal-soft/80 ${
            draw ? "animate-fade-in" : ""
          }`}
          style={draw ? { animationDelay: "1120ms" } : undefined}
        >
          {details.year}
        </p>

        {(hasTime || hasLocation) && (
          <dl
            className={`mt-3 space-y-1 text-xs font-medium text-wine-soft ${draw ? "animate-fade-in" : ""}`}
            style={draw ? { animationDelay: "1200ms" } : undefined}
          >
            {hasTime && (
              <div>
                <dt className="sr-only">Time</dt>
                <dd>{details.time}</dd>
              </div>
            )}
            {hasLocation && (
              <div>
                <dt className="sr-only">Where</dt>
                <dd>{details.location}</dd>
              </div>
            )}
          </dl>
        )}

        <span
          aria-hidden
          className={`mt-[clamp(0.35rem,min(3vw,2.5vh),1rem)] text-sm text-rose ${draw ? "animate-fade-in" : ""}`}
          style={draw ? { animationDelay: "1280ms" } : undefined}
        >
          ❤
        </span>
      </div>
    </div>
  );
}
