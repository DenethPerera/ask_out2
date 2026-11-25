import { isAskOutOutcome, notifyOutcome } from "@/lib/askOutNotification";

/**
 * POST /api/outcome — "she answered".
 *
 * One endpoint for all three answers (accepted / declined / ignored). Only POST is
 * exported, so every other method gets a 405 from the framework.
 *
 * Deliberate properties:
 *  - the recipient lives in server env, never in the request; the browser cannot redirect
 *    this email anywhere
 *  - the request chooses *which* of three fixed messages is sent, never its content, so
 *    there is nothing an abuser could inject
 *  - the answer is always 200 with a neutral body: the page must never be able to
 *    observe, or be delayed by, the mail provider
 */

const MAX_ID_LENGTH = 64;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Cheap abuse gate: a browser fetch from our own page always reports same-origin. curl
 * can forge these headers, which is why it is only the outer layer — the real limits are
 * the server-side one-send-per-outcome record and the rate limit in the notifier.
 */
function isSameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser or older client; the notifier still gates it

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false, status: "rejected" }, { status: 403 });
  }

  let outcome: unknown;
  let eventId: unknown;
  try {
    const body = await request.json();
    outcome = (body as { outcome?: unknown })?.outcome;
    eventId = (body as { eventId?: unknown })?.eventId;
  } catch {
    return Response.json({ ok: false, status: "invalid" }, { status: 400 });
  }

  if (!isAskOutOutcome(outcome)) {
    return Response.json({ ok: false, status: "invalid" }, { status: 400 });
  }

  if (
    typeof eventId !== "string" ||
    eventId.length > MAX_ID_LENGTH ||
    !ID_PATTERN.test(eventId)
  ) {
    return Response.json({ ok: false, status: "invalid" }, { status: 400 });
  }

  // Awaited so the platform doesn't tear the function down mid-send, but the client never
  // waits on the result: it fires this request without reading the response.
  const result = await notifyOutcome(outcome, eventId);

  // Result is logged, not returned in detail — the page has no business knowing.
  return Response.json({ ok: true, status: result === "sent" ? "recorded" : "acknowledged" });
}
