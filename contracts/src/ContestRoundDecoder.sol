// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IProofDecoder} from "./IProofDecoder.sol";

/// Decoder for ContestSource's settlement event:
/// RoundSettled(uint256 indexed roundId, int256 value, uint64 occurredAt), emitted on
/// Sepolia (Story 2.7, AD-11). This is what makes FR-21's "identical Referee path"
/// literal: a Hosted Round market is just a MarketConfig whose emitter is ContestSource,
/// whose subjectFilter is its roundId, and whose decoderId points here — the gateway's
/// seven checks and fan-out never learn the source is ours. The value is already on the
/// 1e18 boundaries scale (ContestSource draws directly on it) and occurredAt is the
/// round's creation-fixed scheduledSettleTime, so decoding is shape validation plus
/// pass-through — any derivation here would double-apply what the source already fixed.
contract ContestRoundDecoder is IProofDecoder {
    // The two non-indexed words (value, occurredAt), exactly; anything else is not this
    // event's data.
    uint256 private constant ROUND_SETTLED_DATA_WORDS = 2;

    error MalformedRoundLog();

    function decode(bytes32[] calldata topics, bytes calldata data)
        external
        pure
        returns (int256 value, uint64 occurredAt)
    {
        // topics[1] is the indexed roundId the gateway already matched as the market's
        // subjectFilter (check 4); requiring its presence means a topic-stripped log of
        // the right signature still cannot decode.
        if (topics.length < 2 || data.length != ROUND_SETTLED_DATA_WORDS * 32) revert MalformedRoundLog();
        uint256 rawOccurredAt;
        (value, rawOccurredAt) = abi.decode(data, (int256, uint256));
        // A Solidity emitter zero-pads its uint64; dirty high bits mean the bytes came
        // from something that is not this event shape (the gateway idiom).
        if (rawOccurredAt > type(uint64).max) revert MalformedRoundLog();
        // forge-lint: disable-next-line(unsafe-typecast)
        occurredAt = uint64(rawOccurredAt);
    }
}
