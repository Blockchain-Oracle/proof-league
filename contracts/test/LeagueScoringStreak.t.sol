// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Pick, MarketConfig} from "../src/LeagueCore.sol";
import {LeagueScoring} from "../src/LeagueScoring.sol";
import {ScoringTestBase} from "./helpers/ScoringTestBase.sol";

/// Story 2.5 ACs 3-4 — AD-16's deterministic aggregates: the order-independent streak
/// fold over finalized days (negative-tested for out-of-order finalization), day
/// completeness via the day-global market counters, and FR-19's min-commit-ordinal
/// tie-break key (negative-tested for the min rule under later commits).
contract LeagueScoringStreakTest is ScoringTestBase {
    /// One-market day for ALICE: correct (option 3 under value 231e14) or not, with the
    /// nonce/prefix sequence kept budget-honest across a multi-day fixture.
    function _aliceDay(uint32 leagueDay, bool correct, uint32 nonce) internal returns (uint256 id) {
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, correct ? 3 : 0, 10, nonce, uint16(10 * (nonce - 1)));
        id = _readyOnDay(leagueDay, picks);
        _scoreAll(id, picks);
    }

    function test_streak_extendsAcrossConsecutiveFinalizedDays() public {
        _aliceDay(1, true, 1);
        assertEq(league.streakOf(ALICE), 1);
        _aliceDay(2, true, 2);
        assertEq(league.streakOf(ALICE), 2);
    }

    function test_streak_breaksOnCorrectlessFinalizedDay() public {
        _aliceDay(1, true, 1);
        _aliceDay(2, false, 2);
        assertEq(league.streakOf(ALICE), 0);
        _aliceDay(3, true, 3);
        assertEq(league.streakOf(ALICE), 1);
    }

    /// AD-16: picks==0 pauses — a day the player never played is absent from the fold,
    /// so it neither extends nor breaks.
    function test_streak_unplayedDayPauses() public {
        _aliceDay(1, true, 1);
        _aliceDay(3, true, 2);
        assertEq(league.streakOf(ALICE), 2);
    }

    /// The out-of-order finalization negative test [review 2026-08-31]: day 3 finalizes
    /// while day 2 is still pending; when day 2 lands late as a break, the fold
    /// recomputes and the streak honestly drops.
    function test_streak_lateFinalizingMiddleDayRecomputesTheFold() public {
        _aliceDay(1, true, 1);
        // Day 2 exists (created, committed with ALICE's pick) but is not yet resolved.
        (uint256 pending, MarketConfig memory c) = _createOnDay(2);
        Pick[] memory day2 = new Pick[](1);
        day2[0] = _pick(ALICE, pending, 0, 10, 2, 10); // will score incorrect
        _commitPickSet(pending, c, day2);
        _aliceDay(3, true, 3);
        // Day 2 has no settled pick yet: the fold sees only days 1 and 3.
        assertEq(league.streakOf(ALICE), 2);

        _resolveTo(pending, 231e14);
        _scoreAll(pending, day2);
        assertEq(league.streakOf(ALICE), 1); // 1 correct, 2 break, 3 correct
    }

    /// The provisional-day lane: a played day with an unresolved sibling market pauses
    /// (never counts) until its last market turns terminal, then extends retroactively.
    function test_streak_provisionalPlayedDayPausesThenExtends() public {
        (uint256 scoredNow, MarketConfig memory a) = _createOnDay(1);
        (uint256 scoredLate, MarketConfig memory b) = _createOnDay(1);
        Pick[] memory now_ = new Pick[](1);
        now_[0] = _pick(ALICE, scoredNow, 3, 10, 1, 0);
        Pick[] memory late = new Pick[](1);
        late[0] = _pick(BOB, scoredLate, 3, 10, 1, 0);
        _commitPickSet(scoredNow, a, now_);
        _commitPickSet(scoredLate, b, late);
        _resolveTo(scoredNow, 231e14);
        _scoreAll(scoredNow, now_);
        _aliceDay(2, true, 2);
        // ALICE's day 1 pick settled correct, but day 1 still holds a pending market:
        // provisional days pause, so only day 2 counts.
        assertEq(league.dayMarketsOf(1).created, 2);
        assertEq(league.dayMarketsOf(1).terminal, 1);
        assertEq(league.streakOf(ALICE), 1);

        _resolveTo(scoredLate, 231e14);
        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(late);
        vm.expectEmit();
        emit LeagueScoring.DayFinalized(1);
        league.scoreBatch(scoredLate, 0, late, proofs, n, treeRoot);
        assertEq(league.streakOf(ALICE), 2);
    }

    /// A market created for an already-finalized day honestly re-opens it: the counters
    /// diverge again and the fold pauses the day until the newcomer is terminal — and
    /// DayFinalized RE-emits on the second finalization, or the projection's recompute
    /// cue dies and off-chain streaks go stale forever.
    function test_streak_dayReopenedByNewMarketTurnsProvisionalThenRefinalizes() public {
        _aliceDay(1, true, 1);
        assertEq(league.streakOf(ALICE), 1);
        (uint256 newcomer, MarketConfig memory c) = _createOnDay(1);
        assertEq(league.dayMarketsOf(1).created, 2);
        assertEq(league.dayMarketsOf(1).terminal, 1);
        assertEq(league.streakOf(ALICE), 0); // paused, not broken: recompute restores it later

        _commitPickSet(newcomer, c, new Pick[](0));
        _resolveTo(newcomer, 231e14);
        vm.expectEmit();
        emit LeagueScoring.DayFinalized(1);
        league.scoreBatch(newcomer, 0, new Pick[](0), new bytes32[][](0), 0, bytes32(0));
        assertEq(league.streakOf(ALICE), 1); // the pause was never a break
    }

    /// A day where the player's only pick was budget-skipped never enters the fold: the
    /// skip lanes run before any aggregate write, so the day pauses instead of breaking
    /// a live streak (a regression reordering those writes fails here).
    function test_streak_budgetSkippedOnlyDayPausesInsteadOfBreaking() public {
        _aliceDay(1, true, 1);
        Pick[] memory picks = new Pick[](1);
        picks[0] = _pick(ALICE, 0, 3, 10, 2, 95); // 95 + 10 > 100: skipped at settle
        uint256 id = _readyOnDay(2, picks);
        _scoreAll(id, picks);

        assertEq(league.dayMarketsOf(2).terminal, 1); // day 2 IS final, with no play
        assertEq(league.dayAggregateOf(ALICE, 2).picksCount, 0);
        assertEq(league.playedDaysOf(ALICE).length, 1);
        assertEq(league.streakOf(ALICE), 1);
    }

    /// FR-19 / AC 4 (critic G2): the recorded key is the MIN commit ordinal across the
    /// player's settled picks — scoring an earlier-committed market later must lower it.
    function test_ordinal_minRuleUnderLaterScoring() public {
        (uint256 first, MarketConfig memory a) = _createOnDay(1);
        (uint256 second, MarketConfig memory b) = _createOnDay(2);
        Pick[] memory onFirst = new Pick[](1);
        onFirst[0] = _pick(ALICE, first, 3, 10, 1, 0);
        Pick[] memory onSecond = new Pick[](1);
        onSecond[0] = _pick(ALICE, second, 3, 10, 2, 10);
        _commitPickSet(first, a, onFirst); // commit ordinal 1
        _commitPickSet(second, b, onSecond); // commit ordinal 2
        assertEq(league.commitOrdinalOf(first), 1);
        assertEq(league.commitOrdinalOf(second), 2);
        _resolveTo(first, 231e14);
        _resolveTo(second, 231e14);

        assertEq(league.earliestCommitOrdinalOf(ALICE), 0); // never scored yet
        _scoreAll(second, onSecond);
        assertEq(league.earliestCommitOrdinalOf(ALICE), 2);
        _scoreAll(first, onFirst);
        assertEq(league.earliestCommitOrdinalOf(ALICE), 1); // the min, not the latest
    }

    /// Skipped picks leave no tie-break trace: a tombstoned-out player has no
    /// commitment appearance on-chain (AD-16: unscored picks never surface).
    function test_ordinal_untouchedByFullySkippedPicks() public {
        Pick[] memory picks = new Pick[](2);
        picks[0] = _pick(ALICE, 0, 3, 10, 1, 0);
        picks[1] = _pick(ALICE, 0, 0, 0, 2, 0); // tombstone: the final word is a cancel
        uint256 id = _scoredReadyMarket(picks);
        _scoreAll(id, picks);
        assertEq(league.earliestCommitOrdinalOf(ALICE), 0);
    }
}
