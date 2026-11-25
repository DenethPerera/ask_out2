"use client";

import Envelope from "./Envelope";
import Letter from "./Letter";
import type { EnvelopeStage } from "./useAskOutExperience";

interface EnvelopeCardProps {
  stage: EnvelopeStage;
  onOpen: () => void;
  onClose: () => void;
  onIgnore: () => void;
}

export default function EnvelopeCard({
  stage,
  onOpen,
  onClose,
  onIgnore,
}: EnvelopeCardProps) {
  const openDisabled = stage !== "closed";
  const closeDisabled = stage !== "opened";
  const ignoreDisabled = stage === "opening" || stage === "closing";

  return (
    <div className="mx-auto flex flex-col items-center gap-10">
      <div
        className={`text-center transition-opacity duration-500 ${
          stage === "closed" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p className="font-script text-xl text-wine sm:text-2xl">I have something to tell you&hellip;</p>
        <p className="mt-1 text-xs font-medium tracking-wide text-charcoal-soft sm:text-sm">
          Open when you&rsquo;re ready ❤️
        </p>
      </div>

      <div className="w-full pt-4 sm:pt-6">
        <div className="relative mx-auto h-44 w-72 sm:h-48 sm:w-80 md:h-56 md:w-96">
          <Letter stage={stage} />
          <Envelope stage={stage} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpen}
          disabled={openDisabled}
          className="group rounded-full bg-wine px-6 py-3 text-base font-semibold text-ivory shadow-lg transition-all duration-200 hover:scale-105 hover:bg-wine-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-wine"
        >
          Open the letter{" "}
          <span className="inline-block group-hover:animate-heart-wiggle group-focus-visible:animate-heart-wiggle">
            ❤️
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="rounded-full border border-rose/40 bg-ivory px-6 py-3 text-base font-semibold text-wine shadow-md transition-all duration-200 hover:scale-105 hover:bg-blush-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-ivory"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onIgnore}
          disabled={ignoreDisabled}
          className="rounded-full px-6 py-3 text-base font-medium text-charcoal-soft underline-offset-4 transition-all duration-200 hover:text-wine hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}
