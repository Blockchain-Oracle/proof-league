import { logger } from "./logger.js";
import type { StateStore } from "./state.js";

// Operator alerts (AD-7): every failure alerts instead of pretending. The webhook is the
// channel; when it is unset or the POST itself fails, the alert still lands on stderr —
// a failed alert path must never become the silent skip it exists to prevent.

// Re-alert cadence for a persisting condition: long enough not to flood a phone, short
// enough that a wedged pipeline cannot go quiet for a judging day.
const ALERT_REPEAT_MS = 6 * 60 * 60 * 1000;

export type AlertKind =
  | "settlement-late"
  | "settlement-unattested"
  | "ledger-low-water"
  | "ledger-exhausted"
  | "pipeline-stuck"
  | "season-revert";

export const sendAlert = async (
  store: StateStore,
  webhookUrl: string | undefined,
  dedupeKey: string,
  kind: AlertKind,
  message: string,
): Promise<void> => {
  const now = Date.now();
  const last = store.state.alertsSentAtMs[dedupeKey];
  if (last !== undefined && now - last < ALERT_REPEAT_MS) return;
  store.state.alertsSentAtMs[dedupeKey] = now;
  const line = `[proof-league worker] ${kind}: ${message}`;
  logger.error(line);
  if (webhookUrl === undefined) return;
  try {
    // `content` is the Discord webhook body shape and reads fine on any generic receiver.
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: line }),
    });
  } catch (error) {
    logger.error({ err: error }, `[proof-league worker] webhook delivery failed for ${kind}`);
  }
};
