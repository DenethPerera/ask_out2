"use client";

import LetterSticker from "./LetterSticker";
import type { EnvelopeStage } from "./useAskOutExperience";

interface LetterProps {
  stage: EnvelopeStage;
}

const PARAGRAPHS = [
  "Hope you’re doing well. Just so you know, whenever I see you, my brain suddenly forgets how words work and I somehow go completely mute 😅",
  "So I think we need to fix that… preferably soon. I’d really love to talk to you properly and tell you what’s been on my mind. 😉",
];

const STAGGER_BASE_MS = 180;
const STAGGER_STEP_MS = 110;

export default function Letter({ stage }: LetterProps) {
  const isOpen = stage === "opening" || stage === "opened";

  return (
    <div
      className={`paper-texture absolute inset-x-[6%] origin-bottom overflow-hidden rounded-xl bg-gradient-to-b from-ivory to-cream text-left shadow-xl ring-1 ring-blush transition-all duration-700 ease-[cubic-bezier(0.34,1.15,0.64,1)] motion-reduce:duration-150 sm:inset-x-[10%] ${
        isOpen
          ? "-top-32 h-80 scale-100 p-5 sm:-top-36 sm:h-96 sm:p-6"
          : "top-[6%] h-[38%] scale-95 p-4"
      }`}
      style={{ zIndex: isOpen ? 30 : 10 }}
    >
      {/* Under the words: z-0 against the text's z-10, so it can never crowd them. */}
      {isOpen && <LetterSticker delayMs={STAGGER_BASE_MS + PARAGRAPHS.length * STAGGER_STEP_MS + 240} />}

      <div className="relative z-10 h-full overflow-y-auto" aria-hidden={!isOpen}>
        <p
          className={`font-script text-2xl leading-none text-wine sm:text-3xl ${
            isOpen ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: isOpen ? `${STAGGER_BASE_MS}ms` : undefined }}
        >
          Hey beautiful ❤️
        </p>
        {PARAGRAPHS.map((paragraph, index) => (
          <p
            key={index}
            className={`mt-4 text-sm leading-relaxed text-charcoal-soft sm:text-base ${
              isOpen ? "animate-fade-in-up" : "opacity-0"
            }`}
            style={{
              animationDelay: isOpen ? `${STAGGER_BASE_MS + (index + 1) * STAGGER_STEP_MS}ms` : undefined,
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
