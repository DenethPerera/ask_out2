"use client";

import { useMemo } from "react";
import { LOVE_NOTES } from "./content";

interface LoveNotesProps {
  /** Fewer, smaller notes on narrow screens. */
  compact?: boolean;
}

/**
 * Moment 8 — a few handwritten phrases drifting far behind the celebration. Atmosphere
 * only: nothing important is ever said here, and they sit under every real layer.
 */
export default function LoveNotes({ compact = false }: LoveNotesProps) {
  const notes = useMemo(() => {
    const chosen = compact ? LOVE_NOTES.slice(0, 3) : LOVE_NOTES;
    return chosen.map((text, index) => ({
      text,
      // Kept away from the centre column where the headline and card live.
      left: [12, 74, 22, 68][index % 4],
      top: [26, 34, 68, 72][index % 4],
      drift: (index % 2 === 0 ? 1 : -1) * (10 + index * 4),
      size: compact ? 0.95 + index * 0.05 : 1.15 + index * 0.08,
      opacity: 0.34 + (index % 3) * 0.08,
      duration: 4600 + index * 700,
      delay: index * 620,
    }));
  }, [compact]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {notes.map((note) => (
        <span
          key={note.text}
          className="absolute animate-note-drift font-script whitespace-nowrap text-rose-deep"
          style={
            {
              left: `${note.left}%`,
              top: `${note.top}%`,
              fontSize: `${note.size}rem`,
              "--note-x": `${note.drift}px`,
              "--note-opacity": note.opacity,
              "--note-duration": `${note.duration}ms`,
              "--note-delay": `${note.delay}ms`,
            } as React.CSSProperties
          }
        >
          {note.text}
        </span>
      ))}
    </div>
  );
}
