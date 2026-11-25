/**
 * SERVER ONLY. Never import this from a client component — it reads secrets from the
 * environment. The route handler in app/api/outcome/route.ts is its only caller.
 *
 * Responsibilities, in order:
 *   1. decide whether this request should produce an email at all (idempotency + rate limit)
 *   2. build the message from server-side config — nothing from the request body is used
 *   3. hand it to the transport, and swallow provider failures so the page never suffers
 */

import nodemailer from "nodemailer";

import { DATE_DETAILS } from "@/components/ask-out/content";

/**
 * What she did. Three distinct answers, three distinct emails:
 *   accepted — pressed "For sure ❤️"
 *   declined — pressed "Maybe another time ❤️"
 *   ignored  — tapped Ignore on the envelope rather than opening it
 *
 * "ignored" is deliberately its own outcome rather than being folded into "declined": she
 * can still open the letter afterwards, so the email says so instead of reporting a final
 * no that hasn't actually happened.
 */
export type AskOutOutcome = "accepted" | "declined" | "ignored";

export const ASK_OUT_OUTCOMES: readonly AskOutOutcome[] = ["accepted", "declined", "ignored"];

export function isAskOutOutcome(value: unknown): value is AskOutOutcome {
  return typeof value === "string" && (ASK_OUT_OUTCOMES as readonly string[]).includes(value);
}

export type NotificationResult =
  | "sent"
  | "duplicate" // same event id already handled
  | "already-notified" // a different id, but this outcome was already reported recently
  | "rate-limited"
  | "not-configured"
  | "provider-error";

/** Default recipient. Overridable by env; not a secret. */
const DEFAULT_RECIPIENT = "imalsha.sudheera@ktdoctor.com";

/** One email per outcome for this long, even across separate ids. */
const DEFAULT_DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * Hard ceiling per server instance, so a public endpoint can't be turned into a firehose.
 * Six rather than three because there are now three outcomes: one honest visit can
 * legitimately produce an ignore, a decline and an acceptance, and the cap must never be
 * what eats the acceptance — the one email that actually matters.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SENDS = 6;

/** Ids are remembered for a day; the map is trimmed so it cannot grow without bound. */
const ID_MEMORY_MS = 24 * 60 * 60 * 1000;
const ID_MEMORY_MAX = 500;

/**
 * In-memory state, deliberately. A single private ask-out does not justify provisioning a
 * database, and the failure mode is mild: if the platform starts a second instance, a
 * second email could get through. If you ever want a hard cross-instance guarantee,
 * swap these three fields for one Upstash/Vercel-KV key — the logic below doesn't change.
 *
 * lastSentAt is keyed by outcome. One shared timestamp would mean an early "Ignore"
 * silently swallowed the acceptance email that came after it.
 */
const state = {
  seenIds: new Map<string, number>(),
  sendTimestamps: [] as number[],
  lastSentAt: new Map<AskOutOutcome, number>(),
};

function dedupeWindowMs() {
  const raw = Number(process.env.ACCEPTANCE_DEDUPE_WINDOW_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DEDUPE_WINDOW_MS;
}

function rememberId(id: string, now: number) {
  state.seenIds.set(id, now);
  if (state.seenIds.size > ID_MEMORY_MAX) {
    for (const [key, seenAt] of state.seenIds) {
      if (now - seenAt > ID_MEMORY_MS) state.seenIds.delete(key);
      if (state.seenIds.size <= ID_MEMORY_MAX) break;
    }
  }
}

/** Everything that differs between the three emails, in one place. */
const COPY: Record<
  AskOutOutcome,
  { subject: string; heading: string; lead: string; action: string; note?: string }
> = {
  accepted: {
    subject: "❤️ She said YES — Ask Out Orig",
    heading: "She said yes ❤️",
    lead: "She likes you back. It&rsquo;s a date!",
    action: "Pressed &ldquo;For sure ❤️&rdquo;",
  },
  declined: {
    subject: "💔 She said no — Ask Out Orig",
    heading: "She said no 💔",
    lead: "She turned it down.",
    action: "Pressed &ldquo;Maybe another time ❤️&rdquo;",
  },
  ignored: {
    subject: "👀 She pressed Ignore — Ask Out Orig",
    heading: "She pressed Ignore 👀",
    lead: "She dodged the letter instead of opening it.",
    action: "Pressed &ldquo;Ignore&rdquo; on the envelope",
    note: "Not a final answer — the letter is still there, and she can still open it.",
  },
};

/** Turns the HTML entities in COPY back into characters for the plain-text part. */
function plain(value: string) {
  return value
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, "&");
}

function buildMessage(outcome: AskOutOutcome) {
  const copy = COPY[outcome];
  const happenedAt = new Date().toISOString();

  const rows: [string, string][] = [["What she did", copy.action]];
  // The date is only worth printing when it is actually going to happen.
  if (outcome === "accepted") rows.push(["Date", DATE_DETAILS.displayDate]);
  rows.push(["Time", happenedAt]);

  const text = [
    copy.heading,
    "",
    plain(copy.lead),
    ...(copy.note ? ["", copy.note] : []),
    "",
    ...rows.map(([label, value]) => `${label}: ${plain(value)}`),
    "",
    "Source:",
    "Ask Out Orig",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#faf4ec;font-family:Georgia,'Times New Roman',serif;color:#3a2e2c">
  <div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #ecd3ce;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#ab6d73">Ask Out Orig</p>
    <h1 style="margin:0 0 16px;font-size:28px;color:#6b2a3a">${copy.heading}</h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.5">${copy.lead}</p>
    ${
      copy.note
        ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#6b5a55">${copy.note}</p>`
        : ""
    }
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:8px 0;color:#6b5a55;width:9rem">${label}</td><td style="padding:8px 0">${value}</td></tr>`,
        )
        .join("\n      ")}
    </table>
  </div>
</body></html>`;

  return { subject: copy.subject, text, html, happenedAt };
}

/**
 * Transport: Gmail over SMTP, via nodemailer.
 *
 * Gmail only accepts mail as the account that authenticated, so the sender is GMAIL_USER.
 * EMAIL_FROM is honoured only when it wraps that same address in a display name
 * (`Ask Out Orig <you@gmail.com>`); anything else is ignored with a warning, because Gmail
 * would rewrite or reject it.
 *
 * SMTP_HOST / SMTP_PORT exist so the whole path can be exercised against a local server in
 * tests. They default to Gmail and should stay unset in production.
 *
 * This is the only function that knows how mail is delivered — changing providers means
 * rewriting this and nothing else.
 */
async function send(message: ReturnType<typeof buildMessage>): Promise<NotificationResult> {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows app passwords in groups of four; the spaces are presentation only.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const to = process.env.ACCEPTANCE_NOTIFICATION_TO?.trim() || DEFAULT_RECIPIENT;

  if (!user || !pass) {
    // Names only — never the values.
    const missing = [!user && "GMAIL_USER", !pass && "GMAIL_APP_PASSWORD"].filter(Boolean);
    console.warn(`[ask-out] email not configured, skipping send. Missing: ${missing.join(", ")}`);
    return "not-configured";
  }

  const configuredFrom = process.env.EMAIL_FROM?.trim();
  let from = user;
  if (configuredFrom) {
    const address = configuredFrom.match(/<([^>]+)>/)?.[1] ?? configuredFrom;
    if (address.toLowerCase() === user.toLowerCase()) {
      from = configuredFrom;
    } else {
      console.warn(
        "[ask-out] EMAIL_FROM does not match GMAIL_USER; Gmail only sends as the " +
          "authenticated account, so GMAIL_USER is being used as the sender.",
      );
    }
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; any other port negotiates STARTTLS when the server offers it.
    secure: port === 465,
    auth: { user, pass },
    // Never let a hung connection outlive the request.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    // Message id only — no address, no credential.
    console.info(`[ask-out] notification sent (${info.messageId})`);
    return "sent";
  } catch (error) {
    /*
     * Nodemailer puts the SMTP reply in `response` and a short code in `code`. Both are safe
     * to log: a server never echoes the password back. Truncated so a chatty server cannot
     * flood the log either.
     */
    const smtp = error as {
      code?: string;
      responseCode?: number;
      response?: string;
      message?: string;
    };
    console.error(
      `[ask-out] SMTP send failed: ${smtp.code ?? "unknown"} ${smtp.responseCode ?? ""} ` +
        `${(smtp.response ?? smtp.message ?? "").slice(0, 300)}`,
    );
    return "provider-error";
  } finally {
    transporter.close();
  }
}

/**
 * Records what she did and sends at most one email for it.
 *
 * Never throws: every failure path returns a result, because the caller must always be
 * able to answer the browser successfully. A broken mail provider must not become a
 * broken celebration.
 */
export async function notifyOutcome(
  outcome: AskOutOutcome,
  eventId: string,
): Promise<NotificationResult> {
  const now = Date.now();

  // Keyed by outcome as well as id, so one id cannot be replayed, but two different
  // answers from the same visit still count as two separate events.
  const key = `${outcome}:${eventId}`;
  if (state.seenIds.has(key)) return "duplicate";
  rememberId(key, now);

  const lastSentAt = state.lastSentAt.get(outcome) ?? 0;
  if (lastSentAt > 0 && now - lastSentAt < dedupeWindowMs()) {
    return "already-notified";
  }

  state.sendTimestamps = state.sendTimestamps.filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (state.sendTimestamps.length >= RATE_LIMIT_MAX_SENDS) {
    console.warn(`[ask-out] rate limit reached, dropping ${outcome} send`);
    return "rate-limited";
  }

  // Claimed before awaiting the provider: two near-simultaneous requests must not both
  // get past this point.
  state.lastSentAt.set(outcome, now);
  state.sendTimestamps.push(now);

  const result = await send(buildMessage(outcome));

  // A send that never happened shouldn't burn the window — let a genuine retry through.
  if (result === "not-configured" || result === "provider-error") {
    state.lastSentAt.set(outcome, 0);
    state.sendTimestamps = state.sendTimestamps.filter((at) => at !== now);
  }

  return result;
}

/** Test-only reset, used by the local verification script. */
export function __resetAskOutStateForTests() {
  state.seenIds.clear();
  state.sendTimestamps = [];
  state.lastSentAt.clear();
}
