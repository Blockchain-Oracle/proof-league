import { parseEventLogs } from "viem";
import { leagueCoreAbi, proofGatewayAbi } from "@proof-league/chain";
import { SETTLEMENT_COST_CLIFF_SEC } from "@proof-league/shared";
import { noteGas } from "../ledger/ledger.js";
import type { SourceKeyCursor } from "../state.js";
import type { PhaseReport, SettlementContext } from "./types.js";

// The submit phase: one gateway.verify() settles every eligible market on the key (AD-4).
// Submission is a race everyone can see — a rival caller landing first is the honest
// ProofAlreadyAccepted outcome, recorded from chain truth (acceptedAt), never an error.

export const runSubmit = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  chainNowSec: number,
): Promise<PhaseReport> => {
  const proof = cursor.proof;
  if (!proof) return { outcome: "held", why: "no proof built yet" };
  if (cursor.phase === "settled") return { outcome: "advanced" };
  const { publicClient, walletClient } = ctx.clients;
  const contract = { address: ctx.gateway, abi: proofGatewayAbi } as const;
  const args = [
    cursor.sourceKey,
    BigInt(proof.height),
    proof.txBytes,
    { root: proof.merkleRoot, siblings: proof.merkleSiblings },
    { lowerEndpointDigest: proof.lowerEndpointDigest, roots: proof.continuityRoots },
  ] as const;
  try {
    // Simulate-first: a deterministic refusal (wrong proof, consumed key) costs no gas
    // and is diagnosed from the named error instead of a mined revert.
    await publicClient.simulateContract({
      ...contract,
      functionName: "verify",
      args,
      account: walletClient.account,
    });
  } catch (error) {
    return handleRefusal(ctx, cursor, chainNowSec, String(error));
  }
  const hash = await walletClient.writeContract({ ...contract, functionName: "verify", args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  noteGas(ctx.store, receipt.gasUsed, receipt.effectiveGasPrice, chainNowSec);
  const block = await publicClient.getBlock({ blockHash: receipt.blockHash });
  const provenSec = Number(block.timestamp);
  cursor.provenTxHash = hash;
  cursor.timestamps.provenSec = provenSec;
  cursor.phase = "settled";
  const eventSec = cursor.timestamps.eventSec;
  if (eventSec !== undefined && provenSec - eventSec > SETTLEMENT_COST_CLIFF_SEC) {
    cursor.overCliff = true; // proven anyway (NFR-1 > NFR-3), marked on the transparency log
  }
  // The fan-out's own receipt says which siblings resolved; the rest were skipped on a
  // now-consumed key and belong to the void round past their deadlines (AD-19).
  const resolved = parseEventLogs({ abi: leagueCoreAbi, eventName: "MarketResolved", logs: receipt.logs });
  for (const log of resolved) {
    const market = cursor.markets[log.args.marketId.toString()];
    if (market) market.state = "Resolved";
  }
  await ctx.projection.record({
    atSec: provenSec,
    sourceKey: cursor.sourceKey,
    marketIds: Object.keys(cursor.markets),
    phase: "proven",
    class: "proven",
    txHash: hash,
    ...(cursor.overCliff ? { overCliff: true } : {}),
  });
  return { outcome: "advanced" };
};

/// A refused simulation: the raced case closes the cursor from chain truth; anything else
/// is a genuine failure reported upward (the round alerts, the cursor stays and retries).
const handleRefusal = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  chainNowSec: number,
  why: string,
): Promise<PhaseReport> => {
  if (!why.includes("ProofAlreadyAccepted")) {
    return { outcome: "failed", why: `verify refused pre-broadcast: ${why}` };
  }
  const acceptedAt = await ctx.clients.publicClient.readContract({
    address: ctx.gateway,
    abi: proofGatewayAbi,
    functionName: "acceptedAt",
    args: [cursor.sourceKey],
  });
  cursor.timestamps.provenSec = Number(acceptedAt);
  cursor.phase = "settled";
  await ctx.projection.record({
    atSec: chainNowSec,
    sourceKey: cursor.sourceKey,
    marketIds: Object.keys(cursor.markets),
    phase: "note",
    class: "observed",
    note: `proof accepted by another caller at ${acceptedAt} (permissionless race, first accepted wins)`,
  });
  return { outcome: "advanced" };
};
