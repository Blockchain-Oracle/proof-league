import { proofProvider } from "@gluwa/usc-sdk";
import type { SourceChain } from "../sources.js";
import type { SourceKeyCursor, StoredProof } from "../state.js";
import type { PhaseReport, SettlementContext } from "./types.js";

// The prove phase (AD-7): proving is an interface — hosted Proof Builder primary,
// RawProofBuilder local fallback with the SAME ProofProvider interface — so a hosted
// outage degrades to slower local block-walking, never to a silent skip. Every prover
// query is metered as a budget unit before the result is known: attempts are what bill.

type SdkProofData = NonNullable<Awaited<ReturnType<proofProvider.service.ProofBuilder["getProof"]>>["data"]>;

const asHex = (value: string): `0x${string}` =>
  (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;

const toStoredProof = (data: SdkProofData, prover: StoredProof["prover"]): StoredProof => ({
  height: data.headerNumber,
  txBytes: asHex(data.txBytes),
  merkleRoot: asHex(data.merkleProof.root),
  merkleSiblings: data.merkleProof.siblings.map((s) => ({ hash: asHex(s.hash), isLeft: s.isLeft })),
  lowerEndpointDigest: asHex(data.continuityProof.lowerEndpointDigest),
  continuityRoots: data.continuityProof.roots.map(asHex),
  prover,
});

export const runProve = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  source: SourceChain,
): Promise<PhaseReport> => {
  if (!cursor.detected) return { outcome: "held", why: "nothing detected to prove" };
  if (cursor.timestamps.attestedSec === undefined) {
    return { outcome: "held", why: "attestation does not cover the event yet" };
  }
  if (cursor.proof) return { outcome: "advanced" };

  const failures: string[] = [];
  // Hosted primary. The builder's own timeout is left default; the phase-level watchdog
  // in the round composer is the one clock that can release the loop.
  try {
    ctx.store.state.ledger.proofUnits += 1;
    const hosted = new proofProvider.service.ProofBuilder(cursor.chainKey, ctx.proverUrl);
    const result = await hosted.getProof(cursor.detected.txHash);
    if (result.success && result.data) {
      cursor.proof = toStoredProof(result.data, "hosted");
      return { outcome: "advanced" };
    }
    failures.push(`hosted: ${result.error ?? "no proof data"}`);
  } catch (error) {
    failures.push(`hosted: ${String(error)}`);
  }

  // Same-interface local fallback (AD-7, rehearsed in the history-window drill): rebuilds
  // merkle + continuity from raw source blocks and the CC3 attestation chain.
  try {
    ctx.store.state.ledger.proofUnits += 1;
    const raw = new proofProvider.raw.RawProofBuilder(
      cursor.chainKey,
      new proofProvider.raw.blockProvider.SimpleBlockProvider(source.ethersRpc),
      ctx.sources.chainInfoProvider,
      source.encoding as proofProvider.raw.EncodingVersion,
    );
    const result = await raw.getProof(cursor.detected.txHash);
    if (result.success && result.data) {
      cursor.proof = toStoredProof(result.data, "raw");
      return { outcome: "advanced" };
    }
    failures.push(`raw: ${result.error ?? "no proof data"}`);
  } catch (error) {
    failures.push(`raw: ${String(error)}`);
  }

  return { outcome: "failed", why: `both provers failed — ${failures.join("; ")}` };
};
