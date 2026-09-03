// Derived display states are pure functions of (class-1 state, Market config, chain time) —
// defined once here so StateChip is the single renderer and no surface can invent a state (AD-18).

// The on-chain enum's wire order, exactly LeagueTypes.sol's MarketState: the index IS the
// uint8 stateOf(marketId) returns, so the worker and projection decode state numbers
// through this one array and can never disagree with the contract's encoding.
export const CONTRACT_MARKET_STATES = ["Created", "Committed", "Resolved", "Voided"] as const;
export type ContractMarketState = (typeof CONTRACT_MARKET_STATES)[number];

// Exactly the seven chips (plus Pick-level "pending", which lives with the Pick, not the Market).
export type MarketChip =
  | "open"
  | "locked"
  | "committed"
  | "awaiting attestation"
  | "proof verified"
  | "voided"
  | "stuck";

export type MarketTimingConfig = {
  readonly lockTimeSec: number;
  readonly sourceWindowOpenSec: number;
  readonly voidDeadlineSec: number;
  // From the day-1 measurement, served to clients so "running long" evaluates honestly (NFR-2).
  readonly expectedSettlementSec: number;
};

export const deriveMarketChip = (
  state: ContractMarketState,
  config: MarketTimingConfig,
  chainNowSec: number,
): MarketChip => {
  switch (state) {
    case "Resolved":
      return "proof verified";
    case "Voided":
      return "voided";
    case "Created":
      // Past the void deadline an uncommitted market renders stuck (void pending) so no window of
      // on-chain state lacks a chip while the permissionless void() is on its way (AD-19).
      if (chainNowSec > config.voidDeadlineSec) return "stuck";
      return chainNowSec < config.lockTimeSec ? "open" : "locked";
    case "Committed":
      if (chainNowSec < config.sourceWindowOpenSec) return "committed";
      if (chainNowSec <= config.expectedSettlementSec) return "awaiting attestation";
      // Past expected settlement but before/past voidDeadline without a proof: honestly stuck —
      // never a spinner, never hand-resolved (NFR-1).
      return "stuck";
  }
};
