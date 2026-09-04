import { deriveMarketChip, type ContractMarketState, type MarketTimingConfig } from "../market-state.js";

// The personal Card's lifecycle (rebaseline section 4, FR-10, AD-28). ONE record that
// evolves; it is never replaced at settlement and never forks into unrelated "pending" and
// "settled" objects that lose identity.
//
// Three different things are called a Card in this product, and collapsing them is the
// error this module exists to prevent:
//
//   MARKET CARD        what can be predicted. Public. Owned by the Market.
//   PREDICTION CARD    what ONE player chose, after an accepted Pick. Private by default.
//   SETTLED RECORD     the SAME personal Card once the chain has decided. Permanent.
//
// The stage below is the second and third of those. It is a discriminated union rather
// than a bag of optional fields because the fields that must not exist yet are the whole
// point: a Card cannot carry an outcome before a proof was accepted, cannot carry a score
// before scoring ran, and cannot carry a Streak effect before the league day finalized.
// Making those unrepresentable is cheaper than remembering not to render them.

/// How the face should read. Tone is carried instead of a colour so that a consumer never
/// branches on the stage name to decide what green means: green is EARNED, exactly once,
/// after proof and scoring, and no other stage can reach for it.
export type CardTone =
  | "anticipatory" // open and unresolved; vermilion conviction, never a win signal
  | "waiting" // genuinely unknown: amber, honest, no fake progress
  | "earned" // correct, after proof AND score. The only green.
  | "ash" // incorrect. Equal information density, no shame copy.
  | "recorded"; // voided or stuck: still a record, still explains itself

export type CardOutcome = {
  /// The decoded value the source event carried, already formatted in its decoder's units
  /// by the caller that owns those units (the Market view model).
  readonly valueLabel: string;
  readonly winningOption: number;
  readonly proofTxHash: string | null;
};

export type CardScore = {
  /// Points the contract actually awarded. Gross stake x N for a correct Pick, zero
  /// otherwise (payout.ts). Never a client-side estimate.
  readonly pointsAwarded: number;
  /// Present only once the league day finalized (AD-16). A Streak effect shown while a
  /// sibling Market is still pending would be a number the chain has not agreed to yet.
  readonly streakAfter?: number;
};

export type CardStage =
  | { readonly kind: "private" }
  | { readonly kind: "open-call" }
  | { readonly kind: "locked" }
  | { readonly kind: "committed" }
  | { readonly kind: "awaiting" }
  | { readonly kind: "settled-unread" }
  | { readonly kind: "scoring"; readonly outcome: CardOutcome }
  | { readonly kind: "correct"; readonly outcome: CardOutcome; readonly score: CardScore }
  | { readonly kind: "incorrect"; readonly outcome: CardOutcome; readonly score: CardScore }
  | { readonly kind: "voided" }
  | { readonly kind: "stuck" };

export type CardStageKind = CardStage["kind"];

export type CardStageCopy = {
  readonly label: string;
  readonly tone: CardTone;
  /// What is true right now and what happens next. Every stage answers both, because a
  /// player looking at a Card should never have to guess whether anything is still coming.
  readonly body: string;
};

// Adding a stage without user-facing copy is a compile error (CONVENTIONS section 6).
export const CARD_STAGE_COPY = {
  private: {
    label: "Your Call",
    tone: "anticipatory",
    body: "Your Pick is signed and held. It stays private until you publish it, and it is committed on-chain with everyone else's at Lock Time.",
  },
  "open-call": {
    label: "Open Call",
    tone: "anticipatory",
    body: "You published this Call. Anyone with the link can see what you chose and when it locks. They cannot see a result, because there is not one yet.",
  },
  locked: {
    label: "Locked",
    tone: "waiting",
    body: "Lock Time has passed, so nothing can be added or changed. The set of Picks is being published and pinned on-chain by hash.",
  },
  committed: {
    label: "Committed",
    tone: "waiting",
    body: "Your Pick is inside the published set whose hash the contract already stored. The source event has not happened yet.",
  },
  awaiting: {
    label: "Waiting on the proof",
    tone: "waiting",
    body: "The source event's window is open. Creditcoin has to confirm the block before a proof can be built, which usually takes a few minutes. You can close this page; the Card updates itself.",
  },
  "settled-unread": {
    label: "Settled",
    tone: "waiting",
    body: "This Market has settled on-chain. This view has not loaded its result yet, and a Card will not guess at one.",
  },
  scoring: {
    label: "Result in, scoring",
    tone: "waiting",
    body: "The proof was accepted and the Market has its answer. Your points are applied when this Market's Picks are scored, which is a separate transaction.",
  },
  correct: {
    label: "Correct",
    tone: "earned",
    body: "The decoded value landed in the option you called, and the contract has scored it.",
  },
  incorrect: {
    label: "Incorrect",
    tone: "ash",
    body: "The decoded value landed in a different option. The Pick stays on your record, because a record that hides misses is not evidence of anything.",
  },
  voided: {
    label: "Voided",
    tone: "recorded",
    body: "No proof of this Market's source event arrived before its deadline, so the Market voided. Nothing scored and the points you committed were not spent.",
  },
  stuck: {
    label: "Running long",
    tone: "recorded",
    body: "This Market is past the time settlement usually takes and has no accepted proof yet. It is not lost and it is never hand-resolved: it either settles when a proof lands or voids at its deadline.",
  },
} satisfies Record<CardStageKind, CardStageCopy>;

export type CardPickFacts = {
  readonly optionIndex: number;
  /// True only after the player explicitly published (AD-25). Private by default is the
  /// product promise, so this defaults to false at every call site that does not know.
  readonly published: boolean;
};

export type CardMarketFacts = {
  readonly state: ContractMarketState;
  readonly timing: MarketTimingConfig;
};

export type CardResolutionFacts = {
  readonly outcome: CardOutcome;
  /// Present only when this player's Pick has actually been scored on-chain.
  readonly score?: CardScore;
};

/// The one place a personal Card's stage is decided.
///
/// The Market half is delegated to `deriveMarketChip` rather than re-derived, so a Card can
/// never disagree with the chip rendered beside it on the same screen. Only the two
/// genuinely personal questions are answered here: has this player published, and has this
/// player's Pick been scored.
export const deriveCardStage = (
  pick: CardPickFacts,
  market: CardMarketFacts,
  chainNowSec: number,
  resolution?: CardResolutionFacts,
): CardStage => {
  switch (deriveMarketChip(market.state, market.timing, chainNowSec)) {
    case "open":
      return { kind: pick.published ? "open-call" : "private" };
    case "locked":
      return { kind: "locked" };
    case "committed":
      return { kind: "committed" };
    case "awaiting attestation":
      return { kind: "awaiting" };
    case "voided":
      return { kind: "voided" };
    case "stuck":
      return { kind: "stuck" };
    case "proof verified": {
      // A caller can hold a resolved Market without having loaded its resolution. Every
      // nearby stage would be a lie here: "waiting on the proof" contradicts the chain,
      // and "correct" is a coin flip. So this reads as its own state, which also makes
      // the caller's missing read visible instead of plausible.
      if (resolution === undefined) return { kind: "settled-unread" };
      if (resolution.score === undefined) return { kind: "scoring", outcome: resolution.outcome };
      const correct = pick.optionIndex === resolution.outcome.winningOption;
      return correct
        ? { kind: "correct", outcome: resolution.outcome, score: resolution.score }
        : { kind: "incorrect", outcome: resolution.outcome, score: resolution.score };
    }
  }
};

/// A short, stable, human-quotable id for one personal Card. `(marketId, player)` is the
/// Card's identity in the spine's conventions; the nonce disambiguates a player who
/// changed their mind, because the superseded Pick keeps its own Card in the record.
export const cardSerialOf = (marketId: string, nonce: number): string => `${marketId}-${nonce}`;

// Stage predicates for consumers that may not spell the terminal words themselves (the
// web's chip-literal law keeps "voided" and "stuck" in one renderer). A consumer asks the
// question; the answer's vocabulary stays here.
export const isVoidedStage = (stage: CardStage): boolean => stage.kind === "voided";
export const isStuckStage = (stage: CardStage): boolean => stage.kind === "stuck";
export const isDecidedStage = (stage: CardStage): boolean =>
  stage.kind === "correct" || stage.kind === "incorrect" || stage.kind === "voided";
