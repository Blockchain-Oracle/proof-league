// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueCore} from "../src/LeagueCore.sol";
import {LeagueSeasonSurface, SeasonParams} from "../src/LeagueSeason.sol";
import {MarketConfig, Pick} from "../src/LeagueTypes.sol";
import {ScoringTestBase} from "./helpers/ScoringTestBase.sol";

/// Story 2.10 — the claim-based Season payout (FR-19/FR-20, AD-17). Players earn their
/// keys through the REAL scoring edge (commit -> resolve -> scoreBatch), never storage
/// forcing, so every comparator input the candidate calculus reads is one the shipped
/// machine actually wrote. Baseline market: payoutN 5, option 3 correct — a correct
/// stake s pays s*5 Season Points.
contract LeagueSeasonPayoutTest is ScoringTestBase {
    uint256 internal constant POOL = 1000 ether;

    // ---- fixtures -------------------------------------------------------------------

    /// One day-1 market, one pick each: stake 0 means the player sits out entirely.
    function _scoredTrio(uint16 aliceStake, bool aliceCorrect, uint16 bobStake, bool bobCorrect, uint16 caraStake)
        internal
    {
        uint256 count = (aliceStake > 0 ? 1 : 0) + (bobStake > 0 ? 1 : 0) + (caraStake > 0 ? 1 : 0);
        Pick[] memory picks = new Pick[](count);
        uint256 i;
        // Committed sort is (player asc, nonce asc): ALICE < BOB < CARA by fixture design.
        if (aliceStake > 0) picks[i++] = _pick(ALICE, 0, aliceCorrect ? 3 : 0, aliceStake, 1, 0);
        if (bobStake > 0) picks[i++] = _pick(BOB, 0, bobCorrect ? 3 : 0, bobStake, 1, 0);
        // CARA is the suite's designated loser: option 0 never wins the baseline market.
        if (caraStake > 0) picks[i++] = _pick(CARA, 0, 0, caraStake, 1, 0);
        uint256 id = _readyOnDay(1, picks);
        _scoreAll(id, picks);
    }

    function _fundPool(uint256 amount) internal {
        vm.deal(ESCROW, amount);
        vm.prank(ESCROW);
        league.fundSeason{value: amount}();
    }

    function _pastSeasonEnd() internal {
        vm.warp(uint256(SEASON_END) + 1);
    }

    function _submit(address first, address second, address third) internal {
        league.submitSeasonCandidate([first, second, third]);
    }

    function _expectSubmitRevert(bytes4 selector, address first, address second, address third) internal {
        vm.expectRevert(selector);
        league.submitSeasonCandidate([first, second, third]);
    }

    // ---- AC: params immutable at deployment, pool readable, escrow-funded -----------

    function test_constructor_refusesBrokenSeasonParams() public {
        address[] memory creators = new address[](1);
        creators[0] = OPERATOR;
        vm.expectRevert(LeagueSeasonSurface.InvalidSeasonParams.selector);
        new LeagueCore(creators, SeasonParams({seasonEnd: SEASON_END, seasonEndDay: 100, escrow: address(0)}));
        vm.expectRevert(LeagueSeasonSurface.InvalidSeasonParams.selector);
        new LeagueCore(creators, SeasonParams({seasonEnd: SEASON_END, seasonEndDay: 0, escrow: ESCROW}));
        // A season already over at deployment could never accept a claim honestly.
        vm.expectRevert(LeagueSeasonSurface.InvalidSeasonParams.selector);
        new LeagueCore(creators, SeasonParams({seasonEnd: T0, seasonEndDay: 100, escrow: ESCROW}));
    }

    function test_fundSeason_escrowOnlyOnceNonzeroBeforeEnd() public {
        vm.deal(STRANGER, 1 ether);
        vm.prank(STRANGER);
        vm.expectRevert(LeagueSeasonSurface.NotSeasonEscrow.selector);
        league.fundSeason{value: 1 ether}();

        vm.prank(ESCROW);
        vm.expectRevert(LeagueSeasonSurface.ZeroSeasonFunding.selector);
        league.fundSeason();

        _fundPool(POOL);
        assertEq(league.seasonPool(), POOL);

        // Re-funding would move a pool players already saw (FR-20's always-visible law).
        vm.deal(ESCROW, 1 ether);
        vm.prank(ESCROW);
        vm.expectRevert(LeagueSeasonSurface.SeasonAlreadyFunded.selector);
        league.fundSeason{value: 1 ether}();
    }

    function test_fundSeason_closesAfterSeasonEnd() public {
        _pastSeasonEnd();
        vm.deal(ESCROW, 1 ether);
        vm.prank(ESCROW);
        vm.expectRevert(LeagueSeasonSurface.SeasonFundingClosed.selector);
        league.fundSeason{value: 1 ether}();
    }

    // ---- AC negative: early trigger -------------------------------------------------

    function test_submit_revertsThroughSeasonEndItself() public {
        _scoredTrio(10, true, 5, true, 10);
        // At the second itself the season still lives — the void-clock edge, seasonized.
        vm.warp(SEASON_END);
        _expectSubmitRevert(LeagueSeasonSurface.SeasonNotOver.selector, ALICE, address(0), address(0));
    }

    // ---- AC negative: claims while any season market is non-terminal ----------------

    function test_submit_gatedUntilEverySeasonMarketIsTerminal_voidUnblocks() public {
        _scoredTrio(10, true, 5, true, 10);
        // A second season-day market left Created: the gate must hold the whole claim
        // machine shut — this is the AD-19 -> AD-17 liveness handoff in one test.
        (uint256 stuckId,) = _createOnDay(2);
        _pastSeasonEnd();
        _expectSubmitRevert(LeagueSeasonSurface.SeasonMarketsNotTerminal.selector, ALICE, address(0), address(0));
        // Permissionless void (2.6) is exactly what un-blocks the season.
        league.void(stuckId);
        _submit(ALICE, address(0), address(0));
        (address[3] memory stored,) = league.seasonCandidate();
        assertEq(stored[0], ALICE);
    }

    // ---- AC: post-season markets never gate; season-day creation closes -------------

    function test_postSeasonDayMarketNeverGatesAndSeasonDayCreationCloses() public {
        _scoredTrio(10, true, 5, true, 10);
        _pastSeasonEnd();
        // AD-21 pre-extends Hosted Rounds past seasonEnd: a market above seasonEndDay
        // mints fine after the end and, left non-terminal, never holds the payout.
        (uint256 postSeasonId,) = _createOnDay(SEASON_END_DAY + 1);
        assertEq(uint256(league.stateOf(postSeasonId)), 0); // Created, and irrelevant
        // A season-day market after the end could re-open settled standings: refused.
        // Config built before prank/expectRevert — _validConfig's MIN_COMMIT_MARGIN
        // read is an external call that would consume both cheatcodes (base footgun).
        MarketConfig memory config = _validConfig();
        config.leagueDay = 1;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueSeasonSurface.SeasonDayAfterSeasonEnd.selector);
        league.createMarket(config);
        _submit(ALICE, address(0), address(0));
    }

    // ---- candidate validation: eligibility, order, duplicates, holes ----------------

    function test_submit_rejectsPlayersWithoutPoints() public {
        _scoredTrio(10, true, 5, true, 10);
        _pastSeasonEnd();
        // CARA played and lost: zero points is ineligible, exactly like never playing.
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotEligible.selector, CARA, address(0), address(0));
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotEligible.selector, STRANGER, address(0), address(0));
    }

    function test_submit_rejectsMisorderDuplicatesAndHoles() public {
        _scoredTrio(10, true, 5, true, 10); // ALICE 50 > BOB 25
        _pastSeasonEnd();
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, BOB, ALICE, address(0));
        // The total order is strict, so a == a beats nothing: duplicates fail for free.
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, ALICE, ALICE, address(0));
        // A zero hole would hide a winner mid-list.
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, ALICE, address(0), BOB);
    }

    // ---- the FR-19 comparator, pinned through ordering acceptance -------------------

    function test_order_streakBreaksAPointsTie() public {
        // Same 50 points each: ALICE as 25+25 across two days (streak 2), BOB as one
        // 50-point day (streak 1). Streak is the second key, so ALICE leads.
        Pick[] memory day1 = new Pick[](2);
        day1[0] = _pick(ALICE, 0, 3, 5, 1, 0);
        day1[1] = _pick(BOB, 0, 3, 10, 1, 0);
        uint256 first = _readyOnDay(1, day1);
        _scoreAll(first, day1);
        Pick[] memory day2 = new Pick[](1);
        day2[0] = _pick(ALICE, 0, 3, 5, 2, 5);
        uint256 second = _readyOnDay(2, day2);
        _scoreAll(second, day2);
        assertEq(league.seasonPointsOf(ALICE), league.seasonPointsOf(BOB));
        _pastSeasonEnd();
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, BOB, ALICE, address(0));
        _submit(ALICE, BOB, address(0));
    }

    function test_order_earliestOrdinalBreaksAStreakTie() public {
        // Identical points and streaks; BOB's market committed first (ordinal 1) vs
        // ALICE's (ordinal 2), so the third key puts BOB ahead despite the higher address.
        Pick[] memory onFirst = new Pick[](1);
        onFirst[0] = _pick(BOB, 0, 3, 10, 1, 0);
        Pick[] memory onSecond = new Pick[](1);
        onSecond[0] = _pick(ALICE, 0, 3, 10, 1, 0);
        uint256 first = _readyOnDay(1, onFirst);
        uint256 second = _readyOnDay(1, onSecond);
        _scoreAll(first, onFirst);
        _scoreAll(second, onSecond);
        _pastSeasonEnd();
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, ALICE, BOB, address(0));
        _submit(BOB, ALICE, address(0));
    }

    function test_order_addressAscIsTheFinalKey() public {
        // Every prior key equal (same market, same stake, same day): the address total
        // order decides, so no tie is representable (FR-19).
        Pick[] memory picks = new Pick[](2);
        picks[0] = _pick(ALICE, 0, 3, 10, 1, 0);
        picks[1] = _pick(BOB, 0, 3, 10, 1, 0);
        uint256 id = _readyOnDay(1, picks);
        _scoreAll(id, picks);
        _pastSeasonEnd();
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotOrdered.selector, BOB, ALICE, address(0));
        _submit(ALICE, BOB, address(0));
    }

    // ---- the challenge window -------------------------------------------------------

    function test_challenge_superiorDisplacesInferiorWindowFixed() public {
        _scoredTrio(10, true, 5, true, 10);
        _pastSeasonEnd();
        vm.prank(STRANGER);
        _submit(BOB, address(0), address(0)); // wrong but internally valid
        (, uint64 windowEndsAt) = league.seasonCandidate();
        // forge-lint: disable-next-line(block-timestamp)
        assertEq(windowEndsAt, uint64(block.timestamp) + league.SEASON_CHALLENGE_WINDOW());

        // Filling slot 0 with the true leader and slot 1 with a new eligible name is
        // superior at the first differing index.
        _submit(ALICE, BOB, address(0));
        (address[3] memory stored, uint64 windowAfter) = league.seasonCandidate();
        assertEq(stored[0], ALICE);
        assertEq(stored[1], BOB);
        // A replacement never extends the window — no grief-stretch past judging.
        assertEq(windowAfter, windowEndsAt);

        // The displaced candidate cannot ping-pong back.
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotSuperior.selector, BOB, address(0), address(0));
        // Equal resubmission is not superior either.
        _expectSubmitRevert(LeagueSeasonSurface.CandidateNotSuperior.selector, ALICE, BOB, address(0));
    }

    function test_challenge_windowExpiryClosesSubmissions() public {
        _scoredTrio(10, true, 5, true, 10);
        _pastSeasonEnd();
        _submit(BOB, address(0), address(0));
        (, uint64 windowEndsAt) = league.seasonCandidate();
        // Expiry belongs to finalize (inclusive there, exclusive here): at the boundary
        // second a submission is already too late.
        vm.warp(windowEndsAt);
        _expectSubmitRevert(LeagueSeasonSurface.ChallengeWindowClosed.selector, ALICE, BOB, address(0));
    }

    // ---- finalize: splits, dust, double-pay, early, no-candidate --------------------

    function _finalizedWith(address first, address second, address third) internal {
        _pastSeasonEnd();
        _submit(first, second, third);
        (, uint64 windowEndsAt) = league.seasonCandidate();
        vm.warp(windowEndsAt);
        league.finalizeSeasonPayout();
    }

    function test_finalize_threeWinnerSplitAndWithdrawals() public {
        _fundPool(POOL);
        // CARA earns real points this time (stake 2 correct = 10): full podium.
        Pick[] memory picks = new Pick[](3);
        picks[0] = _pick(ALICE, 0, 3, 10, 1, 0);
        picks[1] = _pick(BOB, 0, 3, 5, 1, 0);
        picks[2] = _pick(CARA, 0, 3, 2, 1, 0);
        uint256 id = _readyOnDay(1, picks);
        _scoreAll(id, picks);
        _finalizedWith(ALICE, BOB, CARA);

        assertEq(league.seasonClaimableOf(ALICE), 500 ether);
        assertEq(league.seasonClaimableOf(BOB), 300 ether);
        assertEq(league.seasonClaimableOf(CARA), 200 ether);
        assertEq(league.seasonClaimableOf(ESCROW), 0);

        vm.prank(BOB);
        league.withdrawSeasonPayout();
        assertEq(BOB.balance, 300 ether);
        assertEq(league.seasonClaimableOf(BOB), 0);
        vm.prank(BOB);
        vm.expectRevert(LeagueSeasonSurface.NothingToWithdraw.selector);
        league.withdrawSeasonPayout();
    }

    function test_finalize_twoWinnerSplitReturnsUnfilledShareToEscrow() public {
        _fundPool(POOL);
        _scoredTrio(10, true, 5, true, 10); // CARA pointless: two eligible winners
        _finalizedWith(ALICE, BOB, address(0));
        assertEq(league.seasonClaimableOf(ALICE), 500 ether);
        assertEq(league.seasonClaimableOf(BOB), 300 ether);
        assertEq(league.seasonClaimableOf(ESCROW), 200 ether);
    }

    function test_finalize_oneWinnerSplitReturnsHalfToEscrow() public {
        _fundPool(POOL);
        _scoredTrio(10, true, 5, false, 10);
        _finalizedWith(ALICE, address(0), address(0));
        assertEq(league.seasonClaimableOf(ALICE), 500 ether);
        assertEq(league.seasonClaimableOf(ESCROW), 500 ether);
    }

    function test_finalize_zeroWinnersReturnsEverythingToEscrow() public {
        _fundPool(POOL);
        _scoredTrio(10, false, 5, false, 10); // everyone lost: an all-zero candidate
        _finalizedWith(address(0), address(0), address(0));
        assertEq(league.seasonClaimableOf(ESCROW), POOL);
        vm.prank(ESCROW);
        league.withdrawSeasonPayout();
        assertEq(ESCROW.balance, POOL);
    }

    function test_finalize_integerDustCreditsEscrow() public {
        // 10_001 wei: shares truncate to 5000/3000/2000 and the 1-wei dust must land in
        // escrow — the pool always fully accounts, nothing strands in the contract.
        _fundPool(10_001);
        _scoredTrio(10, true, 5, true, 10);
        _finalizedWith(ALICE, BOB, address(0));
        assertEq(league.seasonClaimableOf(ALICE), 5000);
        assertEq(league.seasonClaimableOf(BOB), 3000);
        assertEq(league.seasonClaimableOf(ESCROW), 2000 + 1);
    }

    function test_finalize_revertsEarlyWithoutCandidateAndOnDoublePay() public {
        _scoredTrio(10, true, 5, true, 10);
        _pastSeasonEnd();
        vm.expectRevert(LeagueSeasonSurface.NoCandidate.selector);
        league.finalizeSeasonPayout();

        _submit(ALICE, BOB, address(0));
        vm.expectRevert(LeagueSeasonSurface.ChallengeWindowOpen.selector);
        league.finalizeSeasonPayout();

        (, uint64 windowEndsAt) = league.seasonCandidate();
        vm.warp(windowEndsAt);
        league.finalizeSeasonPayout();
        assertTrue(league.seasonPaid());
        vm.expectRevert(LeagueSeasonSurface.SeasonAlreadyPaid.selector);
        league.finalizeSeasonPayout();
        // The claim machine is fully shut after payment, not just the payer.
        _expectSubmitRevert(LeagueSeasonSurface.SeasonAlreadyPaid.selector, ALICE, BOB, address(0));
    }

    // ---- AD-17 hardening 3: one reverting recipient blocks only itself --------------

    function test_withdraw_revertingRecipientCannotBlockOthers() public {
        _fundPool(POOL);
        RejectingWinner rejector = new RejectingWinner();
        // The rejector earns its podium spot through the real edge like everyone else
        // (scoreBatch pays whatever player address the committed leaf names).
        Pick[] memory own = new Pick[](1);
        own[0] = _pick(address(rejector), 0, 3, 10, 1, 0);
        uint256 first = _readyOnDay(1, own);
        _scoreAll(first, own);
        Pick[] memory alice = new Pick[](1);
        alice[0] = _pick(ALICE, 0, 3, 5, 1, 0);
        uint256 second = _readyOnDay(1, alice);
        _scoreAll(second, alice);

        _finalizedWith(address(rejector), ALICE, address(0));
        vm.expectRevert(LeagueSeasonSurface.WithdrawFailed.selector);
        rejector.pull(league);
        // The failed pull burned nothing: its balance survives for a future claim path,
        // and ALICE's withdrawal is untouched by the neighbor's revert.
        assertEq(league.seasonClaimableOf(address(rejector)), 500 ether);
        vm.prank(ALICE);
        league.withdrawSeasonPayout();
        assertEq(ALICE.balance, 300 ether);
    }
}

/// A winner whose receive() always reverts — the AD-17 pull-payment adversary.
contract RejectingWinner {
    error NoThanks();

    receive() external payable {
        revert NoThanks();
    }

    function pull(LeagueCore league) external {
        league.withdrawSeasonPayout();
    }
}
