// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// One registered decoder per source-event shape (AD-3): given a proven log's raw topics
/// and data, derive the Market-facing answer. A new event shape is a new decoder appended
/// to ProofGateway's registry — never a LeagueCore change.
interface IProofDecoder {
    /// Pure by contract, not convenience: `pnpm rebuild` (AD-8) recomputes decode(log)
    /// off-chain and diffs it against the emitted resolution, so no state, clock or
    /// oracle may influence the derivation.
    /// - value: the decoded answer as a 1e18 fixed-point fraction on the same scale as
    ///   MarketConfig.boundaries (negative outcomes are legal — boundaries are int256).
    /// - occurredAt: the source event's own declared unix time, feeding check 6
    ///   ("the Market was open when it happened") against each market's sourceWindowOpen.
    function decode(bytes32[] calldata topics, bytes calldata data)
        external
        pure
        returns (int256 value, uint64 occurredAt);
}
