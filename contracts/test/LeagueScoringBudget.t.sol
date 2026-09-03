// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Pick} from "../src/LeagueCore.sol";
import {ScoringTestBase} from "./helpers/ScoringTestBase.sol";

/// Story 2.5 AC 2 — AD-15's allowance cap at scoring: over-budget picks skip (never
/// revert), the skip choice is deterministic by the signed nonce-order prefix, and the
/// negative test proves interleaved cross-market batches cannot move it. Both scoring
/// orders run against identical fixtures; day attribution stays split across the two
/// keys (dailySpent by signed utcDay, aggregates by market leagueDay) throughout.
contract LeagueScoringBudgetTest is ScoringTestBase {
    /// One player, one signed utcDay, two markets: the nonce-2 pick's own signature
    /// (stakedSoFarInDay 60 + stake 60) breaches the allowance; the nonce-1 pick fits.
    function _twoMarketDay() internal returns (uint256 one, uint256 two) {
        Pick[] memory first = new Pick[](1);
        first[0] = _pick(ALICE, 0, 3, 60, 1, 0);
        one = _readyOnDay(1, first);
        Pick[] memory second = new Pick[](1);
        second[0] = _pick(ALICE, 0, 3, 60, 2, 60);
        two = _readyOnDay(2, second);
    }

    function _assertNonceTwoSkippedWhicheverOrder(uint256 one, uint256 two) internal view {
        // The nonce-1 stake paid (and won 60x5); the nonce-2 stake never spent.
        assertEq(league.seasonPointsOf(ALICE), 300);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 60);
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 1);
        assertEq(league.dayAggregateOf(ALICE, 2).picksCount, 0);
        (, bool oneScored) = league.scoringProgressOf(one);
        (, bool twoScored) = league.scoringProgressOf(two);
        assertTrue(oneScored && twoScored);
    }

    function test_budget_overClaimingPickSkips_marketOneScoredFirst() public {
        (uint256 one, uint256 two) = _twoMarketDay();
        Pick[] memory first = new Pick[](1);
        first[0] = _pick(ALICE, one, 3, 60, 1, 0);
        Pick[] memory second = new Pick[](1);
        second[0] = _pick(ALICE, two, 3, 60, 2, 60);
        _scoreAll(one, first);
        _scoreAll(two, second);
        _assertNonceTwoSkippedWhicheverOrder(one, two);
    }

    /// The AD-15 negative test [review 2026-08-31]: reversing which market's batch lands
    /// first must not change which stake skips — the decision reads only the signature.
    function test_budget_overClaimingPickSkips_marketTwoScoredFirst() public {
        (uint256 one, uint256 two) = _twoMarketDay();
        Pick[] memory first = new Pick[](1);
        first[0] = _pick(ALICE, one, 3, 60, 1, 0);
        Pick[] memory second = new Pick[](1);
        second[0] = _pick(ALICE, two, 3, 60, 2, 60);
        _scoreAll(two, second);
        _scoreAll(one, first);
        _assertNonceTwoSkippedWhicheverOrder(one, two);
    }

    /// A hostile commitment whose picks each lie stakedSoFarInDay=0 (sum 120 > 100 —
    /// the worker's sum rule refuses to commit this) still cannot pay past the
    /// allowance: the dailySpent backstop stops the second debit whatever the order.
    function test_budget_hostileOverBudgetSetNeverPaysPastAllowance() public {
        Pick[] memory first = new Pick[](1);
        first[0] = _pick(ALICE, 0, 3, 60, 1, 0);
        uint256 one = _readyOnDay(1, first);
        Pick[] memory second = new Pick[](1);
        second[0] = _pick(ALICE, 0, 3, 60, 2, 0); // the lie: claims a fresh day
        uint256 two = _readyOnDay(2, second);
        _scoreAll(one, first);
        _scoreAll(two, second);

        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 60);
        assertEq(league.seasonPointsOf(ALICE), 300); // one payout, never two
    }

    /// Same hostile shape, reversed scoring order: WHICH lie pays may flip (the set
    /// already forfeited determinism), but the cap itself never does.
    function test_budget_hostileOverBudgetSetCapHoldsInReverseOrder() public {
        Pick[] memory first = new Pick[](1);
        first[0] = _pick(ALICE, 0, 3, 60, 1, 0);
        uint256 one = _readyOnDay(1, first);
        Pick[] memory second = new Pick[](1);
        second[0] = _pick(ALICE, 0, 3, 60, 2, 0);
        uint256 two = _readyOnDay(2, second);
        _scoreAll(two, second);
        _scoreAll(one, first);

        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 60);
        assertEq(league.seasonPointsOf(ALICE), 300);
    }

    function test_budget_exactAllowanceBoundaryPays() public {
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, 3, 60, 1, 40); // 40 + 60 == 100: inclusive edge pays
        uint256 id = _scoredReadyMarket(picks);
        _scoreAll(id, picks);
        assertEq(league.seasonPointsOf(ALICE), 300);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 60);
    }

    function test_budget_onePastAllowanceSkips() public {
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, 3, 60, 1, 41); // 41 + 60 == 101: skipped, not reverted
        uint256 id = _scoredReadyMarket(picks);
        _scoreAll(id, picks);
        assertEq(league.seasonPointsOf(ALICE), 0);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 0);
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 0);
        (, bool fullyScored) = league.scoringProgressOf(id);
        assertTrue(fullyScored); // the skip lane never blocks the set
    }

    function test_budget_singleStakeAboveAllowanceSkips() public {
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, 3, 101, 1, 0);
        uint256 id = _scoredReadyMarket(picks);
        _scoreAll(id, picks);
        assertEq(league.seasonPointsOf(ALICE), 0);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 0);
    }
}
