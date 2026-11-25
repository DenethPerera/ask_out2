import Image from "next/image";
import { DATE_DETAILS, LETTER_STICKER } from "./content";

/**
 * Perforated stamp edge: circles punched out of the body along all four edges, spaced
 * evenly so the corners land on a punch rather than between two. Generated instead of
 * hand-written because that is 56 near-identical elements.
 */
const PERF_STEP = 8;
const PERF_RADIUS = 3.2;
/** Body spans 4→116 horizontally and 4→132 vertically, in the 120×136 viewBox. */
const PERF_X = Array.from({ length: 13 }, (_, i) => 12 + i * PERF_STEP);
const PERF_Y = Array.from({ length: 15 }, (_, i) => 12 + i * PERF_STEP);

/** Single-path heart, drawn to fill a 40×36 box at the origin. */
const HEART_PATH =
  "M20 34.2C20 34.2 2.4 22.6 2.4 12.4C2.4 6.3 6.9 2.4 11.4 2.4C15 2.4 18.6 4.6 20 7.6C21.4 4.6 25 2.4 28.6 2.4C33.1 2.4 37.6 6.3 37.6 12.4C37.6 22.6 20 34.2 20 34.2Z";

const POSTMARK = `${DATE_DETAILS.day} ${DATE_DETAILS.month.slice(0, 3).toUpperCase()} ${DATE_DETAILS.year}`;

/** Dissolves the photo's edges into the paper so it has no cut-out border. */
const FEATHER = "radial-gradient(ellipse at 50% 45%, #000 38%, transparent 74%)";

interface LetterStickerProps {
  /** Milliseconds to wait before it presses down — after the paragraphs have settled. */
  delayMs?: number;
}

/**
 * The faded keepsake in the letter's bottom-right corner. A photograph when one is
 * configured in content.ts, otherwise a drawn postage stamp carrying the date — so the
 * corner is never empty and the component needs no asset to work.
 *
 * Decorative in both forms: aria-hidden, non-interactive, and it sits under the text so
 * a short viewport can never make it compete with the words.
 */
export default function LetterSticker({ delayMs = 640 }: LetterStickerProps) {
  const style = {
    "--sticker-delay": `${delayMs}ms`,
    // Photographs carry detail, so they need more presence than flat ink to read at all.
    "--sticker-opacity": LETTER_STICKER ? "0.5" : "0.32",
    "--sticker-rotate": "-8deg",
  } as React.CSSProperties;

  return (
    <div
      aria-hidden
      className={`animate-sticker-press pointer-events-none absolute bottom-4 right-4 z-0 w-24 select-none sm:w-28 ${
        // Multiply prints flat ink into the paper, but it would crush a photograph — and
        // this one is mostly black lace — into an unreadable blot.
        LETTER_STICKER ? "" : "mix-blend-multiply"
      }`}
      style={style}
    >
      {LETTER_STICKER ? (
        /*
         * No frame, no hard edge. A rectangle of photo pasted on the paper reads as a
         * mistake where it meets the text, so the image is feathered into the page with a
         * radial mask and warmed into the letter's palette — a watermark, not a cut-out.
         */
        <div
          className="relative aspect-square"
          style={{
            maskImage: FEATHER,
            WebkitMaskImage: FEATHER,
          }}
        >
          <Image
            src={LETTER_STICKER.src}
            alt=""
            fill
            sizes="(max-width: 640px) 96px, 112px"
            /* The asset is pre-cropped square and framed on her — the full scene read as a
               dark blob at this size — so plain object-cover is all that is needed. */
            className={`${
              LETTER_STICKER.fit === "contain" ? "object-contain" : "object-cover"
            } filter-[sepia(0.45)_saturate(0.75)_contrast(0.95)_brightness(1.12)]`}
          />
        </div>
      ) : (
        <svg viewBox="0 0 120 136" className="w-full text-rose" role="presentation">
          <defs>
            <mask id="letter-stamp-perforation">
              <rect x="4" y="4" width="112" height="128" fill="#fff" />
              <g fill="#000">
                {PERF_X.map((x) => (
                  <circle key={`t${x}`} cx={x} cy={4} r={PERF_RADIUS} />
                ))}
                {PERF_X.map((x) => (
                  <circle key={`b${x}`} cx={x} cy={132} r={PERF_RADIUS} />
                ))}
                {PERF_Y.map((y) => (
                  <circle key={`l${y}`} cx={4} cy={y} r={PERF_RADIUS} />
                ))}
                {PERF_Y.map((y) => (
                  <circle key={`r${y}`} cx={116} cy={y} r={PERF_RADIUS} />
                ))}
              </g>
            </mask>
          </defs>

          {/* Paper of the stamp itself, punched by the mask. */}
          <rect
            x="4"
            y="4"
            width="112"
            height="128"
            mask="url(#letter-stamp-perforation)"
            className="text-blush"
            fill="currentColor"
          />

          {/* Hairline frame, then the printed design inside it. */}
          <rect
            x="13"
            y="13"
            width="94"
            height="110"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />

          <text
            x="60"
            y="29"
            textAnchor="middle"
            fontSize="7.5"
            letterSpacing="1.7"
            fill="currentColor"
          >
            SEALED WITH
          </text>

          <g transform="translate(40 38)">
            <path d={HEART_PATH} fill="currentColor" />
          </g>

          <text
            x="60"
            y="96"
            textAnchor="middle"
            fontSize="22"
            className="font-script text-wine"
            fill="currentColor"
          >
            love
          </text>

          <text
            x="60"
            y="114"
            textAnchor="middle"
            fontSize="7"
            letterSpacing="1.5"
            fill="currentColor"
          >
            {POSTMARK}
          </text>
        </svg>
      )}
    </div>
  );
}
