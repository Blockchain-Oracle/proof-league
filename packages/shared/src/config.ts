import { z } from "zod";
import { MIN_COMMIT_MARGIN_SEC } from "./time.js";

// Market config mirror (AD-3): the on-chain config in contracts/src/LeagueCore.sol is the
// authority; this zod mirror must reject everything the chain rejects (except clock-dependent
// admission — born-locked — which only chain time can judge). Outcome Options are encoded as
// N-1 ordered internal thresholds with open-ended outer buckets, so the value->option mapping
// is total and FR-6 rule 4 (absence shapes) stays unrepresentable.
const hex32 = /^0x[0-9a-fA-F]{64}$/;
const hex20 = /^0x[0-9a-fA-F]{40}$/;
const ZERO_HASH = `0x${"00".repeat(32)}`;
const ZERO_ADDRESS = `0x${"00".repeat(20)}`;
// int256 decimal string: JS numbers cannot carry 1e18 fixed-point yields safely.
const int256String = /^-?\d+$/;
const INT256_MAX = 2n ** 255n - 1n;
const INT256_MIN = -(2n ** 255n);
const UINT32_MAX = 4294967295;

export const marketConfigSchema = z
  .object({
    // uint64 on-chain; zod's .int() caps at Number.MAX_SAFE_INTEGER (2^53-1), which is
    // inside uint64 — same for the *Sec fields below (AD-6).
    sourceChainKey: z.number().int().positive(),
    emitter: z
      .templateLiteral(["0x", z.string()])
      .refine((a) => hex20.test(a) && a.toLowerCase() !== ZERO_ADDRESS, {
        message: "the emitter is a source field: a real 20-byte address, never zero (AD-3)",
      }),
    eventSignature: z.string().regex(hex32),
    // Zero hash = no subject narrowing; any other value filters the indexed topic.
    subjectFilter: z.string().regex(hex32),
    // Registry ids start at 1 (0 is the unset sentinel, mirroring ZeroDecoderId); uint32 on-chain.
    decoderId: z.number().int().positive().max(UINT32_MAX),
    // 2-6 Outcome Options (PRD Glossary) = 1-5 thresholds, strictly ascending.
    boundaries: z.array(z.string().regex(int256String)).min(1).max(5),
    payoutN: z.number().int().min(2).max(6),
    leagueDay: z.number().int().positive().max(UINT32_MAX),
    lockTimeSec: z.number().int().positive(),
    sourceWindowOpenSec: z.number().int().positive(),
    voidDeadlineSec: z.number().int().positive(),
    determinismHorizonSec: z.number().int().positive(),
  })
  .refine((c) => c.eventSignature !== ZERO_HASH, {
    message: "the event signature is a source field and cannot be zero (AD-3)",
  })
  .refine((c) => c.boundaries.every((b) => BigInt(b) >= INT256_MIN && BigInt(b) <= INT256_MAX), {
    message: "thresholds are int256 on-chain; a wider value could not even ABI-encode",
  })
  .refine((c) => c.boundaries.every((b, i) => i === 0 || BigInt(b) > BigInt(c.boundaries[i - 1] as string)), {
    message: "thresholds must strictly ascend; an equal or inverted pair carves an empty bucket",
  })
  .refine((c) => c.payoutN === c.boundaries.length + 1, {
    message: "Payout law: N equals the option count, which is thresholds + 1 (PRD Glossary)",
  })
  .refine((c) => c.lockTimeSec < c.determinismHorizonSec, {
    message: "lockTime must precede the determinism horizon (FR-6 rule 3)",
  })
  .refine((c) => c.sourceWindowOpenSec >= c.lockTimeSec + MIN_COMMIT_MARGIN_SEC, {
    message: "the commit window must be at least MIN_COMMIT_MARGIN wide (AD-14)",
  })
  .refine((c) => c.voidDeadlineSec > c.sourceWindowOpenSec, {
    message: "the void clock is never the shorter one (AD-19)",
  });

export type MarketConfig = z.infer<typeof marketConfigSchema>;
