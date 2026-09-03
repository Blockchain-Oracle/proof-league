// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// LeagueTypes — the core's shared type surface, pre-split from LeagueCore.sol before
/// Story 2.5 pushed it past the 400-raw-line law (CONVENTIONS §1). Types only: every
/// behavior stays in the module that owns it, so this never becomes a dumping ground.

/// A Market's full immutable configuration, written before it opens (AD-3). The on-chain
/// copy is the authority; packages/shared/src/config.ts is its zod mirror.
/// Outcome Options are encoded as ordered internal thresholds with open-ended outer
/// buckets: N options = N-1 thresholds, so every decoded value maps to exactly one
/// option and an out-of-range outcome is unrepresentable (FR-7 honesty).
struct MarketConfig {
    // Source identity: which event on which chain settles this Market (check 2 reads
    // "the right contract on the right chain" — the chainKey is config, never calldata, AD-6).
    uint64 sourceChainKey;
    address emitter;
    bytes32 eventSignature;
    // Optional indexed-topic filter; zero means the event needs no subject narrowing.
    bytes32 subjectFilter;
    // Decoder is an append-only ProofGateway registry id; registering never touches LeagueCore (AD-3).
    uint32 decoderId;
    // Payout law (PRD Glossary): gross return = stake x N where N = option count, so N is
    // structurally bound to boundaries.length + 1 at admission.
    uint8 payoutN;
    // Streak/day attribution key (AD-16); never any transaction's timestamp.
    uint32 leagueDay;
    uint64 lockTime;
    uint64 sourceWindowOpen;
    uint64 voidDeadline;
    // FR-6 rule 3: lock must fall before the moment the outcome starts being computable.
    uint64 determinismHorizon;
    // 1e18 fixed-point thresholds, strictly ascending (yields may be negative: int256).
    int256[] boundaries;
}

/// Exactly the canonical monotone machine (AD-19): Created -> Committed -> Resolved | Voided,
/// with Created -> Voided a legal edge. Display chips derive off-chain (AD-18).
enum MarketState {
    Created,
    Committed,
    Resolved,
    Voided
}

/// One signed Pick, exactly the EIP-712 message schema in packages/shared/src/pick.ts
/// (AD-5). Field order and widths are part of the canonical encoding; the conformance
/// suite in test/PickLeaf.t.sol holds the two planes identical.
struct Pick {
    address player;
    uint256 marketId;
    uint8 optionIndex;
    uint16 stake;
    uint32 nonce;
    uint32 utcDay;
    uint16 stakedSoFarInDay;
}

/// The merkle commitment binding a market's published pick-set file (AD-5): the root the
/// scoring proofs open against, plus the dual-homed file's uri and sha256 so the exact
/// bytes are pinned on-chain. The canonical empty root is bytes32(0) — state, not the
/// root value, is the committed signal.
struct PickCommitment {
    bytes32 root;
    bytes32 sha256Hash;
    uint64 committedAt;
    string uri;
}

/// One Market's terminal answer (AD-4, FR-16): the decoded value on the boundaries'
/// 1e18 scale, the option it lands in, the source event's own declared time, and the
/// chain-head time of settlement. Together with the config already emitted at
/// creation (boundaries, decoderId), this is the proof panel's and `pnpm rebuild`'s
/// full derivation record.
struct Resolution {
    int256 value;
    uint64 occurredAt;
    uint64 resolvedAt;
    uint8 winningOption;
}
