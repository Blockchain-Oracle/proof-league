// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ContestSource, RoundConfig, RoundResult, RoundState} from "../src/ContestSource.sol";

/// Story 2.7 — the Hosted Round machine (FR-21, AD-11): outcomes fixed by a
/// pre-committed future block, influenceable by nobody. The suite pins the AC edges in
/// block units the way LeagueCoreVoid pinned its deadline second: settle reverts through
/// settleBlock itself, works on (settleBlock, settleBlock+256], and the lapsed horizon
/// flips permissionlessly to void — a disjoint, total partition of the timeline.
contract ContestSourceTest is Test {
    ContestSource internal contest;

    address internal constant OPERATOR = address(0xA11CE);
    address internal constant RANDO = address(0xBEEF);
    // 2026-08-16, the gateway suites' reference clock.
    uint64 internal constant T0 = 1_787_000_000;
    // An arbitrary Sepolia-scale block height for the creation moment.
    uint256 internal constant B0 = 8_000_000;
    uint64 internal constant SETTLE_BLOCK = uint64(B0 + 100);
    // A real Sepolia-shaped hash value; any nonzero constant keeps the draw derivation
    // reproducible in-test.
    bytes32 internal constant SETTLE_HASH = keccak256("sepolia block 8000100");

    function setUp() public {
        vm.warp(T0);
        vm.roll(B0);
        address[] memory creators = new address[](1);
        creators[0] = OPERATOR;
        contest = new ContestSource(creators);
    }

    /// Reference round: a 100-wide draw on the 1e18 scale starting below zero, so the
    /// negative-capable half of the shape parameterization is always exercised.
    function _round() internal pure returns (RoundConfig memory c) {
        c = RoundConfig({
            settleBlock: SETTLE_BLOCK,
            scheduledSettleTime: T0 + 2 hours,
            valueMin: -50e18,
            valueSpan: 100e18
        });
    }

    function _create(RoundConfig memory c) internal returns (uint256 roundId) {
        vm.prank(OPERATOR);
        roundId = contest.createRound(c);
    }

    /// The contract's own derivation, restated independently so a silent change to the
    /// draw formula fails a test instead of shipping.
    function _expectedValue(bytes32 entropy, uint256 roundId, RoundConfig memory c) internal pure returns (int256) {
        uint256 draw = uint256(keccak256(abi.encodePacked(entropy, roundId)));
        return c.valueMin + int256(draw % c.valueSpan);
    }

    // ---- constructor refusals (AD-20: no post-deploy fix path) ----

    function test_constructor_revertsOnEmptyCreatorSet() public {
        vm.expectRevert(ContestSource.InvalidCreatorSet.selector);
        new ContestSource(new address[](0));
    }

    function test_constructor_revertsOnZeroCreator() public {
        address[] memory creators = new address[](1);
        vm.expectRevert(ContestSource.InvalidCreatorSet.selector);
        new ContestSource(creators);
    }

    // ---- creation admission: every outcome-determining parameter fixed and sane ----

    function test_createRound_revertsForNonCreator() public {
        RoundConfig memory c = _round();
        vm.prank(RANDO);
        vm.expectRevert(ContestSource.NotRoundCreator.selector);
        contest.createRound(c);
    }

    function test_createRound_revertsOnCurrentOrPastSettleBlock() public {
        RoundConfig memory c = _round();
        // The current block's hash is zero to the executing EVM but its parent's is
        // readable — both directions must be inadmissible, or the creator could pick a
        // hash it already knows.
        c.settleBlock = uint64(B0);
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.SettleBlockNotFuture.selector);
        contest.createRound(c);
        c.settleBlock = uint64(B0 - 1);
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.SettleBlockNotFuture.selector);
        contest.createRound(c);
    }

    function test_createRound_revertsOnPastScheduledTime() public {
        RoundConfig memory c = _round();
        c.scheduledSettleTime = T0;
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.ScheduledTimeNotFuture.selector);
        contest.createRound(c);
    }

    function test_createRound_revertsOnEmptySpan() public {
        RoundConfig memory c = _round();
        c.valueSpan = 0;
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.EmptyValueSpan.selector);
        contest.createRound(c);
    }

    function test_createRound_revertsWhenSpanCannotFitInt256() public {
        RoundConfig memory c = _round();
        c.valueSpan = uint256(type(int256).max) + 1;
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.ValueSpanOverflow.selector);
        contest.createRound(c);
    }

    function test_createRound_revertsWhenMinPlusSpanOverflows() public {
        RoundConfig memory c = _round();
        // The largest draw would land exactly one past int256.max.
        c.valueMin = type(int256).max - int256(c.valueSpan - 1) + 1;
        vm.prank(OPERATOR);
        vm.expectRevert(ContestSource.ValueSpanOverflow.selector);
        contest.createRound(c);
    }

    function test_createRound_storesConfigAndEmits() public {
        RoundConfig memory c = _round();
        vm.expectEmit(true, true, true, true, address(contest));
        emit ContestSource.RoundCreated(1, c);
        uint256 roundId = _create(c);
        assertEq(roundId, 1);
        assertEq(contest.roundCount(), 1);
        RoundConfig memory stored = contest.getRoundConfig(roundId);
        assertEq(stored.settleBlock, c.settleBlock);
        assertEq(stored.scheduledSettleTime, c.scheduledSettleTime);
        assertEq(stored.valueMin, c.valueMin);
        assertEq(stored.valueSpan, c.valueSpan);
        assertTrue(contest.stateOf(roundId) == RoundState.Created);
    }

    // ---- AC: before settleBlock is mined, settle reverts ----

    function test_settle_revertsBeforeSettleBlock() public {
        uint256 roundId = _create(_round());
        vm.expectRevert(ContestSource.SettleBlockNotMined.selector);
        contest.settle(roundId);
        // At settleBlock itself the executing block's own hash is still zero to the
        // EVM — the proof-side analog of "at the deadline second the proof still owns
        // the moment": the settle block must be strictly behind the chain head.
        vm.roll(SETTLE_BLOCK);
        vm.expectRevert(ContestSource.SettleBlockNotMined.selector);
        contest.settle(roundId);
    }

    // ---- AC: outcome derives solely from blockhash(settleBlock) + fixed params ----

    function test_settle_derivesValueFromBlockhashAndEmits() public {
        RoundConfig memory c = _round();
        uint256 roundId = _create(c);
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        int256 expected = _expectedValue(SETTLE_HASH, roundId, c);
        vm.expectEmit(true, true, true, true, address(contest));
        emit ContestSource.RoundSettled(roundId, expected, c.scheduledSettleTime);
        vm.prank(RANDO); // permissionless: any caller, same outcome
        contest.settle(roundId);
        assertTrue(contest.stateOf(roundId) == RoundState.Settled);
        RoundResult memory result = contest.getRoundResult(roundId);
        assertEq(result.value, expected);
        assertEq(result.settledAt, T0);
    }

    function test_settle_identicalValueRegardlessOfCallerAndTiming() public {
        RoundConfig memory c = _round();
        uint256 roundId = _create(c);
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        uint256 snapshot = vm.snapshotState();
        vm.prank(RANDO);
        contest.settle(roundId);
        int256 earlyValue = contest.getRoundResult(roundId).value;
        // Same round, other caller, last legal block of the horizon: byte-identical draw.
        vm.revertToState(snapshot);
        vm.roll(uint256(SETTLE_BLOCK) + 256);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        vm.warp(T0 + 9 hours);
        vm.prank(OPERATOR);
        contest.settle(roundId);
        assertEq(contest.getRoundResult(roundId).value, earlyValue);
    }

    function test_settle_zeroBlockhashInsideWindowRevertsInsteadOfDrawing() public {
        // The EVM-drift defense case, forced explicitly (forge synthesizes nonzero
        // hashes for recent blocks): a zero hash must be an honest revert, never entropy.
        uint256 roundId = _create(_round());
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, bytes32(0));
        vm.expectRevert(ContestSource.SettleHorizonLapsed.selector);
        contest.settle(roundId);
    }

    function test_settle_roundIdSeparatesDrawsOnASharedSettleBlock() public {
        RoundConfig memory c = _round();
        uint256 first = _create(c);
        uint256 second = _create(c);
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        contest.settle(first);
        contest.settle(second);
        // Identical config, identical entropy — the id keeps the draws independent.
        assertEq(contest.getRoundResult(first).value, _expectedValue(SETTLE_HASH, first, c));
        assertEq(contest.getRoundResult(second).value, _expectedValue(SETTLE_HASH, second, c));
        assertTrue(contest.getRoundResult(first).value != contest.getRoundResult(second).value);
    }

    /// The range invariant under fuzzed shape and entropy: every draw lands inside
    /// [valueMin, valueMin + valueSpan), so no admitted (boundaries, span) pairing can
    /// ever see an out-of-domain value.
    function testFuzz_settle_valueAlwaysInsideConfiguredDomain(int256 valueMin, uint256 valueSpan, bytes32 entropy)
        public
    {
        valueSpan = bound(valueSpan, 1, uint256(type(int256).max));
        valueMin = bound(
            valueMin,
            type(int256).min,
            type(int256).max - int256(valueSpan - 1)
        );
        vm.assume(entropy != bytes32(0));
        RoundConfig memory c = _round();
        c.valueMin = valueMin;
        c.valueSpan = valueSpan;
        uint256 roundId = _create(c);
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, entropy);
        contest.settle(roundId);
        int256 value = contest.getRoundResult(roundId).value;
        assertGe(value, valueMin);
        // Upper bound via subtraction to stay clear of the int256.max edge itself.
        assertLe(value - valueMin, int256(valueSpan - 1));
    }

    // ---- AC: a lapsed 256-block horizon voids the round ----

    function test_settle_worksAtHorizonEdgeAndLapsesOnePastIt() public {
        RoundConfig memory c = _round();
        uint256 roundId = _create(c);
        // settleBlock + 256 is the LAST block whose EVM can still read the hash.
        vm.roll(uint256(SETTLE_BLOCK) + 256);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        uint256 snapshot = vm.snapshotState();
        contest.settle(roundId);
        assertTrue(contest.stateOf(roundId) == RoundState.Settled);
        // One block later the hash is out of BLOCKHASH's reach: settle refuses even
        // though the test VM would still hand it a value.
        vm.revertToState(snapshot);
        vm.roll(uint256(SETTLE_BLOCK) + 257);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        vm.expectRevert(ContestSource.SettleHorizonLapsed.selector);
        contest.settle(roundId);
    }

    function test_voidRound_revertsInsideHorizonThenVoidsPastIt() public {
        uint256 roundId = _create(_round());
        // The horizon's last settleable block is still the proof's moment, never void's.
        vm.roll(uint256(SETTLE_BLOCK) + 256);
        vm.expectRevert(ContestSource.VoidBeforeHorizon.selector);
        contest.voidRound(roundId);
        vm.roll(uint256(SETTLE_BLOCK) + 257);
        vm.expectEmit(true, true, true, true, address(contest));
        emit ContestSource.RoundVoided(roundId);
        vm.prank(RANDO); // permissionless, like settle
        contest.voidRound(roundId);
        assertTrue(contest.stateOf(roundId) == RoundState.Voided);
    }

    // ---- terminality: Settled and Voided are absorbing ----

    function test_settledRoundIsTerminal() public {
        uint256 roundId = _create(_round());
        vm.roll(SETTLE_BLOCK + 1);
        vm.setBlockhash(SETTLE_BLOCK, SETTLE_HASH);
        contest.settle(roundId);
        vm.expectRevert(ContestSource.RoundNotSettleable.selector);
        contest.settle(roundId);
        vm.roll(uint256(SETTLE_BLOCK) + 300);
        vm.expectRevert(ContestSource.RoundNotVoidable.selector);
        contest.voidRound(roundId);
    }

    function test_voidedRoundIsTerminal() public {
        uint256 roundId = _create(_round());
        vm.roll(uint256(SETTLE_BLOCK) + 257);
        contest.voidRound(roundId);
        vm.expectRevert(ContestSource.RoundNotSettleable.selector);
        contest.settle(roundId);
        vm.expectRevert(ContestSource.RoundNotVoidable.selector);
        contest.voidRound(roundId);
    }

    // ---- unknown-id surface: dense ids from 1, range-checked everywhere ----

    function test_unknownRoundRevertsAcrossTheSurface() public {
        vm.expectRevert(ContestSource.UnknownRound.selector);
        contest.settle(1);
        vm.expectRevert(ContestSource.UnknownRound.selector);
        contest.voidRound(1);
        vm.expectRevert(ContestSource.UnknownRound.selector);
        contest.getRoundConfig(1);
        vm.expectRevert(ContestSource.UnknownRound.selector);
        contest.stateOf(1);
        vm.expectRevert(ContestSource.UnknownRound.selector);
        contest.getRoundResult(1);
    }

    function test_getRoundResult_revertsWhileUnsettled() public {
        uint256 roundId = _create(_round());
        vm.expectRevert(ContestSource.RoundNotSettled.selector);
        contest.getRoundResult(roundId);
    }
}
