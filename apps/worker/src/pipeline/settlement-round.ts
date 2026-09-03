import { formatEther } from "viem";
import {
  SETTLEMENT_ALERT_SEC,
  SETTLEMENT_TARGET_MARGIN_SEC,
  expectedSettlementSecOf,
} from "@proof-league/shared";
import { sendAlert } from "../alerts.js";
import { MIN_SUBMIT_BALANCE_WEI, checkLedger } from "../ledger/ledger.js";
import type { SourceKeyCursor } from "../state.js";
import { PHASE_TIMEOUT_MS, withPhaseTimeout } from "../watchdog.js";
import { runAttest } from "./attest.js";
import { runProve } from "./prove.js";
import { runSubmit } from "./submit.js";
import { runWatch, syncCursors } from "./watch.js";
import type { PhaseReport, SettlementContext, SettlementRoundReport } from "./types.js";

// The settlement round (FR-12, AD-7): watch -> attest-wait -> prove -> submit -> project,
// advanced as far as truth allows for every active sourceKey, every loop tick. Each phase
// runs under its own timeout so one hung RPC holds back one key for one round — never the
// loop. verify:settlement drives THIS function against the live deployment.

const ACTIVE_PHASES = ["watching", "awaiting-attestation", "proving"] as const;

export const runSettlementRound = async (ctx: SettlementContext): Promise<SettlementRoundReport> => {
  // AD-10: chain-head time is the one deciding clock for every window and alert line.
  const chainNowSec = Number((await ctx.clients.publicClient.getBlock()).timestamp);
  await syncCursors(ctx);
  const ledger = await checkLedger(
    ctx.store,
    ctx.clients,
    ctx.accounts ?? [ctx.clients.walletClient.account.address],
    ctx.webhookUrl,
  );
  const canSubmit = ledger.signerBalanceWei >= MIN_SUBMIT_BALANCE_WEI;
  const settledKeys: string[] = [];
  const stuckKeys: string[] = [];
  let active = 0;

  for (const cursor of Object.values(ctx.store.state.cursors)) {
    if (!(ACTIVE_PHASES as readonly string[]).includes(cursor.phase)) continue;
    active++;
    const report = await advanceCursor(ctx, cursor, chainNowSec, canSubmit);
    if (cursor.phase === "settled") settledKeys.push(cursor.sourceKey);
    if (report.outcome === "failed") {
      await markStuck(ctx, cursor, chainNowSec, report.why);
      stuckKeys.push(cursor.sourceKey);
    } else if (cursor.stuckReason !== undefined && report.outcome === "advanced") {
      delete cursor.stuckReason; // progress resumed: the honest reason is no longer true
    }
    await timingAlerts(ctx, cursor, chainNowSec);
  }
  ctx.store.save();
  return { chainNowSec, activeKeys: active, settledKeys, stuckKeys };
};

/// One cursor, advanced through as many phases as this round's truth allows. A held phase
/// ends the cursor's round honestly; only a failure propagates as stuck.
const advanceCursor = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  chainNowSec: number,
  canSubmit: boolean,
): Promise<PhaseReport> => {
  const source = ctx.sources.byChainKey.get(cursor.chainKey);
  if (source === undefined) {
    return { outcome: "failed", why: `source chainKey ${cursor.chainKey} has no configured RPC (AD-6 runtime map)` };
  }
  try {
    let report = await withPhaseTimeout("watch", PHASE_TIMEOUT_MS.watch, runWatch(ctx, cursor, source, chainNowSec));
    if (report.outcome !== "advanced") return report;
    report = await withPhaseTimeout("attest", PHASE_TIMEOUT_MS.attest, runAttest(ctx, cursor, chainNowSec));
    if (report.outcome !== "advanced") return report;
    report = await withPhaseTimeout("prove", PHASE_TIMEOUT_MS.prove, runProve(ctx, cursor, source));
    if (report.outcome !== "advanced") return report;
    if (!canSubmit) {
      // Exhaustion is a rendered, alerted state (AD-7) — never a broadcast that dies of
      // insufficient funds, never a silent skip.
      await sendAlert(
        ctx.store,
        ctx.webhookUrl,
        "ledger-exhausted",
        "ledger-exhausted",
        `signer below ${formatEther(MIN_SUBMIT_BALANCE_WEI)} CTC — settlement submissions withheld`,
      );
      return { outcome: "failed", why: "worker gas exhausted — submission withheld until funded" };
    }
    return await withPhaseTimeout("submit", PHASE_TIMEOUT_MS.submit, runSubmit(ctx, cursor, chainNowSec));
  } catch (error) {
    return { outcome: "failed", why: String(error) };
  }
};

const markStuck = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  chainNowSec: number,
  why: string,
): Promise<void> => {
  if (cursor.stuckReason !== why) {
    cursor.stuckReason = why;
    await ctx.projection.record({
      atSec: chainNowSec,
      sourceKey: cursor.sourceKey,
      marketIds: Object.keys(cursor.markets),
      phase: "note",
      class: "observed",
      note: `stuck: ${why}`,
    });
  }
  await sendAlert(ctx.store, ctx.webhookUrl, `stuck:${cursor.sourceKey}`, "pipeline-stuck", `${cursor.sourceKey}: ${why}`);
};

/// FR-12's clock policy: alert at expected-settlement + 5 min; at T+45 unattested, alert
/// and keep proving (NFR-1 > NFR-3). The cost cliff is stamped at submit time.
const timingAlerts = async (ctx: SettlementContext, cursor: SourceKeyCursor, chainNowSec: number): Promise<void> => {
  const eventSec = cursor.timestamps.eventSec;
  if (eventSec === undefined || cursor.phase === "settled" || cursor.phase === "voided") return;
  if (
    !cursor.alertedUnattested &&
    cursor.timestamps.attestedSec === undefined &&
    chainNowSec - eventSec > SETTLEMENT_ALERT_SEC
  ) {
    cursor.alertedUnattested = true;
    await sendAlert(
      ctx.store,
      ctx.webhookUrl,
      `unattested:${cursor.sourceKey}`,
      "settlement-unattested",
      `${cursor.sourceKey}: event unattested past T+45 min — proving anyway when coverage lands`,
    );
  }
  if (!cursor.alertedLate && chainNowSec > expectedSettlementSecOf(eventSec) + SETTLEMENT_TARGET_MARGIN_SEC) {
    cursor.alertedLate = true;
    await sendAlert(
      ctx.store,
      ctx.webhookUrl,
      `late:${cursor.sourceKey}`,
      "settlement-late",
      `${cursor.sourceKey}: past expected settlement + 5 min and not proven`,
    );
  }
};
