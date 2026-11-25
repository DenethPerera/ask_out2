"use client";

import { useCallback, useState } from "react";
import AcceptanceScreen from "@/components/ask-out/AcceptanceScreen";
import CelebrationScene from "@/components/ask-out/CelebrationScene";
import {
  DATE_DETAILS,
  DECLINE_COPY,
  type DateDetails,
} from "@/components/ask-out/content";
import DateCalendarPicker from "@/components/ask-out/DateCalendarPicker";
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
  const {
    stage,
    open,
    close,
    chooseDate,
    backToQuestion,
    celebrate,
    finishCelebration,
    decline,
  } = useAskOutExperience();
  const [showIgnoreImage, setShowIgnoreImage] = useState(false);
  const [geometry, setGeometry] = useState<AcceptanceGeometry | null>(null);
  const [chosenDate, setChosenDate] = useState<DateDetails>(DATE_DETAILS);
  const reducedMotion = useReducedMotion();
  const notify = useOutcomeNotification();

  const isEnvelopeStage =
    stage === "closed" ||
    stage === "opening" ||
    stage === "opened" ||
    stage === "closing";

  const isPickingDate = stage === "pickingDate";
  const isCelebrating = stage === "celebrating";
  const isDeclining = stage === "declining";

  /**
   * Pressing "For sure ❤️" opens the calendar so she can choose the day & time that
   * works best for her before the celebration locks in the invitation.
   */
  const handleYesStep = useCallback(() => {
    chooseDate();
  }, [chooseDate]);

  /**
   * Once she locks in her chosen date & time on the calendar, the full celebration
   * unfolds from her fingertip and the acceptance email is dispatched with her date.
   */
  const handleConfirmDate = useCallback(
    (details: DateDetails, accepted: AcceptanceGeometry) => {
      setChosenDate(details);
      setGeometry(accepted);
      celebrate();
      notify("accepted", {
        isoDate: details.isoDate,
        timeSlot: details.time,
      });
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
      <RomanticBackground magical={isPickingDate || isCelebrating || stage === "accepted"} />

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

        {(stage === "dateQuestion" || isDeclining) && (
          <div
            key="dateQuestion"
            aria-hidden={isDeclining}
            className={
              isDeclining
                ? "animate-scene-dissolve pointer-events-none"
                : "animate-fade-in-up"
            }
            style={
              isDeclining
                ? ({
                    "--dissolve-delay": reducedMotion ? "40ms" : "0ms",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <DateQuestion onAccept={handleYesStep} onDecline={handleDecline} />
          </div>
        )}

        {(isPickingDate || isCelebrating) && (
          <div
            key="pickingDate"
            aria-hidden={isCelebrating}
            className={
              isCelebrating
                ? "animate-scene-dissolve pointer-events-none"
                : "animate-fade-in-up"
            }
            style={
              isCelebrating
                ? ({
                    "--dissolve-delay": reducedMotion ? "40ms" : "560ms",
                  } as React.CSSProperties)
                : undefined
            }
          >
            <DateCalendarPicker
              onConfirm={handleConfirmDate}
              onBack={backToQuestion}
            />
          </div>
        )}

        {stage === "accepted" && (
          <div key="accepted" className="animate-fade-in-up">
            <AcceptanceScreen dateDetails={chosenDate} />
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
        <CelebrationScene
          geometry={geometry}
          dateDetails={chosenDate}
          onComplete={finishCelebration}
        />
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
