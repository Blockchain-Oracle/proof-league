import type { Address } from "viem";
import type { Cc3Clients } from "../cc3.js";
import type { Sources } from "../sources.js";
import type { StateStore } from "../state.js";
import type { TransparencyProjection } from "./project.js";

// One context object threads the pipeline (CONVENTIONS §2): phases are functions of
// (context, cursor) returning report objects, composed by the settlement round — the
// verify:settlement script drives EXACTLY this context against the live deployment, so
// the evidence run and the production loop share one code path.

export type SettlementContext = {
  readonly gateway: Address;
  readonly core: Address;
  readonly clients: Cc3Clients;
  readonly sources: Sources;
  readonly store: StateStore;
  readonly projection: TransparencyProjection;
  readonly proverUrl: string;
  // Every funded worker account the AD-7 ledger meters (the signer plus any configured
  // siblings); the escrow account is structurally absent — its key is never loaded.
  readonly accounts?: readonly Address[] | undefined;
  readonly webhookUrl?: string | undefined;
};

// Phase reports, never throws for expected outcomes (§6): "held" is the honest
// no-progress answer (window not open, attestation not yet covering, prover down),
// distinct from "advanced" which moves the cursor.
export type PhaseReport =
  | { readonly outcome: "advanced" }
  | { readonly outcome: "held"; readonly why: string }
  | { readonly outcome: "failed"; readonly why: string };

export type SettlementRoundReport = {
  readonly chainNowSec: number;
  readonly activeKeys: number;
  readonly settledKeys: readonly string[];
  readonly stuckKeys: readonly string[];
};
