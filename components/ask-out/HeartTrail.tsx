export interface TrailHeart {
  id: number;
  x: number;
  y: number;
}

interface HeartTrailProps {
  hearts: TrailHeart[];
  onSettled: (id: number) => void;
}

const HEART_LIFETIME_MS = 1200;

/** Renders a handful of self-removing floating hearts at fixed positions within a relatively-positioned parent. */
export default function HeartTrail({ hearts, onSettled }: HeartTrailProps) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="absolute text-rose animate-heart-float"
          style={{
            left: heart.x,
            top: heart.y,
            fontSize: "0.85rem",
            animationDuration: `${HEART_LIFETIME_MS}ms`,
            animationIterationCount: 1,
          }}
          onAnimationEnd={() => onSettled(heart.id)}
        >
          ❤
        </span>
      ))}
    </div>
  );
}
