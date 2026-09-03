// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueCore, MarketConfig, MarketState, Pick} from "../src/LeagueCore.sol";
import {LeagueScoring} from "../src/LeagueScoring.sol";
import {ScoringTestBase} from "./helpers/ScoringTestBase.sol";

/// Story 2.6 — AD-19's guarded, terminal, permissionless timeout. Eligibility is a pure
/// function of (state, chain clock): strictly past voidDeadline, non-terminal only, any
/// caller. Stake return is structural (AD-15): dailySpent debits only at scoring and a
/// voided market can never reach scoreBatch, so nothing was ever taken — pinned here by
/// reading the ledger after the real edge. The consumed-key half of the accepted-proof
/// story (a fan-out-skipped sibling stays voidable) lives in ProofGatewayFanOut.t.sol,
/// where a real gateway owns acceptedAt.
contract LeagueCoreVoidTest is ScoringTestBase {
    // ---- AC 1: Committed -> Voided past the deadline, terminal, permissionless ----

    function test_void_committedMarketPastDeadlineVoidsTerminally() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        // Computed before expectEmit: the view call would otherwise be "the next call".
        bytes32 key = league.sourceKeyOf(c);
        vm.warp(c.voidDeadline + 1);
        vm.expectEmit(true, true, false, true, address(league));
        emit LeagueCore.MarketVoided(id, key);
        // STRANGER holds no role anywhere: void is the one lifecycle write anyone may land.
        vm.prank(STRANGER);
        league.void(id);

        assertEq(uint8(league.stateOf(id)), uint8(MarketState.Voided));
        // A later resolve permanently reverts (the test contract IS the recorded gateway).
        vm.expectRevert(LeagueCore.MarketNotResolvable.selector);
        league.resolve(id, 231e14, uint64(block.timestamp));
        // The commitment record survives the terminal transition (keyed on committedAt,
        // not state) — the published pick-set file stays provable for the refund view.
        assertEq(league.getPickCommitment(id).root, ROOT);
    }

    // ---- AC 2: Created -> Voided — a missed commit can never freeze a market ----

    function test_void_createdMarketPastDeadlineVoidsWithNoStakeMovement() public {
        (uint256 id, MarketConfig memory c) = _createdMarket();
        vm.warp(c.voidDeadline + 1);
        vm.prank(STRANGER);
        league.void(id);

        assertEq(uint8(league.stateOf(id)), uint8(MarketState.Voided));
        // No stakes existed to move: the market never committed a set.
        vm.expectRevert(LeagueCore.NotCommitted.selector);
        league.getPickCommitment(id);
        // Terminal for its day all the same — the season-safety half of the edge.
        LeagueScoring.DayMarkets memory dm = league.dayMarketsOf(c.leagueDay);
        assertEq(dm.terminal, dm.created);
    }

    // ---- AC 3: the guard — before the deadline, or already terminal, void reverts ----

    /// Strictly past: at the deadline itself the proof still owns the moment (AD-19's
    /// "the void clock is never the shorter one" taken to the second).
    function test_void_revertsAtAndBeforeDeadline() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        vm.warp(c.voidDeadline);
        vm.expectRevert(LeagueCore.VoidBeforeDeadline.selector);
        league.void(id);
        vm.warp(c.voidDeadline - 1);
        vm.expectRevert(LeagueCore.VoidBeforeDeadline.selector);
        league.void(id);
    }

    /// The honest reading of "with an accepted proof it reverts": resolution is atomic
    /// with proof acceptance, so the market the proof settled is already terminal here.
    function test_void_revertsOnResolvedMarket() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        _resolveTo(id, 231e14);
        vm.warp(c.voidDeadline + 1);
        vm.expectRevert(LeagueCore.MarketNotVoidable.selector);
        league.void(id);
    }

    function test_void_revertsOnDoubleVoid() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        vm.warp(c.voidDeadline + 1);
        league.void(id);
        vm.expectRevert(LeagueCore.MarketNotVoidable.selector);
        league.void(id);
    }

    function test_void_revertsOnUnknownMarket() public {
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.void(999);
    }

    // ---- AC 1's stake return, keyed by the signed utcDay (AD-15) ----

    /// Voided picks never surface: scoreBatch stays Resolved-only, so the committed
    /// set's stakes were never debited from any signed utcDay — return-by-never-taking,
    /// exactly AD-15's ledger shape. Negative-tested against the real edge, not a stub.
    function test_void_committedPicksNeverScoreAndNeverSpend() public {
        (uint256 id, MarketConfig memory c) = _createOnDay(1);
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, id, 3, 10, 1, 0);
        _commitPickSet(id, c, picks);
        vm.warp(c.voidDeadline + 1);
        league.void(id);

        // Precomputed batch arguments: expectRevert binds to the next external call, and
        // the leaf hashing inside _scoreAll is itself a call (the _preparedBatch rule).
        (bytes32[][] memory proofs, uint256 leafCount, bytes32 treeRoot) = _preparedBatch(picks);
        vm.expectRevert(LeagueCore.MarketNotScorable.selector);
        league.scoreBatch(id, 0, picks, proofs, leafCount, treeRoot);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 0);
        assertEq(league.seasonPointsOf(ALICE), 0);
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 0);
    }

    // ---- AC 2's season-safety consequence: void finalizes days and unfreezes streaks ----

    /// A day whose only market voids finalizes with the player having no settled picks:
    /// the fold treats it as unplayed — pause, never a break (AD-16, "voided Picks never
    /// count").
    function test_void_onlyMarketDayFinalizesAndStreakPauses() public {
        _aliceCorrectDay(1, 1);
        assertEq(league.streakOf(ALICE), 1);

        (uint256 id, MarketConfig memory c) = _createOnDay(2);
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, id, 3, 10, 2, 10);
        _commitPickSet(id, c, picks);
        bytes32 key = league.sourceKeyOf(c);
        vm.warp(c.voidDeadline + 1);
        // noteVoided lands before MarketVoided, so the two events arrive in this order.
        vm.expectEmit(true, false, false, true, address(league));
        emit LeagueScoring.DayFinalized(2);
        vm.expectEmit(true, true, false, true, address(league));
        emit LeagueCore.MarketVoided(id, key);
        league.void(id);

        _aliceCorrectDay(3, 3);
        // Day 2 is FINAL yet absent from ALICE's played days: 1 extends, 2 pauses, 3 extends.
        assertEq(league.streakOf(ALICE), 2);
    }

    /// The mixed day: the player's settled correct pick waits on a voided sibling. While
    /// the sibling is non-terminal the day pauses; void finalizes it and the fold picks
    /// the day up retroactively — the observable way void un-freezes a streak.
    function test_void_lastSiblingVoidFinalizesDayAndExtendsStreakRetroactively() public {
        _aliceCorrectDay(1, 1);

        (uint256 scoredId, MarketConfig memory scoredCfg) = _createOnDay(2);
        (uint256 voidedId, MarketConfig memory voidedCfg) = _createOnDay(2);
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, scoredId, 3, 10, 2, 10);
        _commitPickSet(scoredId, scoredCfg, picks);
        _resolveTo(scoredId, 231e14);
        _scoreAll(scoredId, picks);
        // The sibling missed its commit window entirely (still Created), so day 2 stays
        // provisional behind it — the exact freeze the Created -> Voided edge unfreezes.
        assertEq(league.streakOf(ALICE), 1);

        vm.warp(voidedCfg.voidDeadline + 1);
        vm.expectEmit(true, false, false, true, address(league));
        emit LeagueScoring.DayFinalized(2);
        league.void(voidedId);
        assertEq(league.streakOf(ALICE), 2);
    }

    /// One correct-scored single-market day for ALICE, keeping the signed utcDay prefix
    /// budget-honest across a multi-day fixture (the streak-suite idiom).
    function _aliceCorrectDay(uint32 leagueDay, uint32 nonce) private {
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, 3, 10, nonce, uint16(10 * (nonce - 1)));
        uint256 id = _readyOnDay(leagueDay, picks);
        _scoreAll(id, picks);
    }
}
