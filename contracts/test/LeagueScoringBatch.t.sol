// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueCore, Pick, MarketConfig} from "../src/LeagueCore.sol";
import {LeagueScoring} from "../src/LeagueScoring.sol";
import {ScoringTestBase} from "./helpers/ScoringTestBase.sol";

/// Story 2.5 AC 1 — the exactly-once cursor machine (AD-4/AD-16): contiguous-only
/// batches, no-op on fully scored, and the skip lanes (supersession, tombstone,
/// out-of-order, foreign-market) that keep committed CONTENT from ever wedging the
/// cursor. Negative tests cover repeated, interleaved and skip-ahead calls per AD-4.
contract LeagueScoringBatchTest is ScoringTestBase {
    function _threePlayerSet() internal pure returns (Pick[] memory picks) {
        picks = new Pick[](3);
        picks[0] = _pick(ALICE, 0, 3, 40, 1, 0); // correct under value 231e14
        picks[1] = _pick(BOB, 0, 0, 60, 1, 0); // incorrect
        picks[2] = _pick(CARA, 0, 3, 20, 1, 0); // correct
    }

    function test_scoreBatch_singleBatchScoresEveryFinalPick() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(all);

        // The full event payloads are pinned, not just end-state: AD-8's projection and
        // `pnpm rebuild` consume the EVENTS, so a wrong utcDay/points/correct field
        // would corrupt the off-chain plane while every view still read right.
        vm.expectEmit();
        emit LeagueScoring.PickScored(id, 0, ALICE, 3, 40, UTC_DAY, true, 200);
        vm.expectEmit();
        emit LeagueScoring.PickScored(id, 1, BOB, 0, 60, UTC_DAY, false, 0);
        vm.expectEmit();
        emit LeagueScoring.PickScored(id, 2, CARA, 3, 20, UTC_DAY, true, 100);
        vm.expectEmit();
        emit LeagueScoring.MarketFullyScored(id);
        league.scoreBatch(id, 0, all, proofs, n, treeRoot);

        (uint256 cursor, bool fullyScored) = league.scoringProgressOf(id);
        assertEq(cursor, 3);
        assertTrue(fullyScored);
        // Gross return = stake x N (payout law): the baseline market has 5 options.
        assertEq(league.seasonPointsOf(ALICE), 200);
        assertEq(league.seasonPointsOf(BOB), 0);
        assertEq(league.seasonPointsOf(CARA), 100);
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 1);
        assertEq(league.dayAggregateOf(ALICE, 1).correctCount, 1);
        assertEq(league.dayAggregateOf(BOB, 1).picksCount, 1);
        assertEq(league.dayAggregateOf(BOB, 1).correctCount, 0);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 40);
        assertEq(league.dailySpentOf(BOB, UTC_DAY), 60);
    }

    function _threePlayerSet_withId(uint256 id) internal pure returns (Pick[] memory picks) {
        picks = _threePlayerSet();
        for (uint256 i = 0; i < picks.length; i++) {
            picks[i].marketId = id;
        }
    }

    function test_scoreBatch_onlyResolvedMarketsScore() public {
        Pick[] memory none = new Pick[](0);
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.scoreBatch(99, 0, none, new bytes32[][](0), 0, bytes32(0));

        (uint256 created,) = _createdMarket();
        vm.expectRevert(LeagueCore.MarketNotScorable.selector);
        league.scoreBatch(created, 0, none, new bytes32[][](0), 0, bytes32(0));

        (uint256 committed,) = _committedMarket();
        vm.expectRevert(LeagueCore.MarketNotScorable.selector);
        league.scoreBatch(committed, 0, none, new bytes32[][](0), 0, bytes32(0));
    }

    /// AD-4 [review 2026-08-31]: below-cursor replays and skip-ahead batches both die on
    /// the one contiguity check, so no intermediate player's leaf can be stranded.
    function test_scoreBatch_repeatAndSkipAheadRejected() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        _scoreSlice(id, all, 0, 2);

        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(all);
        Pick[] memory one = new Pick[](1);
        bytes32[][] memory oneProof = new bytes32[][](1);
        // Replay from 0 and replay of leaf 1: both below the cursor.
        for (uint256 start = 0; start < 2; start++) {
            one[0] = all[start];
            oneProof[0] = proofs[start];
            vm.expectRevert(LeagueScoring.NonContiguousBatch.selector);
            league.scoreBatch(id, start, one, oneProof, n, treeRoot);
        }
        // Cursor is 2, so 2 is the only legal start; "one past the end" is rejected too.
        vm.expectRevert(LeagueScoring.NonContiguousBatch.selector);
        league.scoreBatch(id, 3, new Pick[](0), new bytes32[][](0), n, treeRoot);

        // MarketFullyScored fires on the FINAL slice only — the earlier slices above
        // emitted PickScored without it (expectEmit would have flagged a stray finish).
        one[0] = all[2];
        oneProof[0] = proofs[2];
        vm.expectEmit();
        emit LeagueScoring.MarketFullyScored(id);
        league.scoreBatch(id, 2, one, oneProof, n, treeRoot);
        (, bool fullyScored) = league.scoringProgressOf(id);
        assertTrue(fullyScored);
    }

    function test_scoreBatch_interleavedBatchesAcrossMarketsBothComplete() public {
        Pick[] memory setOne = _threePlayerSet();
        uint256 one = _readyOnDay(1, setOne);
        Pick[] memory setTwo = new Pick[](2);
        setTwo[0] = _pick(ALICE, 0, 3, 10, 2, 40);
        setTwo[1] = _pick(BOB, 0, 1, 10, 2, 60);
        uint256 two = _readyOnDay(2, setTwo);

        _scoreSlice(one, setOne, 0, 1);
        _scoreSlice(two, setTwo, 0, 1);
        _scoreSlice(one, setOne, 1, 2);
        _scoreSlice(two, setTwo, 1, 1);

        (, bool oneScored) = league.scoringProgressOf(one);
        (, bool twoScored) = league.scoringProgressOf(two);
        assertTrue(oneScored);
        assertTrue(twoScored);
        // ALICE: 40x5 on market one + 10x5 on market two — interleaving never double-scores.
        assertEq(league.seasonPointsOf(ALICE), 250);
    }

    /// AD-4: a late duplicate submission burns gas, never reverts a worker pipeline —
    /// and mints nothing twice (the exactly-once AC's other half).
    function test_scoreBatch_fullyScoredNoOpsWithoutDoubleMint() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        _scoreAll(id, all);
        uint256 pointsBefore = league.seasonPointsOf(ALICE);

        _scoreAll(id, all);
        // Even a malformed re-run no-ops before any shape check can revert.
        league.scoreBatch(id, 7, new Pick[](0), new bytes32[][](0), 999, bytes32("junk"));

        assertEq(league.seasonPointsOf(ALICE), pointsBefore);
        (uint256 cursor,) = league.scoringProgressOf(id);
        assertEq(cursor, 3);
        // A re-run of the finish path would over-increment terminal and permanently
        // un-finalize the day after any later reopen — pinned to exactly one.
        assertEq(league.dayMarketsOf(1).terminal, 1);
    }

    function test_scoreBatch_openingMustMatchCommittedRoot() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        bytes32[] memory leaves = _leavesOf(all);
        Pick[] memory batch = new Pick[](1);
        batch[0] = all[0];
        bytes32[][] memory proofs = new bytes32[][](1);
        proofs[0] = _proofFor(leaves, 0);

        // A lying leafCount would move the cursor's finish line; the size-bound root refuses it.
        vm.expectRevert(LeagueScoring.CommitmentOpeningMismatch.selector);
        league.scoreBatch(id, 0, batch, proofs, all.length + 1, _treeRootOf(leaves));
        vm.expectRevert(LeagueScoring.CommitmentOpeningMismatch.selector);
        league.scoreBatch(id, 0, batch, proofs, all.length, bytes32("not the tree"));
    }

    function test_scoreBatch_invalidProofRejected() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        bytes32[] memory leaves = _leavesOf(all);
        Pick[] memory batch = new Pick[](1);
        batch[0] = all[0];
        bytes32[][] memory proofs = new bytes32[][](1);
        // A valid proof for the WRONG index: position binding must refuse it, or the
        // cursor could be fed any leaf at any slot.
        proofs[0] = _proofFor(leaves, 1);
        vm.expectRevert(LeagueScoring.InvalidPickProof.selector);
        league.scoreBatch(id, 0, batch, proofs, all.length, _treeRootOf(leaves));
    }

    function test_scoreBatch_shapeAndRangeGuards() public {
        uint256 id = _scoredReadyMarket(_threePlayerSet());
        Pick[] memory all = _threePlayerSet_withId(id);
        bytes32[] memory leaves = _leavesOf(all);
        Pick[] memory batch = new Pick[](1);
        batch[0] = all[0];
        vm.expectRevert(LeagueScoring.BatchShapeMismatch.selector);
        league.scoreBatch(id, 0, batch, new bytes32[][](2), all.length, _treeRootOf(leaves));

        Pick[] memory tooMany = new Pick[](4);
        vm.expectRevert(LeagueScoring.BatchBeyondSet.selector);
        league.scoreBatch(id, 0, tooMany, new bytes32[][](4), all.length, _treeRootOf(leaves));
    }

    /// Latest nonce wins (AD-5) — including when the player's run is split across a
    /// batch boundary, the exact seam the one-slot holdover exists for.
    function test_scoreBatch_supersededNonceNeverScores_acrossBatchBoundary() public {
        Pick[] memory picks = new Pick[](3);
        picks[0] = _pick(ALICE, 0, 0, 30, 1, 0); // replaced: wrong option, small stake
        picks[1] = _pick(ALICE, 0, 3, 40, 2, 0); // final word: correct
        picks[2] = _pick(BOB, 0, 0, 60, 1, 0);
        uint256 id = _scoredReadyMarket(picks);
        Pick[] memory all = picks; // marketIds were patched in place by _readyOnDay

        _scoreSlice(id, all, 0, 1); // batch ends mid-run: ALICE nonce 1 is only held
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 0);

        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(all);
        Pick[] memory rest = new Pick[](2);
        rest[0] = all[1];
        rest[1] = all[2];
        bytes32[][] memory restProofs = new bytes32[][](2);
        restProofs[0] = proofs[1];
        restProofs[1] = proofs[2];
        // The subtlest emit in the machine, pinned: the skip fires while consuming leaf
        // 1 but must carry the HELD leaf's index 0, or every rebuild reads the wrong pick.
        vm.expectEmit();
        emit LeagueScoring.PickSkipped(id, 0, ALICE, LeagueScoring.SkipReason.Superseded);
        league.scoreBatch(id, 1, rest, restProofs, n, treeRoot);

        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 1);
        assertEq(league.seasonPointsOf(ALICE), 200); // the nonce-2 stake, not 30x5
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 40); // never both stakes
    }

    function test_scoreBatch_tombstoneCancelsThePick() public {
        Pick[] memory picks = new Pick[](2);
        picks[0] = _pick(ALICE, 0, 3, 30, 1, 0);
        picks[1] = _pick(ALICE, 0, 0, 0, 2, 0); // signed cancellation (AD-5)
        uint256 id = _scoredReadyMarket(picks);
        _scoreAll(id, picks);

        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 0);
        assertEq(league.seasonPointsOf(ALICE), 0);
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 0);
        assertEq(league.playedDaysOf(ALICE).length, 0);
        (, bool fullyScored) = league.scoringProgressOf(id);
        assertTrue(fullyScored); // a cancelled-out set still fully scores
    }

    /// The malformed-content lane: a leaf violating the committed sort costs itself,
    /// never the set — the market still reaches fully-scored (AD-16's anti-wedge rule).
    function test_scoreBatch_outOfOrderLeafSkippedAndSetCompletes() public {
        (uint256 id, MarketConfig memory c) = _createOnDay(1);
        Pick[] memory picks = new Pick[](2);
        picks[0] = _pick(BOB, id, 3, 60, 1, 0);
        picks[1] = _pick(ALICE, id, 3, 40, 1, 0); // ALICE < BOB: out of order
        _commitPickSet(id, c, picks);
        _resolveTo(id, 231e14);

        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(picks);
        vm.expectEmit();
        emit LeagueScoring.PickSkipped(id, 1, ALICE, LeagueScoring.SkipReason.OutOfOrder);
        league.scoreBatch(id, 0, picks, proofs, n, treeRoot);

        assertEq(league.seasonPointsOf(BOB), 300);
        assertEq(league.seasonPointsOf(ALICE), 0);
        (, bool fullyScored) = league.scoringProgressOf(id);
        assertTrue(fullyScored);
    }

    /// A leaf signed for a DIFFERENT market can never be judged against this market's
    /// Resolution, however it got committed here.
    function test_scoreBatch_foreignMarketLeafSkipped() public {
        (uint256 id, MarketConfig memory c) = _createOnDay(1);
        Pick[] memory picks = new Pick[](2);
        picks[0] = _pick(ALICE, id, 3, 40, 1, 0);
        picks[1] = _pick(BOB, 999, 3, 60, 1, 0); // signed for market 999
        _commitPickSet(id, c, picks);
        _resolveTo(id, 231e14);

        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(picks);
        vm.expectEmit();
        emit LeagueScoring.PickSkipped(id, 1, BOB, LeagueScoring.SkipReason.ForeignMarket);
        league.scoreBatch(id, 0, picks, proofs, n, treeRoot);

        assertEq(league.seasonPointsOf(ALICE), 200);
        assertEq(league.seasonPointsOf(BOB), 0);
    }

    /// The sort-violation concession, pinned [review 2026-09-03]: on a worker-corrupted
    /// set [ALICE n2, BOB n1, ALICE n3], BOB's in-order leaf displaces and SETTLES the
    /// held stale ALICE n2, and the true final word n3 then skips OutOfOrder — the
    /// violating shape costs a different leaf its supersession. Deterministic and
    /// rebuild-reproducible; latest-nonce-wins is guaranteed only on sort-honest sets.
    function test_scoreBatch_sortViolatingSetSettlesStaleWordDeterministically() public {
        (uint256 id, MarketConfig memory c) = _createOnDay(1);
        Pick[] memory picks = new Pick[](3);
        picks[0] = _pick(ALICE, id, 3, 30, 2, 0);
        picks[1] = _pick(BOB, id, 0, 10, 1, 0);
        picks[2] = _pick(ALICE, id, 3, 50, 3, 0); // the real final word, mis-sorted
        _commitPickSet(id, c, picks);
        _resolveTo(id, 231e14);

        (bytes32[][] memory proofs, uint256 n, bytes32 treeRoot) = _preparedBatch(picks);
        vm.expectEmit();
        emit LeagueScoring.PickSkipped(id, 2, ALICE, LeagueScoring.SkipReason.OutOfOrder);
        league.scoreBatch(id, 0, picks, proofs, n, treeRoot);

        assertEq(league.seasonPointsOf(ALICE), 150); // stale n2 paid; n3's 250 never minted
        assertEq(league.dailySpentOf(ALICE, UTC_DAY), 30);
        assertEq(league.dayAggregateOf(ALICE, 1).picksCount, 1);
        (, bool fullyScored) = league.scoringProgressOf(id);
        assertTrue(fullyScored);
    }

    /// The canonical empty commitment (AD-14): zero-pick markets finalize on one empty,
    /// correctly-opened call — and only the empty opening is accepted.
    function test_scoreBatch_emptyRootFinalizesOnEmptyOpening() public {
        (uint256 id, MarketConfig memory c) = _createOnDay(1);
        _commitPickSet(id, c, new Pick[](0));
        _resolveTo(id, 231e14);

        vm.expectRevert(LeagueScoring.CommitmentOpeningMismatch.selector);
        league.scoreBatch(id, 0, new Pick[](0), new bytes32[][](0), 1, bytes32("tree"));

        vm.expectEmit();
        emit LeagueScoring.MarketFullyScored(id);
        league.scoreBatch(id, 0, new Pick[](0), new bytes32[][](0), 0, bytes32(0));
        assertEq(league.dayMarketsOf(1).terminal, 1);
    }
}
