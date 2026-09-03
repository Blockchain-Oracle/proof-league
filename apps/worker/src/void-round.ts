import type { Address } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { CONTRACT_MARKET_STATES, type ContractMarketState } from "@proof-league/shared";
import type { Cc3Clients } from "./cc3.js";

// Story 2.6's worker duty (AD-19): for every market past its voidDeadline and still
// non-terminal, the loop submits the permissionless void() itself — void is never waiting
// on a human during the unattended window. A full rescan every round is O(marketCount)
// reads, honest at season scale; per-market cursors are Story 2.8's ledger work.

export type VoidRoundReport = {
  readonly scanned: bigint;
  readonly voided: readonly bigint[];
  // Submissions that did not land — usually the honest AD-19 race: a proof (or a rival
  // void caller) reached the market first. Next round re-reads the truth.
  readonly raced: readonly bigint[];
};

/// AD-19 as a pure function of (state, chain clock), unit-checkable without mocks:
/// strictly past the deadline (at the second itself the proof still owns the moment),
/// non-terminal only.
export const isVoidEligible = (
  state: ContractMarketState,
  voidDeadlineSec: bigint,
  chainNowSec: bigint,
): boolean => (state === "Created" || state === "Committed") && chainNowSec > voidDeadlineSec;

export const runVoidRound = async (leagueCore: Address, clients: Cc3Clients): Promise<VoidRoundReport> => {
  const { publicClient, walletClient } = clients;
  const contract = { address: leagueCore, abi: leagueCoreAbi } as const;
  // AD-10: chain-head time is the one deciding clock — never the worker's wall clock.
  const chainNowSec = (await publicClient.getBlock()).timestamp;
  const scanned = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  const voided: bigint[] = [];
  const raced: bigint[] = [];
  for (let marketId = 1n; marketId <= scanned; marketId++) {
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state !== "Created" && state !== "Committed") continue;
    const config = await publicClient.readContract({
      ...contract,
      functionName: "getMarketConfig",
      args: [marketId],
    });
    if (!isVoidEligible(state, config.voidDeadline, chainNowSec)) continue;
    try {
      const hash = await walletClient.writeContract({ ...contract, functionName: "void", args: [marketId] });
      await publicClient.waitForTransactionReceipt({ hash });
      voided.push(marketId);
    } catch (error) {
      // One raced market never blocks the rest of the sweep (the fan-out's isolation
      // ethos); the loop's own guard already keeps a thrown round from killing the timer.
      raced.push(marketId);
      console.error(`[worker] void(${marketId}) did not land`, error);
    }
  }
  return { scanned, voided, raced };
};
