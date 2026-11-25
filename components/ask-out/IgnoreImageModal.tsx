"use client";

import { useEffect, useRef } from "react";
import { IGNORE_COPY } from "./content";
import ReactionImageCard from "./ReactionImageCard";

/** Beat between the screen darkening and the photo landing — the dramatic pause. */
const DRAMATIC_PAUSE_MS = 200;

interface IgnoreImageModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Staged presentation rather than a bare image: the backdrop darkens and blurs the
 * envelope scene behind it, a soft light blooms, a short pause lands, then the photo
 * pops in with a small bounce.
 *
 * Nothing here touches the experience state — closing returns to exactly the envelope
 * or letter stage that was live when "Ignore" was pressed.
 */
export default function IgnoreImageModal({ open, onClose }: IgnoreImageModalProps) {
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dismissButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={IGNORE_COPY.dialogLabel}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_42%,rgba(58,46,44,0.4),rgba(46,30,32,0.66))] backdrop-blur-md animate-fade-in"
      style={{
        paddingTop: "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
      onClick={onClose}
    >
      <div
        className="relative my-auto flex w-full max-w-[min(88vw,26rem)] flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Soft light behind the photo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 animate-fade-in rounded-full bg-[radial-gradient(circle,rgba(231,211,163,0.5),rgba(196,139,143,0.28)_45%,transparent_72%)] blur-2xl"
          style={{ animationDuration: "700ms" }}
        />

        <ReactionImageCard
          tone="on-dark"
          caption={IGNORE_COPY.caption}
          revealDelayMs={DRAMATIC_PAUSE_MS}
          frameClassName="aspect-square w-[min(80vw,22rem,calc(56vh))]"
          sizes="(max-width: 640px) 80vw, 352px"
          className="relative"
        />

        <button
          ref={dismissButtonRef}
          type="button"
          onClick={onClose}
          className="relative animate-fade-in-up rounded-full bg-ivory px-6 py-3 text-base font-semibold text-wine shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft active:scale-95"
          style={{ animationDelay: `${DRAMATIC_PAUSE_MS + 460}ms` }}
        >
          {IGNORE_COPY.dismiss}
        </button>
      </div>
    </div>
  );
}
