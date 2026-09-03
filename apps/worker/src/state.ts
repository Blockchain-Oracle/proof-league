import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Class-2 operational state (AD-18): per-sourceKey pipeline cursors, the AD-7 ledger
// counters and alert dedupe, persisted to disk so a restart RESUMES without re-detection
// (AD-13's drill: kill the worker mid-pipeline, watch it pick up at the same phase). A
// local JSON file is the honest store while the Supabase decision is open — the Story 2.9
// projector will own the transparency half; the cursor half stays worker-local either way.

export type PipelinePhase = "watching" | "awaiting-attestation" | "proving" | "settled" | "voided";

// The proof is cached once built so a restart between prove and submit resubmits without
// re-querying the prover — a proof unit is budget (AD-7), never spent twice for one key.
export type StoredProof = {
  height: number;
  txBytes: `0x${string}`;
  merkleRoot: `0x${string}`;
  merkleSiblings: { hash: `0x${string}`; isLeft: boolean }[];
  lowerEndpointDigest: `0x${string}`;
  continuityRoots: `0x${string}`[];
  prover: "hosted" | "raw";
};

export type CursorMarket = {
  // Timing differs per market even on a shared key (the key hashes only the four source
  // fields), so the watch window and terminal bookkeeping are per market.
  openSec: number;
  voidDeadlineSec: number;
  state: "Committed" | "Resolved" | "Voided";
};

// The pipeline unit is the sourceKey, not the market: one accepted proof settles every
// market on the key in one transaction — one detection, one proof, one budget unit (AD-7).
export type SourceKeyCursor = {
  sourceKey: `0x${string}`;
  chainKey: number;
  emitter: `0x${string}`;
  eventSignature: `0x${string}`;
  subjectFilter: `0x${string}`;
  markets: Record<string, CursorMarket>; // marketId (decimal string) -> per-market view
  phase: PipelinePhase;
  scanFromBlock?: number; // source-chain log-scan cursor: resume, never re-scan from genesis
  detected?: { txHash: `0x${string}`; blockNumber: number; blockTimestampSec: number };
  proof?: StoredProof;
  timestamps: { eventSec?: number; attestedSec?: number; provenSec?: number };
  provenTxHash?: `0x${string}`;
  overCliff?: boolean; // past the 60-min cost cliff (AD-7): proven anyway, marked honestly
  alertedLate?: boolean;
  alertedUnattested?: boolean;
  stuckReason?: string; // the honest reason the pipeline cannot advance — never a silent skip
};

export type SeasonCursor = {
  seasonEndSec?: number;
  stage: "watching" | "candidate-submitted" | "finalized";
  windowEndsAtSec?: number;
  players: string[]; // observed via PickScored logs (class 2); the chain verifies candidates
  playerScanFromBlock?: number;
};

// Story 2.9's class-2 half: where the projector's chain reads have reached. markets maps
// marketId -> the state already projected ("final" once nothing about the market can ever
// change again), so settled seasons stop costing reads; scanFromBlock is the scoring-log
// cursor. Losing this file only costs re-reads — every projected row is idempotent.
export type ProjectorCursor = {
  markets: Record<string, "Created" | "Committed" | "Resolved" | "Voided" | "final">;
  scanFromBlock?: number;
};

export type WorkerState = {
  cursors: Record<string, SourceKeyCursor>; // keyed by sourceKey
  // marketId -> sourceKey once cursored, or "terminal" once Resolved/Voided pre-cursor —
  // the monotone state machine makes terminal permanent, so these ids skip re-reads.
  marketIndex: Record<string, string>;
  ledger: {
    proofUnits: number; // prover queries issued — the AD-7 budget-unit meter
    gasWeiByDay: Record<string, string>; // utcDay -> wei spent by worker accounts (JSON-safe)
  };
  alertsSentAtMs: Record<string, number>; // alert-key -> last webhook send (dedupe)
  seasons: Record<string, SeasonCursor>; // keyed by core address: verify:payout runs test seasons
  projectors: Record<string, ProjectorCursor>; // keyed by core address (Story 2.9)
};

const emptyState = (): WorkerState => ({
  cursors: {},
  marketIndex: {},
  ledger: { proofUnits: 0, gasWeiByDay: {} },
  alertsSentAtMs: {},
  seasons: {},
  projectors: {},
});

/// Loads at construction, mutates in memory, and persists via write-temp-then-rename so a
/// crash mid-save can never leave a torn cursor file (the resume guarantee depends on it).
export class StateStore {
  readonly dir: string;
  readonly state: WorkerState;

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
    let loaded: WorkerState | undefined;
    try {
      loaded = JSON.parse(readFileSync(join(dir, "state.json"), "utf8")) as WorkerState;
    } catch {
      loaded = undefined; // first boot, or an unreadable file: start empty and re-observe
    }
    this.state = { ...emptyState(), ...loaded };
  }

  save(): void {
    const tmp = join(this.dir, "state.json.tmp");
    writeFileSync(tmp, JSON.stringify(this.state, null, 1));
    renameSync(tmp, join(this.dir, "state.json"));
  }

  seasonOf(core: string): SeasonCursor {
    const existing = this.state.seasons[core];
    if (existing) return existing;
    const fresh: SeasonCursor = { stage: "watching", players: [] };
    this.state.seasons[core] = fresh;
    return fresh;
  }

  projectorOf(core: string): ProjectorCursor {
    const existing = this.state.projectors[core];
    if (existing) return existing;
    const fresh: ProjectorCursor = { markets: {} };
    this.state.projectors[core] = fresh;
    return fresh;
  }
}

export const readStateDir = (env: Record<string, string | undefined>): string =>
  env.WORKER_STATE_DIR ?? ".worker-state";
