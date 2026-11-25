import { REACTION_PHOTO } from "./content";
import PhotoCard from "./PhotoCard";

interface ReactionImageCardProps {
  /** Optional line above the photo, e.g. "Oh really? 👀". */
  heading?: string;
  /** Optional line below the photo, e.g. "I’ll remember that 😂❤️". */
  caption?: string;
  /** "on-dark" for the Ignore overlay backdrop, "on-light" for an ivory card. */
  tone?: "on-light" | "on-dark";
  /** Dramatic pause before the photo pops in. */
  revealDelayMs?: number;
  frameClassName?: string;
  sizes?: string;
  className?: string;
}

/**
 * The shared punchline: heading, the one reaction photo, caption. Used by both the
 * Ignore overlay and the "Maybe another time" decline so the presentation lives once.
 *
 * Nothing is layered over the photo itself — the image already carries its own text,
 * so every extra word sits above or below the card.
 */
export default function ReactionImageCard({
  heading,
  caption,
  tone = "on-light",
  revealDelayMs = 0,
  frameClassName,
  sizes,
  className = "",
}: ReactionImageCardProps) {
  const onDark = tone === "on-dark";

  return (
    <div className={`flex flex-col items-center gap-4 text-center ${className}`}>
      {heading ? (
        <h2
          className={`animate-fade-in-up text-balance font-display text-2xl font-semibold sm:text-3xl ${
            onDark ? "text-ivory" : "text-wine"
          }`}
        >
          {heading}
        </h2>
      ) : (
        <div aria-hidden className="flex items-center gap-4">
          <span className="text-lg">👀</span>
          <span className="animate-sparkle text-sm">✨</span>
        </div>
      )}

      <PhotoCard
        photo={REACTION_PHOTO}
        reveal="pop"
        rotate={-2}
        rotateFrom={-5}
        revealDelayMs={revealDelayMs}
        float
        sparkle
        frameClassName={frameClassName}
        sizes={sizes}
        className="w-full"
      />

      {caption && (
        <p
          className={`animate-fade-in-up font-script text-2xl ${
            onDark ? "text-ivory drop-shadow-[0_2px_8px_rgba(58,46,44,0.6)]" : "text-rose-deep"
          }`}
          style={{ animationDelay: `${revealDelayMs + 320}ms` }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
