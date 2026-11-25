"use client";

import { useCallback, useState } from "react";
import AcceptanceScreen from "@/components/ask-out/AcceptanceScreen";
import CelebrationScene from "@/components/ask-out/CelebrationScene";
import { DECLINE_COPY } from "@/components/ask-out/content";
import DateQuestion from "@/components/ask-out/DateQuestion";
import EnvelopeCard from "@/components/ask-out/EnvelopeCard";
import type { AcceptanceGeometry } from "@/components/ask-out/geometry";
import IgnoreImageModal from "@/components/ask-out/IgnoreImageModal";
import InteractiveCursor from "@/components/ask-out/InteractiveCursor";
import ReactionImageCard from "@/components/ask-out/ReactionImageCard";
import RomanticBackground from "@/components/ask-out/RomanticBackground";
import { useOutcomeNotification } from "@/components/ask-out/useOutcomeNotification";
import { useAskOutExperience } from "@/components/ask-out/useAskOutExperience";
import { useReducedMotion } from "@/components/ask-out/useReducedMotion";

export default function Home() {
  const { stage, open, close, celebrate, finishCelebration, decline } = useAskOutExperience();
  const [showIgnoreImage, setShowIgnoreImage] = useState(false);
  const [geometry, setGeometry] = useState<AcceptanceGeometry | null>(null);
  const reducedMotion = useReducedMotion();
  const notify = useOutcomeNotification();

  const isEnvelopeStage =
    stage === "closed" ||
    stage === "opening" ||
    stage === "opened" ||
    stage === "closing";

  const isCelebrating = stage === "celebrating";
  const isDeclining = stage === "declining";
  // Both transitions dissolve the question card rather than snapping it away.
  const isLeavingQuestion = isCelebrating || isDeclining;

  /**
   * The three answer paths. Each fires its notification the moment the answer is
   * registered — not when the animation finishes — and never awaits it. Nothing about the
   * email can delay, block, or alter what she sees, whichever way she answers.
   */
  const handleAccept = useCallback(
    (accepted: AcceptanceGeometry) => {
      setGeometry(accepted);
      celebrate();
      notify("accepted");
    },
    [celebrate, notify],
  );

  const handleDecline = useCallback(() => {
    decline();
    notify("declined");
  }, [decline, notify]);

  /**
   * "Ignore" is reported too, but as its own outcome rather than a decline: the letter is
   * still sitting there and she can open it afterwards, so the email says exactly that.
   */
  const handleIgnore = useCallback(() => {
    setShowIgnoreImage(true);
    notify("ignored");
  }, [notify]);

  return (
    <main
      className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <RomanticBackground magical={isCelebrating || stage === "accepted"} />

      <InteractiveCursor
        className={`w-full ${stage === "accepted" ? "max-w-2xl" : "max-w-xl"}`}
      >
        {isEnvelopeStage && (
          <EnvelopeCard
            stage={stage}
            onOpen={open}
            onClose={close}
            onIgnore={handleIgnore}
          />
        )}

        {(stage === "dateQuestion" || isLeavingQuestion) && (
          <div
            key="dateQuestion"
            aria-hidden={isLeavingQuestion}
            className={
              isLeavingQuestion
                ? "animate-scene-dissolve pointer-events-none"
                : "animate-fade-in-up"
            }
            style={
              isLeavingQuestion
                ? ({
                    // The celebration grows out of the card, so it lingers; the decline
                    // clears out fast to make room for the "Wait…" beat.
                    "--dissolve-delay": reducedMotion ? "40ms" : isCelebrating ? "560ms" : "0ms",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <DateQuestion onAccept={handleAccept} onDecline={handleDecline} />
          </div>
        )}

        {stage === "accepted" && (
          <div key="accepted" className="animate-fade-in-up">
            <AcceptanceScreen />
          </div>
        )}

        {stage === "declined" && (
          <div
            key="declined"
            className="mx-auto flex max-w-md animate-fade-in-up flex-col items-center rounded-3xl bg-ivory/90 p-6 shadow-xl backdrop-blur sm:p-8"
          >
            <ReactionImageCard
              heading={DECLINE_COPY.heading}
              caption={DECLINE_COPY.caption}
              revealDelayMs={120}
              frameClassName="aspect-square w-[min(74vw,20rem,calc(48vh))]"
              sizes="(max-width: 640px) 74vw, 320px"
            />
          </div>
        )}
      </InteractiveCursor>

      {isCelebrating && (
        <CelebrationScene geometry={geometry} onComplete={finishCelebration} />
      )}

      {/* The dramatic beat between "Maybe another time" and the punchline. */}
      {isDeclining && (
        <div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-6"
          aria-live="polite"
        >
          <p className="animate-fade-in font-script text-3xl text-wine sm:text-4xl">
            {DECLINE_COPY.transition}
          </p>
        </div>
      )}

      <IgnoreImageModal open={showIgnoreImage} onClose={() => setShowIgnoreImage(false)} />
    </main>
  );
}
