import { formatEther, parseEther } from "viem";
import type { Address } from "viem";
import { utcDayOf } from "@proof-league/shared";
import { sendAlert } from "../alerts.js";
import type { StateStore } from "../state.js";
import type { Cc3Clients } from "../cc3.js";

// The AD-7 ledger: proof units and CTC gas metered across the funded worker accounts.
// The prize escrow is the fourth account this module NEVER touches — its key is never
// loaded by any service (CONVENTIONS §9), so segregation is structural, not policed here.

// Pre-measurement daily-spend floor for the low-water line. The 10 CTC/day estimate is
// deliberately generous headroom (day-1 spike: accounts hold 10,000 CTC; a settlement
// fan-out is single-digit millions of gas); observed gasWeiByDay supersedes it as real
// traffic accrues, and the history-window drill forces a balance below the line to prove
// the alert fires.
const FLOOR_DAILY_SPEND_WEI = parseEther("10");
const THREE_DAYS = 3n;

// Below this the submission gate refuses to broadcast (exhaustion is an alert + honest
// `stuck` reason, never a tx that dies of insufficient funds mid-pipeline).
export const MIN_SUBMIT_BALANCE_WEI = parseEther("1");

export const noteGas = (store: StateStore, gasUsed: bigint, gasPriceWei: bigint, chainNowSec: number): void => {
  const day = String(utcDayOf(chainNowSec));
  const ledger = store.state.ledger;
  const prior = BigInt(ledger.gasWeiByDay[day] ?? "0");
  ledger.gasWeiByDay[day] = (prior + gasUsed * gasPriceWei).toString();
};

/// The three-day-traffic threshold (AD-7): 3 x the worst observed daily spend, floored at
/// the pre-measurement estimate so a quiet first day cannot lower the line to nothing.
export const lowWaterWei = (store: StateStore): bigint => {
  const spends = Object.values(store.state.ledger.gasWeiByDay).map(BigInt);
  const worstDay = spends.reduce((max, v) => (v > max ? v : max), 0n);
  const daily = worstDay > FLOOR_DAILY_SPEND_WEI ? worstDay : FLOOR_DAILY_SPEND_WEI;
  return daily * THREE_DAYS;
};

export type LedgerReport = {
  readonly balances: readonly { account: Address; wei: bigint }[];
  readonly signerBalanceWei: bigint;
};

/// Reads every configured worker account balance and alerts the operator webhook on any
/// low-water crossing. Runs each round: three getBalance calls are cheap, and the alert
/// dedupe keeps a persisting condition to one webhook per repeat window.
export const checkLedger = async (
  store: StateStore,
  clients: Cc3Clients,
  accounts: readonly Address[],
  webhookUrl: string | undefined,
): Promise<LedgerReport> => {
  const threshold = lowWaterWei(store);
  const balances: { account: Address; wei: bigint }[] = [];
  for (const account of accounts) {
    const wei = await clients.publicClient.getBalance({ address: account });
    balances.push({ account, wei });
    if (wei < threshold) {
      await sendAlert(
        store,
        webhookUrl,
        `ledger-low:${account}`,
        "ledger-low-water",
        `worker account ${account} holds ${formatEther(wei)} CTC, under the three-day line ` +
          `${formatEther(threshold)} CTC — fund via the daily Discord faucet duty`,
      );
    }
  }
  const signer = clients.walletClient.account.address;
  const signerBalanceWei = balances.find((b) => b.account === signer)?.wei ?? 0n;
  return { balances, signerBalanceWei };
};
