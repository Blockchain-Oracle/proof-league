import type { SourceKeyCursor } from "../state.js";
import type { PhaseReport, SettlementContext } from "./types.js";

// The attest-wait phase (AD-7): a detected event is provable only once CC3's attestation
// chain covers its block — the protocol's recency floor, honored live rather than assumed.
// The attested timestamp is a class-2 observation ("first observed coverage", stamped in
// chain time per AD-10), which is exactly what the transparency log labels it.

export const runAttest = async (
  ctx: SettlementContext,
  cursor: SourceKeyCursor,
  chainNowSec: number,
): Promise<PhaseReport> => {
  if (!cursor.detected) return { outcome: "held", why: "nothing detected to attest" };
  if (cursor.timestamps.attestedSec !== undefined) return { outcome: "advanced" };
  const attested = await ctx.sources.chainInfoProvider.getLatestAttestedHeightAndHash(cursor.chainKey);
  if (!attested.exists || Number(attested.height) < cursor.detected.blockNumber) {
    const at = attested.exists ? String(attested.height) : "none";
    return {
      outcome: "held",
      why: `attestation at ${at}, waiting to cover block ${cursor.detected.blockNumber}`,
    };
  }
  cursor.timestamps.attestedSec = chainNowSec;
  cursor.phase = "proving";
  await ctx.projection.record({
    atSec: chainNowSec,
    sourceKey: cursor.sourceKey,
    marketIds: Object.keys(cursor.markets),
    phase: "attested",
    class: "observed",
  });
  return { outcome: "advanced" };
};
