import type { Address, Chain, PublicClient, Transport } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";

// Story 2.11's rebuild half (AD-21/AD-8): "chosen by nobody" made machine-verifiable.
// An INDEPENDENT TypeScript recompute of every Series instance's derived params —
// timing from the template's cadence, boundaries from formula(chain-resident
// observations: prior in-window instances' Resolution values, newest resolved wins,
// voided skipped, base fallback) — diffed against the configs the chain actually
// stored. The Solidity view deriveSeriesBoundaries is deliberately NOT consulted:
// re-deriving through the same code that minted would prove nothing.

type StoredMarket = {
  readonly lockTime: number;
  readonly sourceWindowOpen: number;
  readonly voidDeadline: number;
  readonly determinismHorizon: number;
  readonly leagueDay: number;
  readonly boundaries: readonly string[];
};

export const verifySeriesConformance = async (
  publicClient: PublicClient<Transport, Chain>,
  core: Address,
  storedMarkets: Record<string, StoredMarket>,
  resolutionValues: Record<string, string>,
): Promise<string[]> => {
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const diffs: string[] = [];
  const seriesCount = await publicClient.readContract({ ...contract, functionName: "seriesCount" });

  for (let seriesId = 1n; seriesId <= seriesCount; seriesId++) {
    const template = await publicClient.readContract({ ...contract, functionName: "seriesTemplateOf", args: [seriesId] });
    const instances = await publicClient.readContract({ ...contract, functionName: "seriesInstancesOf", args: [seriesId] });
    const slotTimeOf = (slot: bigint): number => Number(template.firstSlotTime) + Number(slot) * Number(template.slotPeriodSec);

    for (const instance of instances) {
      const marketKey = instance.marketId.toString();
      const stored = storedMarkets[marketKey];
      if (stored === undefined) {
        diffs.push(`series ${seriesId} slot ${instance.slotIndex}: market ${marketKey} missing from the reconstruction`);
        continue;
      }
      const slotTime = slotTimeOf(instance.slotIndex);
      const expectTiming: Record<string, number> = {
        lockTime: slotTime - Number(template.lockLeadSec),
        sourceWindowOpen: slotTime,
        voidDeadline: slotTime + Number(template.voidTailSec),
        determinismHorizon: slotTime + Number(template.horizonTailSec),
        leagueDay: Math.floor(slotTime / 86400),
      };
      for (const [field, expected] of Object.entries(expectTiming)) {
        const actual = stored[field as keyof StoredMarket] as number;
        if (actual !== expected) {
          diffs.push(`series ${seriesId} slot ${instance.slotIndex}: ${field} stored ${actual} != derived ${expected}`);
        }
      }

      // The boundary formula, recomputed from observations alone.
      let expectedBoundaries = template.baseBoundaries.map((b) => b.toString());
      if (template.anchorOffsets.length > 0) {
        const cutoff = slotTime - Number(template.obsLagSec);
        // Newest-first over strictly-prior instances inside the observation window.
        const window = instances
          .filter((prior) => prior.slotIndex < instance.slotIndex && slotTimeOf(prior.slotIndex) <= cutoff)
          .sort((a, b) => Number(b.slotIndex - a.slotIndex));
        for (const prior of window) {
          const value = resolutionValues[prior.marketId.toString()];
          if (value === undefined) continue; // voided (or otherwise valueless): look further back
          expectedBoundaries = template.anchorOffsets.map((offset) => (BigInt(value) + offset).toString());
          break;
        }
      }
      if (JSON.stringify(stored.boundaries) !== JSON.stringify(expectedBoundaries)) {
        diffs.push(
          `series ${seriesId} slot ${instance.slotIndex}: boundaries stored ${JSON.stringify(stored.boundaries)} != formula(${JSON.stringify(expectedBoundaries)})`,
        );
      }
    }
  }
  return diffs;
};
