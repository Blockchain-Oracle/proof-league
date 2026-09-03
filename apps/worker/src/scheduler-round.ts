import type { Address } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { logger } from "./logger.js";
import type { Cc3Clients } from "./cc3.js";
import type { StateStore } from "./state.js";
import { noteGas } from "./ledger/ledger.js";

// Story 2.11's scheduler duty (AD-21): the worker keeps the market buffer full by
// calling the permissionless engine — instantiateNext until the contract says the next
// slot is not due. The 48-72h rolling buffer IS the template's preCreateLeadSec (and the
// judging-window pre-extension is a large lead on boundary-static Series), so the policy
// lives on-chain and an outage delays nothing already minted: any caller, including the
// external liveness scheduler, can make the identical call and mint identical params.

// Safety bound per series per round; a fuller backlog simply drains over a few rounds.
const MAX_MINTS_PER_ROUND = 8;

export type SchedulerRoundReport = {
  readonly series: bigint;
  readonly minted: readonly { readonly seriesId: bigint; readonly marketId: bigint }[];
  readonly hostedDue: readonly bigint[];
};

export const runSchedulerRound = async (
  core: Address,
  clients: Cc3Clients,
  store: StateStore,
): Promise<SchedulerRoundReport> => {
  const { publicClient, walletClient } = clients;
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const series = await publicClient.readContract({ ...contract, functionName: "seriesCount" });
  const minted: { seriesId: bigint; marketId: bigint }[] = [];
  const hostedDue: bigint[] = [];
  const chainNowSec = Number((await publicClient.getBlock()).timestamp);

  for (let seriesId = 1n; seriesId <= series; seriesId++) {
    const template = await publicClient.readContract({ ...contract, functionName: "seriesTemplateOf", args: [seriesId] });
    if (template.externalSubject) {
      // Hosted Rounds need their ContestSource round minted on the source chain FIRST
      // (the roundId is the subject) — that driver ships with the 5.2 lineup. Surface
      // the due slot honestly instead of guessing a subject.
      const nextSlot = await publicClient.readContract({ ...contract, functionName: "seriesNextSlot", args: [seriesId] });
      const slotTime = Number(template.firstSlotTime) + Number(nextSlot) * Number(template.slotPeriodSec);
      if (chainNowSec + Number(template.preCreateLeadSec) >= slotTime) {
        hostedDue.push(seriesId);
        logger.info(`[worker] series ${seriesId}: hosted slot ${nextSlot} due — awaiting the 5.2 lineup driver`);
      }
      continue;
    }
    for (let i = 0; i < MAX_MINTS_PER_ROUND; i++) {
      try {
        const { request } = await publicClient.simulateContract({
          ...contract,
          functionName: "instantiateNext",
          args: [seriesId],
          account: walletClient.account,
        });
        const hash = await walletClient.writeContract(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        noteGas(store, receipt.gasUsed, receipt.effectiveGasPrice, chainNowSec);
        const marketId = await publicClient.readContract({ ...contract, functionName: "marketCount" });
        minted.push({ seriesId, marketId });
        logger.info(`[worker] series ${seriesId}: minted market ${marketId} tx=${hash}`);
      } catch (error) {
        const why = String(error);
        // The two honest "nothing to do (yet)" answers; anything else is a real failure
        // worth a log, and the next round retries either way.
        if (!/SeriesSlotNotDue|SeriesObservationsNotFinal/.test(why)) {
          logger.error({ err: error }, `[worker] series ${seriesId}: instantiateNext did not land`);
        }
        break;
      }
    }
  }
  return { series, minted, hostedDue };
};
