import { zeroHash, type Address } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { CONTRACT_MARKET_STATES, proofOf, type PickDomain } from "@proof-league/shared";
import { logger } from "./logger.js";
import type { Cc3Clients } from "./cc3.js";
import { loadPickSet } from "./pickset/load.js";

// The scoring duty (Story 2.9 closing Story 2.5's loop): scoreBatch is permissionless
// and exactly-once, but SOMEBODY has to feed it — for every Resolved market not yet
// fully scored, load the published pick-set the chain pinned, open the commitment, and
// walk the contract-held cursor in contiguous batches until MarketFullyScored. The
// pick-set loader refuses bytes that don't hash to the on-chain sha or re-derive the
// committed root, so this duty can only ever submit the committed truth.

// Each leaf costs a merkle verification plus the settle/skip lane; a modest batch keeps
// every tx far from gas ceilings while a 100-pick market still scores in three rounds.
const SCORE_BATCH_SIZE = 40;

export type ScoringRoundReport = {
  readonly scanned: bigint;
  readonly completed: readonly bigint[];
  readonly failed: readonly { readonly marketId: bigint; readonly why: string }[];
};

export const runScoringRound = async (
  core: Address,
  clients: Cc3Clients,
  mirrorDir: string,
): Promise<ScoringRoundReport> => {
  const { publicClient, walletClient } = clients;
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const domain: PickDomain = { chainId: publicClient.chain.id, verifyingContract: core };
  const scanned = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  const completed: bigint[] = [];
  const failed: { marketId: bigint; why: string }[] = [];

  for (let marketId = 1n; marketId <= scanned; marketId++) {
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state !== "Resolved") continue;
    const [, fullyScored] = await publicClient.readContract({
      ...contract,
      functionName: "scoringProgressOf",
      args: [marketId],
    });
    if (fullyScored) continue;

    try {
      const commitment = await publicClient.readContract({
        ...contract,
        functionName: "getPickCommitment",
        args: [marketId],
      });
      const set = await loadPickSet(domain, marketId, commitment, mirrorDir);

      for (;;) {
        const [cursor, done] = await publicClient.readContract({
          ...contract,
          functionName: "scoringProgressOf",
          args: [marketId],
        });
        if (done) {
          completed.push(marketId);
          logger.info(`[worker] market ${marketId}: fully scored (${set.picks.length} leaves)`);
          break;
        }
        const start = Number(cursor);
        const batch = set.picks.slice(start, start + SCORE_BATCH_SIZE);
        // The canonical empty set scores as one empty-opening call (leafCount 0 against
        // the zero root) that flips MarketFullyScored — zero-pick markets never rot.
        const proofs = set.tree === undefined ? [] : batch.map((_, i) => proofOf(set.tree!, start + i));
        const { request } = await publicClient.simulateContract({
          ...contract,
          functionName: "scoreBatch",
          args: [
            marketId,
            cursor,
            batch.map((p) => ({
              player: p.player,
              marketId: p.marketId,
              optionIndex: p.optionIndex,
              stake: p.stake,
              nonce: p.nonce,
              utcDay: p.utcDay,
              stakedSoFarInDay: p.stakedSoFarInDay,
            })),
            proofs,
            BigInt(set.tree?.leafCount ?? 0),
            set.tree?.treeRoot ?? zeroHash,
          ],
          account: walletClient.account,
        });
        const hash = await walletClient.writeContract(request);
        // A reverted batch RESOLVES rather than throwing; without this the loop would
        // re-read the same cursor and report progress that never happened.
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error(`scoreBatch tx ${hash} reverted (status=${receipt.status})`);
        }
        const span = batch.length === 0 ? "the empty-set opening" : `leaves ${start}..${start + batch.length - 1}`;
        logger.info(`[worker] market ${marketId}: scored ${span} tx=${hash}`);
      }
    } catch (error) {
      // One market's stuck scoring never blocks the sweep; scoring is permissionless and
      // idempotent, so the next round simply resumes at the same contract-held cursor.
      failed.push({ marketId, why: String(error) });
      logger.error({ err: error }, `[worker] market ${marketId}: scoring did not land`);
    }
  }
  return { scanned, completed, failed };
};
