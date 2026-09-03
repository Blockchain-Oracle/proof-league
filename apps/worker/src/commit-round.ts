import type { Address } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import {
  buildPickSetDocument,
  buildPickSetTree,
  CONTRACT_MARKET_STATES,
  EMPTY_PICKSET_ROOT,
  pickSetLeavesOf,
  pickSetSha256,
  serializePickSetDocument,
  signedPickOf,
  verifySignedPick,
  type PickDomain,
  type SignedPick,
} from "@proof-league/shared";
import { listPendingPicks, type Db } from "@proof-league/shared/db";
import { logger } from "./logger.js";
import type { Cc3Clients } from "./cc3.js";
import type { TransparencyProjection } from "./pipeline/project.js";
import type { PickSetPublisher } from "./pickset/publish.js";

// Story 2.2's worker duty (AD-5/AD-14): for every Created market inside its commit window
// [lockTime, sourceWindowOpen), canonicalize the intake, publish the signed set to both
// homes, prove it readable, and only then commitPicks. Zero-pick markets commit the
// canonical empty root the same way (a published empty document, real uri, real sha) so
// they proceed to scoring's no-op instead of rotting uncommitted (AD-14). The chain's
// Created-state check is the resume cursor: a restart re-reads truth and never re-commits.

export type CommitContext = {
  readonly core: Address;
  readonly clients: Cc3Clients;
  // Absent db = the honest degraded mode (no intake exists, empty sets are the truth).
  // A CONFIGURED db that ERRORS is the opposite: the market is failed and retried —
  // committing an empty root over unread picks would erase them permanently.
  readonly db?: Db | undefined;
  readonly publisher: PickSetPublisher;
  readonly projection: TransparencyProjection;
};

export type CommitRoundReport = {
  readonly scanned: bigint;
  readonly committed: readonly bigint[];
  readonly failed: readonly { readonly marketId: bigint; readonly why: string }[];
};

/// The intake gate (AD-5): the chain never checks signatures, so exclusion here is what
/// keeps invented picks out of the commitment. Invalid rows are dropped and counted,
/// never thrown over — one forged row must not strand a market's honest picks.
export const verifiedPicksOf = async (
  domain: PickDomain,
  intake: readonly SignedPick[],
): Promise<{ valid: SignedPick[]; excluded: number }> => {
  const valid: SignedPick[] = [];
  let excluded = 0;
  for (const pick of intake) {
    if (await verifySignedPick(domain, pick)) valid.push(pick);
    else excluded += 1;
  }
  return { valid, excluded };
};

export const runCommitRound = async (ctx: CommitContext): Promise<CommitRoundReport> => {
  const { publicClient, walletClient } = ctx.clients;
  const contract = { address: ctx.core, abi: leagueCoreAbi } as const;
  const domain: PickDomain = { chainId: publicClient.chain.id, verifyingContract: ctx.core };
  // AD-10: chain-head time decides the window, never the worker's wall clock.
  const chainNowSec = (await publicClient.getBlock()).timestamp;
  const scanned = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  const committed: bigint[] = [];
  const failed: { marketId: bigint; why: string }[] = [];

  for (let marketId = 1n; marketId <= scanned; marketId++) {
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state !== "Created") continue;
    const config = await publicClient.readContract({ ...contract, functionName: "getMarketConfig", args: [marketId] });
    if (chainNowSec < config.lockTime) continue; // pre-lock: intake is still open
    if (chainNowSec >= config.sourceWindowOpen) continue; // window missed: void's jurisdiction (2.6)

    try {
      const intake = ctx.db === undefined ? [] : await listPendingPicks(ctx.db, ctx.core, marketId);
      const { valid, excluded } = await verifiedPicksOf(domain, intake);
      if (excluded > 0) {
        logger.warn(`[worker] market ${marketId}: excluded ${excluded} invalid-signature pick(s) from the set`);
      }
      const doc = buildPickSetDocument(domain, marketId, valid);
      const serialized = serializePickSetDocument(doc);
      const sha = pickSetSha256(serialized);
      const root =
        valid.length === 0
          ? EMPTY_PICKSET_ROOT
          : buildPickSetTree(pickSetLeavesOf(domain, doc.picks.map(signedPickOf))).commitmentRoot;

      // The ordering law (2.2 AC [review 2026-08-31]): both homes hold the bytes and the
      // public uri served them back BEFORE the chain learns the sha — never commit-first.
      const published = await ctx.publisher.publish(marketId, serialized, sha);

      const { request } = await publicClient.simulateContract({
        ...contract,
        functionName: "commitPicks",
        args: [marketId, root, published.uri, sha],
        account: walletClient.account,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      committed.push(marketId);
      logger.info(
        `[worker] market ${marketId}: committed ${valid.length} pick(s) root=${root} uri=${published.uri} tx=${hash}`,
      );
      const sourceKey = await publicClient.readContract({ ...contract, functionName: "sourceKeyOf", args: [config] });
      await ctx.projection.record({
        atSec: Math.floor(Date.now() / 1000),
        sourceKey,
        marketIds: [marketId.toString()],
        phase: "note",
        class: "proven", // the commit IS a Creditcoin transaction; the row carries it
        txHash: hash,
        note: `picks committed: count=${valid.length} excludedInvalidSignatures=${excluded} sha=${sha}`,
      });
    } catch (error) {
      // One market's failure never blocks the sweep; the window is MIN_COMMIT_MARGIN wide
      // (300s+) precisely so the next loop round can retry inside it.
      failed.push({ marketId, why: String(error) });
      logger.error({ err: error }, `[worker] market ${marketId}: commit did not land`);
    }
  }
  return { scanned, committed, failed };
};
