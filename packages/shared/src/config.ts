import { z } from "zod";

// Market config schema (AD-3): the on-chain config is the authority; this zod mirror keeps
// FR-6 rules 3-4 unrepresentable off-chain too (no absence predicates; lock precedes the
// determinism horizon; commit window has real width per AD-14).
export const marketConfigSchema = z
  .object({
    sourceChainKey: z.string().min(1),
    emitter: z.templateLiteral(["0x", z.string()]),
    eventSignature: z.string().min(1),
    subjectFilter: z.string(),
    decoderId: z.number().int().nonnegative(),
    // 2-6 ordered outcome boundaries (PRD Glossary: Outcome Option)
    boundaries: z.array(z.string()).min(2).max(6),
    payoutN: z.number().int().min(2).max(6),
    leagueDay: z.number().int().positive(),
    lockTimeSec: z.number().int().positive(),
    sourceWindowOpenSec: z.number().int().positive(),
    voidDeadlineSec: z.number().int().positive(),
    determinismHorizonSec: z.number().int().positive(),
  })
  .refine((c) => c.lockTimeSec < c.determinismHorizonSec, {
    message: "lockTime must precede the determinism horizon (FR-6 rule 3)",
  })
  .refine((c) => c.sourceWindowOpenSec >= c.lockTimeSec, {
    message: "the source window opens at or after lock (AD-14)",
  })
  .refine((c) => c.voidDeadlineSec > c.sourceWindowOpenSec, {
    message: "the void clock is never the shorter one (AD-19)",
  });

export type MarketConfig = z.infer<typeof marketConfigSchema>;
