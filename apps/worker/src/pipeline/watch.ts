import { numberToHex, zeroHash } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { CONTRACT_MARKET_STATES } from "@proof-league/shared";
import type { SourceChain } from "../sources.js";
import { findBlockAtOrAfter } from "../sources.js";
import type { SourceKeyCursor } from "../state.js";
import type { PhaseReport, SettlementContext } from "./types.js";

// The watch phase (AD-7): committed markets become per-sourceKey cursors, and each cursor
// scans its source chain for the one event that settles every market on the key. The scan
// cursor persists (AD-13): a restart resumes from the last scanned block, never re-detects.

// A mainnet day is ~7,200 blocks and public RPCs commonly cap ranges near 10k; 5k chunks
// stay under every cap we use while covering a source window in a couple of calls.
const SCAN_CHUNK_BLOCKS = 5_000;

/// Market discovery: walks the registry once per round (O(marketCount) view reads, honest
/// at season scale — the void round set the precedent), skipping ids the monotone state
/// machine has already made terminal. Committed markets join (or create) their key's cursor.
export const syncCursors = async (ctx: SettlementContext): Promise<void> => {
  const { publicClient } = ctx.clients;
  const contract = { address: ctx.core, abi: leagueCoreAbi } as const;
  const { cursors, marketIndex } = ctx.store.state;
  const count = await publicClient.readContract({ ...contract, functionName: "marketCount" });
  for (let marketId = 1n; marketId <= count; marketId++) {
    const id = marketId.toString();
    const indexed = marketIndex[id];
    if (indexed === "terminal") continue;
    const state = CONTRACT_MARKET_STATES[
      await publicClient.readContract({ ...contract, functionName: "stateOf", args: [marketId] })
    ];
    if (state === undefined) continue;
    if (indexed === undefined) {
      if (state === "Resolved" || state === "Voided") {
        marketIndex[id] = "terminal";
        continue;
      }
      if (state !== "Committed") continue; // Created: not pipeline business until it commits
      const config = await publicClient.readContract({
        ...contract,
        functionName: "getMarketConfig",
        args: [marketId],
      });
      const sourceKey = await publicClient.readContract({
        ...contract,
        functionName: "sourceKeyOf",
        args: [config],
      });
      const cursor: SourceKeyCursor = cursors[sourceKey] ?? {
        sourceKey,
        chainKey: Number(config.sourceChainKey),
        emitter: config.emitter,
        eventSignature: config.eventSignature,
        subjectFilter: config.subjectFilter,
        markets: {},
        phase: "watching",
        timestamps: {},
      };
      cursor.markets[id] = {
        openSec: Number(config.sourceWindowOpen),
        voidDeadlineSec: Number(config.voidDeadline),
        state: "Committed",
      };
      cursors[sourceKey] = cursor;
      marketIndex[id] = sourceKey;
    } else {
      const market = cursors[indexed]?.markets[id];
      if (market && (state === "Resolved" || state === "Voided")) market.state = state;
    }
  }
  // Terminal sweep for cursors settled or voided from outside this pipeline (a rival
  // caller's proof, the void round): any resolution consumed the key — first accepted
  // proof wins — so one Resolved market ends the key's pipeline work.
  for (const cursor of Object.values(cursors)) {
    if (cursor.phase === "settled" || cursor.phase === "voided") continue;
    const states = Object.values(cursor.markets).map((m) => m.state);
    if (states.includes("Resolved")) cursor.phase = "settled";
    else if (states.length > 0 && states.every((s) => s === "Voided")) cursor.phase = "voided";
  }
};

/// The earliest source-window open among the cursor's still-committed markets: scanning
/// starts there, and a log before it is pre-open (the gateway would refuse it — check 6).
export const minOpenSecOf = (cursor: SourceKeyCursor): number =>
  Math.min(
    ...Object.values(cursor.markets)
      .filter((m) => m.state === "Committed")
      .map((m) => m.openSec),
  );

export const runWatch = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  source: SourceChain,
  chainNowSec: number,
): Promise<PhaseReport> => {
  if (cursor.detected) return { outcome: "advanced" };
  const minOpen = minOpenSecOf(cursor);
  if (chainNowSec < minOpen) return { outcome: "held", why: "source window not open yet" };
  if (cursor.scanFromBlock === undefined) {
    cursor.scanFromBlock = await findBlockAtOrAfter(source.viem, minOpen);
  }
  const head = Number(await source.viem.getBlockNumber());
  const topics: (`0x${string}` | null)[] = [cursor.eventSignature];
  // A zero subjectFilter means the family declared the event needs no narrowing (AD-3).
  if (cursor.subjectFilter !== zeroHash) topics.push(cursor.subjectFilter);
  let from = cursor.scanFromBlock;
  while (from <= head) {
    const to = Math.min(from + SCAN_CHUNK_BLOCKS - 1, head);
    const logs = await source.viem.request({
      method: "eth_getLogs",
      params: [
        {
          address: cursor.emitter,
          fromBlock: numberToHex(from),
          toBlock: numberToHex(to),
          topics,
        },
      ],
    });
    for (const log of logs) {
      if (log.blockNumber === null || log.transactionHash === null) continue; // pending log: unmineable as evidence
      const blockNumber = Number(BigInt(log.blockNumber));
      const block = await source.viem.getBlock({ blockNumber: BigInt(blockNumber) });
      const blockTimestampSec = Number(block.timestamp);
      // Pre-open matches keep scanning: the real event is later by construction (the
      // one-matching-log-per-receipt admission property makes the first in-window match
      // THE event for this key).
      if (blockTimestampSec < minOpen) continue;
      cursor.detected = { txHash: log.transactionHash, blockNumber, blockTimestampSec };
      cursor.timestamps.eventSec = blockTimestampSec;
      cursor.phase = "awaiting-attestation";
      cursor.scanFromBlock = blockNumber;
      await ctx.projection.record({
        atSec: chainNowSec,
        sourceKey: cursor.sourceKey,
        marketIds: Object.keys(cursor.markets),
        phase: "event",
        class: "observed",
        txHash: log.transactionHash,
      });
      return { outcome: "advanced" };
    }
    from = to + 1;
    cursor.scanFromBlock = from;
  }
  return { outcome: "held", why: "no matching source event yet" };
};
