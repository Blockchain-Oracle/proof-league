// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LidoRateRatioDecoder} from "../src/LidoRateRatioDecoder.sol";
import {LidoReceiptFixture} from "./helpers/LidoReceiptFixture.sol";

/// Story 2.3 — the Lido rate-ratio decoder reproduces the blind-verified reference
/// figures from raw event fields (FR-13). The APR targets below were derived
/// independently in the event-catalog research (2026-08-22) before this decoder
/// existed; the raw words were fetched from mainnet on 2026-09-02.
contract LidoRateRatioDecoderTest is Test {
    LidoRateRatioDecoder internal decoder;

    function setUp() public {
        decoder = new LidoRateRatioDecoder();
    }

    /// value/1e12 rounded half-up: the 4-decimal percent display the research reports
    /// (1e18 fraction -> percent is x100, 4dp keeps 1e12 granularity).
    function _percent4dp(int256 value) internal pure returns (int256) {
        return value >= 0 ? (value + 5e11) / 1e12 : -((-value + 5e11) / 1e12);
    }

    // ---- AC: the decoded reference receipt reproduces the blind-verified 2.3785% ----

    function test_decode_reproducesBlindVerifiedReferenceApr() public view {
        (int256 value, uint64 occurredAt) = decoder.decode(LidoReceiptFixture.topics(), LidoReceiptFixture.data());
        assertEq(value, LidoReceiptFixture.EXPECTED_VALUE_1E18);
        assertEq(_percent4dp(value), 23785); // 2.3785%
        assertEq(occurredAt, uint64(LidoReceiptFixture.REPORT_TIMESTAMP));
    }

    /// Two further reports the research blind-verified (2.2408% and 2.3806%), so the
    /// derivation is pinned at three independent points, not one.
    function test_decode_reproducesFurtherBlindVerifiedReports() public view {
        // 2026-08-21 12:00:11Z, block 25803485, tx 0x9cba6988…8ef53e (full hash in
        // docs/research event-catalog liveness verdicts; truncated for the secret-scan).
        bytes32[] memory topics = LidoReceiptFixture.topics();
        topics[1] = bytes32(uint256(1787313611));
        (int256 value,) = decoder.decode(
            topics,
            abi.encode(
                uint256(86400),
                uint256(7720143054940444231129945),
                uint256(9589296911118668129229118),
                uint256(7710085229096862658511395),
                uint256(9577391871602054841923399),
                uint256(52562335884476282129)
            )
        );
        assertEq(_percent4dp(value), 22408); // 2.2408%

        // 2026-08-20 12:00:11Z, block 25796297, tx 0x004275a4…bfe809 (full hash in
        // docs/research event-catalog liveness verdicts; truncated for the secret-scan).
        topics[1] = bytes32(uint256(1787227211));
        (value,) = decoder.decode(
            topics,
            abi.encode(
                uint256(86400),
                uint256(7701381279566466183772385),
                uint256(9565368769726512447907659),
                uint256(7683507579725536274835527),
                uint256(9543791478535930645127247),
                uint256(55631491095991840714)
            )
        );
        assertEq(_percent4dp(value), 23806); // 2.3806%
    }

    /// Boundaries are int256 because negative rebases are legal (slashing): with the
    /// reference report's pre/post pairs swapped, the rate ratio inverts and the value
    /// must come out negative, cross-multiplied against the swapped base.
    function test_decode_negativeRebaseYieldsNegativeValue() public view {
        (int256 value,) = decoder.decode(
            LidoReceiptFixture.topics(),
            abi.encode(
                LidoReceiptFixture.TIME_ELAPSED,
                LidoReceiptFixture.POST_TOTAL_SHARES,
                LidoReceiptFixture.POST_TOTAL_ETHER,
                LidoReceiptFixture.PRE_TOTAL_SHARES,
                LidoReceiptFixture.PRE_TOTAL_ETHER,
                LidoReceiptFixture.SHARES_MINTED_AS_FEES
            )
        );
        assertEq(value, -23783858080390296);
    }

    // ---- Shape rejections: not this event => named error, never a misread ----

    function test_decode_missingSubjectTopicRejected() public {
        bytes32[] memory topics = new bytes32[](1);
        topics[0] = LidoReceiptFixture.TOKEN_REBASED_SIG;
        vm.expectRevert(LidoRateRatioDecoder.MalformedRebaseLog.selector);
        decoder.decode(topics, LidoReceiptFixture.data());
    }

    function test_decode_wrongDataLengthRejected() public {
        bytes memory fiveWords = abi.encode(
            LidoReceiptFixture.TIME_ELAPSED,
            LidoReceiptFixture.PRE_TOTAL_SHARES,
            LidoReceiptFixture.PRE_TOTAL_ETHER,
            LidoReceiptFixture.POST_TOTAL_SHARES,
            LidoReceiptFixture.POST_TOTAL_ETHER
        );
        vm.expectRevert(LidoRateRatioDecoder.MalformedRebaseLog.selector);
        decoder.decode(LidoReceiptFixture.topics(), fiveWords);
    }

    function test_decode_oversizedReportTimestampRejected() public {
        bytes32[] memory topics = LidoReceiptFixture.topics();
        topics[1] = bytes32(uint256(type(uint64).max) + 1);
        vm.expectRevert(LidoRateRatioDecoder.MalformedRebaseLog.selector);
        decoder.decode(topics, LidoReceiptFixture.data());
    }

    // ---- Degenerate-value rejections ----

    function test_decode_zeroFieldsRejected() public {
        // Each zeroable field in turn; sharesMintedAsFees is unused by the derivation.
        for (uint256 zeroed = 0; zeroed < 5; zeroed++) {
            uint256[6] memory w = [
                LidoReceiptFixture.TIME_ELAPSED,
                LidoReceiptFixture.PRE_TOTAL_SHARES,
                LidoReceiptFixture.PRE_TOTAL_ETHER,
                LidoReceiptFixture.POST_TOTAL_SHARES,
                LidoReceiptFixture.POST_TOTAL_ETHER,
                LidoReceiptFixture.SHARES_MINTED_AS_FEES
            ];
            w[zeroed] = 0;
            vm.expectRevert(LidoRateRatioDecoder.DegenerateRebaseReport.selector);
            decoder.decode(LidoReceiptFixture.topics(), abi.encode(w[0], w[1], w[2], w[3], w[4], w[5]));
        }
    }

    function test_decode_absurdMagnitudesRejected() public {
        // A total at the 2^96 bound (~79 billion ETH) can never come from the real
        // emitter; past it the cross-multiplied products would near the 256-bit ceiling.
        bytes memory absurdTotal = abi.encode(
            LidoReceiptFixture.TIME_ELAPSED,
            uint256(1) << 96,
            LidoReceiptFixture.PRE_TOTAL_ETHER,
            LidoReceiptFixture.POST_TOTAL_SHARES,
            LidoReceiptFixture.POST_TOTAL_ETHER,
            LidoReceiptFixture.SHARES_MINTED_AS_FEES
        );
        vm.expectRevert(LidoRateRatioDecoder.DegenerateRebaseReport.selector);
        decoder.decode(LidoReceiptFixture.topics(), absurdTotal);

        bytes memory absurdInterval = abi.encode(
            (uint256(1) << 35) + 1,
            LidoReceiptFixture.PRE_TOTAL_SHARES,
            LidoReceiptFixture.PRE_TOTAL_ETHER,
            LidoReceiptFixture.POST_TOTAL_SHARES,
            LidoReceiptFixture.POST_TOTAL_ETHER,
            LidoReceiptFixture.SHARES_MINTED_AS_FEES
        );
        vm.expectRevert(LidoRateRatioDecoder.DegenerateRebaseReport.selector);
        decoder.decode(LidoReceiptFixture.topics(), absurdInterval);
    }

    /// A ratio mulDiv could not represent must hit the named fit guard, never OZ's
    /// internal unnamed revert: tiny base against near-bound growth product.
    function test_decode_unrepresentableRatioRejectedByName() public {
        bytes memory garbage = abi.encode(
            uint256(1), // timeElapsed
            (uint256(1) << 96) - 1, // preShares
            uint256(1), // preEther
            uint256(1), // postShares
            (uint256(1) << 96) - 1, // postEther
            uint256(0)
        );
        vm.expectRevert(LidoRateRatioDecoder.DegenerateRebaseReport.selector);
        decoder.decode(LidoReceiptFixture.topics(), garbage);
    }
}
