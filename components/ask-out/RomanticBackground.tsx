const SPARKLES = [
  { top: "12%", left: "8%", size: "0.35rem", delay: "0s", duration: "3.4s" },
  { top: "22%", left: "82%", size: "0.3rem", delay: "0.6s", duration: "4.1s" },
  { top: "68%", left: "15%", size: "0.4rem", delay: "1.1s", duration: "3.8s" },
  { top: "78%", left: "72%", size: "0.3rem", delay: "1.8s", duration: "3.2s" },
  { top: "40%", left: "92%", size: "0.35rem", delay: "0.3s", duration: "4.4s" },
  { top: "88%", left: "40%", size: "0.3rem", delay: "2.2s", duration: "3.6s" },
  { top: "8%", left: "55%", size: "0.3rem", delay: "1.4s", duration: "4s" },
  { top: "55%", left: "5%", size: "0.35rem", delay: "0.9s", duration: "3.5s" },
];

/**
 * Moment 7 — depth that only exists after she says yes: soft out-of-focus lights, well
 * behind everything. Sized in vmin so they scale with the screen instead of overwhelming
 * a phone. No blur filter — these are radial gradients, which cost nothing to animate.
 */
const BOKEH = [
  { top: "18%", left: "14%", size: 26, x: 14, y: -22, opacity: 0.3, duration: "15s" },
  { top: "62%", left: "78%", size: 32, x: -18, y: 16, opacity: 0.26, duration: "19s" },
  { top: "78%", left: "26%", size: 22, x: 12, y: -14, opacity: 0.22, duration: "17s" },
  { top: "32%", left: "62%", size: 18, x: -10, y: 18, opacity: 0.28, duration: "13s" },
];

/** Faint far stars — smaller and steadier than the ambient sparkles. */
const STARS = [
  { top: "16%", left: "34%", delay: "0.2s" },
  { top: "28%", left: "70%", delay: "1.1s" },
  { top: "44%", left: "18%", delay: "0.6s" },
  { top: "58%", left: "88%", delay: "1.7s" },
  { top: "72%", left: "52%", delay: "0.9s" },
  { top: "86%", left: "12%", delay: "2.1s" },
];

/** Hearts rising slowly through the far background. Negative delays = already mid-flight. */
const AMBIENT_HEARTS = [
  { left: "5%", size: "1.1rem", duration: "19s", delay: "-2s", sway: "40px", rot: "22deg", opacity: 0.32, color: "text-rose" },
  { left: "14%", size: "0.7rem", duration: "23s", delay: "-11s", sway: "-30px", rot: "-16deg", opacity: 0.28, color: "text-rose-deep" },
  { left: "24%", size: "1.4rem", duration: "27s", delay: "-6s", sway: "26px", rot: "14deg", opacity: 0.2, color: "text-wine-soft" },
  { left: "36%", size: "0.6rem", duration: "17s", delay: "-14s", sway: "-22px", rot: "-24deg", opacity: 0.3, color: "text-gold" },
  { left: "48%", size: "0.9rem", duration: "25s", delay: "-19s", sway: "34px", rot: "18deg", opacity: 0.22, color: "text-rose" },
  { left: "60%", size: "1.2rem", duration: "21s", delay: "-4s", sway: "-38px", rot: "-20deg", opacity: 0.26, color: "text-rose-deep" },
  { left: "70%", size: "0.65rem", duration: "18s", delay: "-9s", sway: "24px", rot: "26deg", opacity: 0.3, color: "text-gold" },
  { left: "80%", size: "1.5rem", duration: "29s", delay: "-16s", sway: "-28px", rot: "-12deg", opacity: 0.18, color: "text-wine-soft" },
  { left: "89%", size: "0.85rem", duration: "20s", delay: "-1s", sway: "30px", rot: "20deg", opacity: 0.3, color: "text-rose" },
  { left: "95%", size: "0.6rem", duration: "24s", delay: "-13s", sway: "-20px", rot: "-18deg", opacity: 0.26, color: "text-rose-deep" },
];

interface RomanticBackgroundProps {
  /**
   * Warms and brightens the whole backdrop for the celebration, and keeps it that way
   * through the final reveal — the page transforms rather than being replaced.
   */
  magical?: boolean;
}

/**
 * Ambient backdrop: a few slow blurred gradient blobs + tiny twinkling sparkles.
 * Pure CSS animation (transform/opacity only) — no JS render loop, no DOM growth.
 */
export default function RomanticBackground({ magical = false }: RomanticBackgroundProps) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ivory">
      <div
        className={`absolute -left-1/4 -top-1/4 h-[60vmax] w-[60vmax] rounded-full bg-blush/50 blur-3xl animate-blob-a transition-opacity duration-1600 ${
          magical ? "opacity-100" : "opacity-75"
        }`}
      />
      <div
        className={`absolute -right-1/4 top-1/3 h-[55vmax] w-[55vmax] rounded-full bg-rose/20 blur-3xl animate-blob-b transition-opacity duration-1600 ${
          magical ? "opacity-100" : "opacity-75"
        }`}
      />
      <div
        className={`absolute -bottom-1/3 left-1/4 h-[50vmax] w-[50vmax] rounded-full bg-gold-soft/25 blur-3xl animate-blob-c transition-opacity duration-1600 ${
          magical ? "opacity-100" : "opacity-75"
        }`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(107,42,58,0.06),transparent_60%)]" />

      {/* Soft light rays turning slowly behind the content. */}
      <div
        className="absolute left-1/2 top-[46%] h-[170vmax] w-[170vmax] animate-rays-spin opacity-70"
        style={{
          transform: "translate(-50%, -50%)",
          background:
            "repeating-conic-gradient(from 0deg, transparent 0deg, rgba(231,211,163,0.22) 5deg, transparent 10deg, transparent 22deg)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, rgba(0,0,0,0.5) 18%, transparent 42%)",
          maskImage: "radial-gradient(circle, black 0%, rgba(0,0,0,0.5) 18%, transparent 42%)",
        }}
      />

      {/* Hearts drifting upward through the far background. */}
      {AMBIENT_HEARTS.map((heart, index) => (
        <span
          key={`heart-${index}`}
          className={`absolute -bottom-[8%] leading-none animate-ambient-heart motion-reduce:hidden ${heart.color}`}
          style={
            {
              left: heart.left,
              fontSize: heart.size,
              "--heart-duration": heart.duration,
              "--heart-delay": heart.delay,
              "--heart-sway": heart.sway,
              "--heart-rot": heart.rot,
              "--heart-opacity": heart.opacity,
            } as React.CSSProperties
          }
        >
          ❤
        </span>
      ))}

      {/* Gentle vignette to pull the eye to the centre. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(107,42,58,0.12))]" />

      {/* Persistent warm veil + a slow breathing halo, only while the magic is live. */}
      <div
        className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(231,211,163,0.3),rgba(236,211,206,0.22)_55%,rgba(231,211,163,0.26))] transition-opacity duration-1600 ${
          magical ? "opacity-100" : "opacity-0"
        }`}
      />
      {magical && (
        <div className="absolute inset-0 animate-fade-in" style={{ animationDuration: "1200ms" }}>
          <div className="absolute inset-0 animate-halo-breathe bg-[radial-gradient(circle_at_50%_58%,rgba(198,161,91,0.3),rgba(196,139,143,0.16)_45%,transparent_72%)]" />

          {/* Bokeh depth. */}
          {BOKEH.map((light, index) => (
            <span
              key={`bokeh-${index}`}
              className="absolute rounded-full bg-[radial-gradient(circle,rgba(231,211,163,0.9),rgba(236,211,206,0.35)_55%,transparent_72%)] animate-bokeh-drift motion-reduce:hidden"
              style={
                {
                  top: light.top,
                  left: light.left,
                  width: `${light.size}vmin`,
                  height: `${light.size}vmin`,
                  "--bokeh-x": `${light.x}px`,
                  "--bokeh-y": `${light.y}px`,
                  "--bokeh-opacity": light.opacity,
                  "--bokeh-duration": light.duration,
                } as React.CSSProperties
              }
            />
          ))}

          {/* Far stars. */}
          {STARS.map((star, index) => (
            <span
              key={`star-${index}`}
              className="absolute h-px w-px rounded-full bg-gold-soft shadow-[0_0_4px_1px_rgba(231,211,163,0.8)] animate-sparkle motion-reduce:hidden"
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
            />
          ))}
        </div>
      )}

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-gold/70 animate-sparkle motion-reduce:hidden"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
            animationDuration: sparkle.duration,
          }}
        />
      ))}

      <div className="paper-texture absolute inset-0" />
    </div>
  );
}
