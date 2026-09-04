import { z } from "zod";

// Everything intake says back, parsed before it is believed. The route is ours, but a
// response shape is still an interface across a network boundary, and a client that reads
// fields off an unvalidated object will happily render `undefined` as a number.

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/// What the composer needs before it can ask for a signature. `nextNonce` and
/// `stakedSoFarInDay` are computed by the same shared functions that will judge the Pick,
/// so a composer that signs what this says cannot be refused for contradicting it.
export const intakeStateSchema = z.object({
  utcDay: z.number().int().nonnegative(),
  nextNonce: z.number().int().nonnegative(),
  stakedSoFarInDay: z.number().int().nonnegative(),
  remaining: z.number().int(),
  /// The EIP-712 domain intake will verify against. Served rather than plumbed through
  /// every page so the composer is self-sufficient wherever it is opened, and so the
  /// client necessarily signs for the exact deployment the server is checking. A wrong
  /// domain here cannot forge anything: the server re-derives its own and refuses.
  domain: z.object({
    chainId: z.number().int().positive(),
    verifyingContract: z.string().regex(ADDRESS),
  }),
  onThisMarket: z.array(
    z.object({
      marketId: z.string(),
      nonce: z.number().int().nonnegative(),
      stake: z.number().int().nonnegative(),
      utcDay: z.number().int().nonnegative(),
    }),
  ),
});

export type IntakeState = z.infer<typeof intakeStateSchema>;

export const acceptedSchema = z.object({
  status: z.enum(["stored", "duplicate"]),
  marketId: z.string(),
  nonce: z.number().int().nonnegative(),
  /// Chain time at the moment the Pick entered the set. The Card is stamped with this
  /// rather than the browser's clock, so its time agrees with everything downstream.
  receivedAtSec: z.number().int().nonnegative(),
  next: z.object({
    nextNonce: z.number().int().nonnegative(),
    stakedSoFarInDay: z.number().int().nonnegative(),
    remaining: z.number().int(),
  }),
});

export type Accepted = z.infer<typeof acceptedSchema>;

/// Every refusal the route makes carries its own copy, written beside the rule that
/// produced it. The composer renders these words rather than translating them, because a
/// second translation is a second chance to describe the rule wrongly.
export const refusalSchema = z.object({
  error: z.string(),
  message: z.string(),
  nextAction: z.string(),
  pointsUntouched: z.boolean(),
});

export type Refusal = z.infer<typeof refusalSchema>;
