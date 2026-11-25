import DateCard from "./DateCard";
import { FINAL_COPY, REACTION_PHOTO } from "./content";
import PhotoCard from "./PhotoCard";

/**
 * Phase 6 — the emotional landing, with the punchline. The big celebration has calmed
 * down by the time this mounts; only a few slow, persistent touches remain (floating
 * hearts, a breathing halo, one twinkle on the photo corner).
 *
 * The photograph is placed elegantly ("place" reveal) even though the picture itself is
 * a joke — that contrast is the point. All copy lives in FINAL_COPY (content.ts).
 */
const HEARTS = [
  { left: "8%", delay: "0s", size: "1.1rem" },
  { left: "24%", delay: "0.4s", size: "0.9rem" },
  { left: "45%", delay: "0.1s", size: "1.3rem" },
  { left: "62%", delay: "0.6s", size: "1rem" },
  { left: "78%", delay: "0.25s", size: "1.15rem" },
  { left: "91%", delay: "0.5s", size: "0.85rem" },
];

export default function AcceptanceScreen() {
  return (
    <div className="relative mx-auto max-w-md sm:max-w-2xl">
      <div className="pointer-events-none absolute -inset-10 animate-fade-in rounded-[3rem] bg-[radial-gradient(circle,rgba(198,161,91,0.25),rgba(107,42,58,0.08)_55%,transparent_75%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl bg-ivory/90 p-6 text-center shadow-2xl backdrop-blur animate-modal-pop sm:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {HEARTS.map((heart) => (
            <span
              key={heart.left}
              className="absolute bottom-0 animate-heart-float text-rose"
              style={{ left: heart.left, animationDelay: heart.delay, fontSize: heart.size }}
            >
              ❤
            </span>
          ))}
        </div>

        {/* One column on phones (title → line → photo → details → small print). From sm up
            the photograph moves alongside the words so nothing has to be scrolled to. */}
        <div className="relative flex flex-col items-center gap-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-x-8 sm:gap-y-4 sm:text-left">
          <h1 className="animate-fade-in-up font-display text-3xl font-semibold text-wine sm:col-start-2 sm:row-start-1 sm:text-4xl">
            {FINAL_COPY.title}
          </h1>

          <p
            className="-mt-2 animate-fade-in-up text-balance font-script text-xl text-rose-deep sm:col-start-2 sm:row-start-2 sm:mt-0"
            style={{ animationDelay: "180ms" }}
          >
            {FINAL_COPY.subtitle}
          </p>

          <PhotoCard
            photo={REACTION_PHOTO}
            reveal="place"
            rotate={0}
            rotateFrom={-2}
            revealDelayMs={360}
            float
            sparkle
            sizes="(max-width: 640px) 68vw, 300px"
            className="w-full sm:col-start-1 sm:row-span-4 sm:row-start-1 sm:self-center"
            frameClassName="aspect-square w-[min(68vw,17rem,calc(40vh))]"
          />

          {/* The invitation persists here, because the celebration overlay does not. */}
          <div
            className="animate-fade-in-up sm:col-start-2 sm:row-start-3"
            style={{ animationDelay: "700ms" }}
          >
            <DateCard />
          </div>

          <p
            className="-mt-1 animate-fade-in-up text-sm text-charcoal-soft sm:col-start-2 sm:row-start-4 sm:mt-0"
            style={{ animationDelay: "840ms" }}
          >
            {FINAL_COPY.smallPrint}
          </p>
        </div>
      </div>
    </div>
  );
}
