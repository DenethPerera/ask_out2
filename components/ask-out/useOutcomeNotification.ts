"use client";

import { useCallback, useRef } from "react";

import type { AskOutOutcome } from "@/lib/askOutNotification";

const ENDPOINT = "/api/outcome";
const STORAGE_PREFIX = "ask-out:event-id:";

/**
 * Module scope, so a remount cannot fire a second request for the same outcome within the
 * same page load. The ref below guards the component instance; this guards the tab.
 *
 * A Set rather than a boolean: she can ignore the envelope and *then* answer the question,
 * and the acceptance email must still go out.
 */
const requestsStarted = new Set<AskOutOutcome>();

/**
 * 32 hex characters, by whichever means the browser actually offers.
 *
 * crypto.randomUUID only exists in a secure context, so it is missing whenever the page is
 * opened over plain http — which is exactly what happens when she taps a LAN address like
 * http://192.168.1.20:3000 on her phone. getRandomValues has no such restriction, and the
 * Math.random arm is a last resort so this can never be the thing that throws.
 */
function randomId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid.replace(/-/g, "");

  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.getRandomValues === "function") {
    // Filled in place, so the result is a plain Uint8Array with no union to narrow.
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let out = "";
  while (out.length < 32) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function stableEventId(outcome: AskOutOutcome) {
  // Same id across a reload, so a refresh mid-flow is recognised server-side as the same
  // event rather than a new one. Per outcome, so they never collide.
  const key = `${STORAGE_PREFIX}${outcome}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const fresh = randomId();
    sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Storage can be unavailable (Safari private browsing, blocked cookies). The id is
    // still valid, it just will not survive a reload.
    return randomId();
  }
}

/**
 * Fires a private notification for what she did — exactly once per outcome — and never
 * lets it affect what she sees: the promise is not awaited anywhere, and every failure is
 * swallowed.
 *
 * Guards, outermost first: this hook's ref, the module Set above, a stable id the server
 * dedupes on, and the server's own one-send-per-outcome record.
 */
export function useOutcomeNotification() {
  const firedRef = useRef(new Set<AskOutOutcome>());

  return useCallback((outcome: AskOutOutcome) => {
    if (firedRef.current.has(outcome) || requestsStarted.has(outcome)) return;
    firedRef.current.add(outcome);
    requestsStarted.add(outcome);

    /*
     * Synchronous failures are swallowed too, not just rejected promises. This runs inside
     * her click handler, so anything thrown here would surface as a page error on top of
     * the moment she is in — the notification is never worth that.
     */
    try {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome, eventId: stableEventId(outcome) }),
        // Survives the tab being closed or navigated straight after she answers.
        keepalive: true,
      }).catch(() => {
        // Intentionally silent. Whatever she just chose, she is mid-moment.
      });
    } catch {
      // Same reasoning: never let telemetry interrupt the experience.
    }
  }, []);
}
