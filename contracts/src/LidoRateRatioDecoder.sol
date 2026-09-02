// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IProofDecoder} from "./IProofDecoder.sol";

/// Decoder for Lido's daily stETH rebase report:
/// TokenRebased(uint256 indexed reportTimestamp, uint256 timeElapsed, uint256 preTotalShares,
///   uint256 preTotalEther, uint256 postTotalShares, uint256 postTotalEther,
///   uint256 sharesMintedAsFees), emitted by stETH, field order confirmed empirically
/// on-chain (event-catalog research 2026-08-22).
/// The answer is the annualized rate-ratio APR — NOT total-ether growth: withdrawal
/// finalization burns shares and ether inside every observed report, so naive
/// (postEther/preEther - 1) resolves negative daily; the share-rate ratio is the only
/// correct reading (research note (b)). Blind-verified reference: the 2026-08-22 report
/// decodes to 2.3785%.
contract LidoRateRatioDecoder is IProofDecoder {
    // The six non-indexed words, exactly; anything else is not this event's data.
    uint256 private constant REBASE_DATA_WORDS = 6;
    // Annualization constant of the blind-verified derivation:
    // APR = ((postEther/postShares) / (preEther/preShares) - 1) * YEAR / timeElapsed.
    uint256 private constant YEAR_SECONDS = 365 days;
    // 1e18 fixed point — the boundaries scale in MarketConfig; the per-day rate delta is
    // ~6.5e-5 relative, so FR-13's >=12-decimal precision floor demands cross-multiplied
    // fixed point, never naive division (research note (e)).
    uint256 private constant ONE = 1e18;
    // Lido totals sit near 2^83 (~9.6e24). 2^96 (~79 billion ETH) is unreachable for the
    // real emitter and keeps each cross-multiplied product under 2^192.
    uint256 private constant MAX_TOTAL = 1 << 96;
    // ~34 years dwarfs any real rebase interval (observed: 86400s) and bounds the
    // mulDiv denominator under 2^227.
    uint256 private constant MAX_TIME_ELAPSED = 1 << 35;

    error MalformedRebaseLog();
    error DegenerateRebaseReport();

    function decode(bytes32[] calldata topics, bytes calldata data)
        external
        pure
        returns (int256 value, uint64 occurredAt)
    {
        // topics[1] is the indexed reportTimestamp — the report's own declared reference
        // time (12:00:11 UTC daily, observed), which is check 6's occurredAt.
        if (topics.length < 2 || data.length != REBASE_DATA_WORDS * 32) revert MalformedRebaseLog();
        uint256 reportTimestamp = uint256(topics[1]);
        if (reportTimestamp > type(uint64).max) revert MalformedRebaseLog();

        (uint256 timeElapsed, uint256 preShares, uint256 preEther, uint256 postShares, uint256 postEther,) =
            abi.decode(data, (uint256, uint256, uint256, uint256, uint256, uint256));

        if (timeElapsed == 0 || timeElapsed > MAX_TIME_ELAPSED) revert DegenerateRebaseReport();
        if (preShares == 0 || preEther == 0 || postShares == 0 || postEther == 0) {
            revert DegenerateRebaseReport();
        }
        if (
            preShares >= MAX_TOTAL || preEther >= MAX_TOTAL || postShares >= MAX_TOTAL
                || postEther >= MAX_TOTAL
        ) revert DegenerateRebaseReport();

        // Cross-multiplied rate ratio: sign from the product comparison (negative rebase
        // is legal — boundaries are int256), magnitude in 512-bit mulDiv so nothing
        // truncates before the final division.
        uint256 grown = postEther * preShares;
        uint256 base = preEther * postShares;
        uint256 numerator = grown > base ? grown - base : base - grown;
        // Fit guard so every revert on this surface stays a named error: under this bound
        // mulDiv's result always fits 256 bits (real rebase deltas sit ~6 orders of
        // magnitude below it; only synthetic garbage can reach it).
        if (numerator > type(uint256).max / (YEAR_SECONDS * ONE)) revert DegenerateRebaseReport();
        uint256 magnitude = Math.mulDiv(numerator, YEAR_SECONDS * ONE, base * timeElapsed);
        if (magnitude > uint256(type(int256).max)) revert DegenerateRebaseReport();

        value = grown >= base ? int256(magnitude) : -int256(magnitude);
        occurredAt = uint64(reportTimestamp);
    }
}
