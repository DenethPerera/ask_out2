import Image from "next/image";
import type { PhotoAsset } from "./content";

interface PhotoCardProps {
  photo: PhotoAsset;
  /** Handwritten line printed on the card itself, under the photo. */
  caption?: string;
  /** Degrees the card settles at. 0 for the romantic final reveal, a slight tilt elsewhere. */
  rotate?: number;
  /** Degrees it starts from, before it settles. */
  rotateFrom?: number;
  /**
   * "place" is the elegant photograph-being-laid-down reveal for the final screen.
   * "pop" is the quick scale-in with a playful bounce for the funny reactions.
   */
  reveal?: "place" | "pop";
  revealDelayMs?: number;
  /** Slow idle drift once it has landed. */
  float?: boolean;
  /** Tiny twinkle on one corner — sits on the cream border, never over the photo. */
  sparkle?: boolean;
  sizes?: string;
  className?: string;
  /**
   * Sizes the photo frame. Widths are clamped against viewport height as well as
   * width so the card never runs past the screen in landscape or on short windows.
   */
  frameClassName?: string;
}

/**
 * Photo-card presentation shared by the reaction overlays and the final reveal: cream
 * mount, real shadow, placed rather than faded in. Rotation lives on the outer element
 * and the idle float on the inner one, so the two transforms never collide.
 *
 * The frame uses object-contain over a cream mount, so nothing in the photo is ever
 * cropped — including text baked into the image.
 */
export default function PhotoCard({
  photo,
  caption,
  rotate = 0,
  rotateFrom,
  reveal = "place",
  revealDelayMs = 0,
  float = false,
  sparkle = false,
  sizes = "(max-width: 640px) 82vw, 420px",
  className = "",
  // Concrete width by default: the figure hugs the frame, so a percentage width here
  // would have nothing to resolve against.
  frameClassName = "aspect-square w-[min(82vw,22rem)]",
}: PhotoCardProps) {
  return (
    <div
      className={`${reveal === "pop" ? "animate-reaction-pop" : "animate-photo-reveal"} ${className}`}
      style={
        {
          "--photo-rotate": `${rotate}deg`,
          "--photo-rotate-from": `${rotateFrom ?? rotate - 3}deg`,
          animationDelay: `${revealDelayMs}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className={float ? "animate-photo-float" : undefined}
        style={float ? { animationDelay: `${revealDelayMs + 900}ms` } : undefined}
      >
        <figure className="relative mx-auto w-fit rounded-[1.4rem] bg-ivory p-3 pb-2 shadow-[0_20px_45px_-14px_rgba(58,46,44,0.5)] ring-1 ring-cream">
          <div className={`relative overflow-hidden rounded-2xl bg-cream ${frameClassName}`}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes={sizes}
              className={photo.fit === "cover" ? "object-cover" : "object-contain"}
            />
          </div>

          {caption && (
            <figcaption className="pt-3 pb-1 font-script text-xl text-wine">{caption}</figcaption>
          )}

          {sparkle && (
            <span
              aria-hidden
              className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-gold animate-sparkle"
            />
          )}
        </figure>
      </div>
    </div>
  );
}
