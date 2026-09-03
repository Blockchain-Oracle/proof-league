// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Vm} from "forge-std/Vm.sol";
import {MarketConfig, MarketState, Resolution} from "../src/LeagueCore.sol";
import {ProofGateway} from "../src/ProofGateway.sol";
import {ContestSource, RoundConfig} from "../src/ContestSource.sol";
import {ContestRoundDecoder} from "../src/ContestRoundDecoder.sol";
import {TxBytesCodec} from "./helpers/TxBytesCodec.sol";
import {GatewayTestBase} from "./helpers/GatewayTestBase.sol";

/// Story 2.7's referee-path pin (FR-21 "settled through the identical Referee path",
/// AD-11/AD-3): a Hosted Round market is nothing but a MarketConfig whose source fields
/// point at ContestSource on Sepolia's chainKey and whose decoderId is the
/// ContestRoundDecoder — then the SAME seven checks, fan-out and boundary bucketing run
/// with zero special-casing. The settlement log is captured from a real settle() via
/// vm.recordLogs, so the exact bytes ContestSource emits are what the gateway decodes —
/// any drift between the emitted event shape and the decoder's expectation fails here,
/// not on testnet during the 5.2 demo window.
contract ContestSourceRefereeTest is GatewayTestBase {
    ContestSource internal contest;
    uint32 internal contestDecoderId;

    // keccak256("RoundSettled(uint256,int256,uint64)") — the constant 5.1's Hosted
    // Round template config will carry; the capture test asserts it against the real
    // emitted topics[0] so the hardcoding can never drift.
    bytes32 internal constant ROUND_SETTLED_SIG = keccak256("RoundSettled(uint256,int256,uint64)");
    uint256 internal constant B0 = 8_000_000;
    uint64 internal constant SETTLE_BLOCK = uint64(B0 + 100);
    bytes32 internal constant SETTLE_HASH = keccak256("sepolia block 8000100");

    function setUp() public override {
        super.setUp();
        vm.roll(B0);
        address[] memory creators = new address[](1);
        creators[0] = OPERATOR;
        contest = new ContestSource(creators);
        // Deployed before the prank (the base's footgun note applies here too).
        ContestRoundDecoder decoder = new ContestRoundDecoder();
        vm.prank(OPERATOR);
        contestDecoderId = gateway.registerDecoder(address(decoder));
    }

    function _createRound() internal returns (uint256 roundId) {
        vm.prank(OPERATOR);
        roundId = contest.createRound(
            RoundConfig({
                settleBlock: SETTLE_BLOCK,
                // At/after the market's sourceWindowOpen below, so check 6 reads a
                // legally-timed event.
                scheduledSettleTime: T0 + 2 hours,
                valueMin: -50e18,
                valueSpan: 100e18
            })
        );
    }

    /// The Hosted Round market: a 2-option over/under on the draw's sign. Everything the
    /// gateway checks against comes from these fields — none of them name ContestSource
    /// as anything other than an emitter address on a chainKey.
    function _hostedConfig(uint256 roundId) internal view returns (MarketConfig memory c) {
        int256[] memory b = new int256[](1);
        b[0] = 0;
        c = MarketConfig({
            sourceChainKey: SEPOLIA_CHAIN_KEY,
            emitter: address(contest),
            eventSignature: ROUND_SETTLED_SIG,
            subjectFilter: bytes32(roundId),
            decoderId: contestDecoderId,
            payoutN: 2,
            leagueDay: 1,
            lockTime: T0 + 1 hours,
            sourceWindowOpen: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            voidDeadline: T0 + 1 hours + league.MIN_COMMIT_MARGIN() + 24 hours,
            determinismHorizon: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            boundaries: b
        });
    }

    /// Settles the round for real and wraps the captured log in the prover envelope —
    /// the emitted bytes, not a hand-built imitation of them.
    function _settledRoundTx(uint256 roundId) internal returns (bytes memory txBytes) {
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        vm.recordLogs();
        contest.settle(roundId);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        // Exactly one log per settle: the one-matching-log-per-receipt admission
        // property (gateway _matchingLog doc) holds for this family by construction.
        assertEq(logs.length, 1);
        assertEq(logs[0].emitter, address(contest));
        assertEq(logs[0].topics[0], ROUND_SETTLED_SIG);
        assertEq(logs[0].topics[1], bytes32(roundId));
        txBytes = TxBytesCodec.encode(1, TxBytesCodec.singleLog(address(contest), logs[0].topics, logs[0].data));
        _mock().arm(SEPOLIA_CHAIN_KEY, HEIGHT, keccak256(txBytes));
    }

    function test_hostedRound_resolvesThroughTheIdenticalRefereePath() public {
        uint256 roundId = _createRound();
        MarketConfig memory config = _hostedConfig(roundId);
        vm.prank(OPERATOR);
        uint256 marketId = league.createMarket(config);
        vm.warp(config.lockTime);
        vm.prank(OPERATOR);
        league.commitPicks(marketId, bytes32(0), "supabase://picksets/hosted.json", keccak256("hosted"));

        bytes memory txBytes = _settledRoundTx(roundId);
        bytes32 key = league.sourceKeyOf(config);
        _verify(key, txBytes);

        // The market resolved exactly as any mainnet-sourced market would: the round's
        // drawn value bucketed by the market's own boundaries, the event's declared
        // time being the creation-fixed schedule.
        assertTrue(league.stateOf(marketId) == MarketState.Resolved);
        int256 drawnValue = contest.getRoundResult(roundId).value;
        Resolution memory res = league.getResolution(marketId);
        assertEq(res.value, drawnValue);
        assertEq(res.occurredAt, T0 + 2 hours); // the round's creation-fixed scheduledSettleTime
        assertEq(res.winningOption, league.winningOptionOf(drawnValue, config.boundaries));
        assertTrue(gateway.acceptedAt(key) != 0);
    }

    /// Check 4 narrows per round: a market subject-filtered to a DIFFERENT roundId
    /// rejects round 1's proven log with the subject error — one ContestSource serves
    /// every round precisely because the roundId topic is the market-side filter.
    function test_hostedRound_rejectsAnotherRoundsLogOnSubject() public {
        uint256 roundId = _createRound();
        uint256 otherRoundId = _createRound();
        MarketConfig memory otherConfig = _hostedConfig(otherRoundId);
        vm.prank(OPERATOR);
        uint256 otherMarketId = league.createMarket(otherConfig);
        vm.warp(otherConfig.lockTime);
        vm.prank(OPERATOR);
        league.commitPicks(otherMarketId, bytes32(0), "supabase://picksets/other.json", keccak256("other"));

        bytes memory txBytes = _settledRoundTx(roundId);
        // Resolved before expectRevert: an external view call in the argument position
        // would swallow the expectation (the LeagueCore.t.sol prank footgun's cousin).
        bytes32 otherKey = league.sourceKeyOf(otherConfig);
        vm.expectRevert(ProofGateway.WrongSubject.selector);
        _verify(otherKey, txBytes);
    }
}
