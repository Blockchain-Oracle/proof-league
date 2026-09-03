// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueScoring} from "./LeagueScoring.sol";

/// The Season's full immutable parameterization, fixed at deployment (AD-17, FR-20).
/// verify:payout (Story 2.10) drives a minutes-long test Season on the SAME bytecode,
/// which is why these are constructor params and never constants.
struct SeasonParams {
    // Strictly after this chain time the claim machine opens (and season-day market
    // creation closes); at the second itself the season still lives (house clock law).
    uint64 seasonEnd;
    // The leagueDay ceiling: markets at or below it gate the payout. AD-21 deliberately
    // pre-extends Hosted Rounds past seasonEnd, so the gate must be day-scoped — a
    // post-season market can never hold the payout hostage.
    uint32 seasonEndDay;
    // The segregated fourth account (never a worker key, NFR-3): the only address that
    // can fund the pool, and the receiver of unfilled shares and integer dust.
    address escrow;
}

/// LeagueSeason — the Season surface of the core (Story 2.10, FR-19/FR-20, AD-17),
/// pre-split from LeagueCore.sol per CONVENTIONS §1 before the season machine could
/// push it past the 400-raw-line law. An abstract contract rather than a library
/// because it owns deployed surface: it hosts the scoring ledger's storage struct, the
/// ranking read surface (the exact on-chain keys the Leaderboard sorts by, AD-16), and
/// the claim-based payout machine — LeagueCore inherits it, so the deployed contract is
/// still one address with one storage space (AD-3's "exactly LeagueCore and
/// ProofGateway on Creditcoin" stands).
///
/// The payout machine is claim-based (AD-17): the contract never computes the top-3
/// itself — that would be the unbounded player loop AD-17 exists to prevent — it only
/// VERIFIES a submitted candidate in O(3) against its own scoring keys and lets the
/// challenge window make wrongness correctable by anyone. Superiority is decidable, so
/// the worker (or Abu on a phone — the documented permissionless fallback) can always
/// displace a wrong candidate before expiry. Payment is pull-based: expiry credits
/// claimable balances, winners withdraw individually, and one reverting recipient can
/// never block the rest.
abstract contract LeagueSeasonSurface {
    // Mirrors SEASON_CHALLENGE_WINDOW_SEC in packages/shared/src/time.ts (AD-17): long
    // enough for the automated watcher to displace a wrong candidate, short enough to
    // pay before judging ends.
    uint64 public constant SEASON_CHALLENGE_WINDOW = 6 hours;
    // FR-20's 50/30/20 split in basis points, structural like the payout law.
    uint256 public constant SHARE_BPS_DENOMINATOR = 10_000;

    error InvalidSeasonParams();
    error NotSeasonEscrow();
    error SeasonAlreadyFunded();
    error ZeroSeasonFunding();
    error SeasonFundingClosed();
    error SeasonDayAfterSeasonEnd();
    error SeasonNotOver();
    error SeasonMarketsNotTerminal();
    error CandidateNotEligible();
    error CandidateNotOrdered();
    error CandidateNotSuperior();
    error NoCandidate();
    error ChallengeWindowClosed();
    error ChallengeWindowOpen();
    error SeasonAlreadyPaid();
    error NothingToWithdraw();
    error WithdrawFailed();

    event SeasonFunded(uint256 pool);
    event SeasonCandidateSubmitted(address indexed submitter, address[3] candidates, uint64 windowEndsAt);
    event SeasonPayoutFinalized(address[3] candidates, uint256[3] amounts, uint256 escrowReturn);
    event SeasonPayoutWithdrawn(address indexed account, uint256 amount);

    uint64 public immutable seasonEnd;
    uint32 public immutable seasonEndDay;
    address public immutable seasonEscrow;

    // 0 until the one-time escrow funding — earlier development deploys run pool = 0
    // and the Leaderboard banner honestly renders chain state (AD-17).
    uint256 public seasonPool;
    // 0 = no candidate yet; set once by the FIRST submission and never extended, so a
    // last-second superior replacement cannot stretch the window past judging.
    uint64 public candidateWindowEndsAt;
    bool public seasonPaid;
    address[3] private _candidate;
    mapping(address => uint256) public seasonClaimableOf;

    // The O(1) all-terminal gate (AD-17 hardening 1): standings can never change after
    // payout because a claim is accepted only when these two agree. Season-scoped by
    // leagueDay at the note hooks, never a day loop.
    uint256 public seasonMarketsCreated;
    uint256 public seasonMarketsTerminal;

    // The scoring ledger lives here so the season machine and the read surface touch
    // the SAME storage the scoring engine writes — hosted by this surface, owned
    // behaviorally by LeagueScoring, assembled into contexts by LeagueCore.
    LeagueScoring.State internal _scoring;

    constructor(SeasonParams memory params) {
        // With no post-deploy mutator (AD-20), mis-wired season params would strand the
        // payout forever; the constructor is the only place to refuse them.
        // forge-lint: disable-next-line(block-timestamp)
        if (params.escrow == address(0) || params.seasonEndDay == 0 || params.seasonEnd <= block.timestamp) {
            revert InvalidSeasonParams();
        }
        seasonEnd = params.seasonEnd;
        seasonEndDay = params.seasonEndDay;
        seasonEscrow = params.escrow;
    }

    /// The one-time escrow funding (AD-17): escrow-only so the pool provably never
    /// came from a worker account (NFR-3), once so the displayed pool can never shrink
    /// or grow after players have seen it, and only while the season lives — funding
    /// after seasonEnd could change a payout already claimable.
    function fundSeason() external payable {
        if (msg.sender != seasonEscrow) revert NotSeasonEscrow();
        if (seasonPool != 0) revert SeasonAlreadyFunded();
        if (msg.value == 0) revert ZeroSeasonFunding();
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp > seasonEnd) revert SeasonFundingClosed();
        seasonPool = msg.value;
        emit SeasonFunded(msg.value);
    }

    /// Permissionless candidate claim (AD-17): any address submits a top-3 (zero-tail
    /// legal when fewer than three players are eligible); the contract verifies internal
    /// order against its own keys in O(3). The first submission opens the fixed
    /// challenge window; later submissions must be strictly superior — so the honest
    /// candidate always wins the window, whoever moved first.
    function submitSeasonCandidate(address[3] calldata candidates) external {
        if (seasonPaid) revert SeasonAlreadyPaid();
        // Strict: at seasonEnd itself the season still lives (the void-clock idiom).
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp <= seasonEnd) revert SeasonNotOver();
        if (seasonMarketsTerminal != seasonMarketsCreated) revert SeasonMarketsNotTerminal();
        _validateCandidate(candidates);
        if (candidateWindowEndsAt == 0) {
            // forge-lint: disable-start(block-timestamp)
            // forge-lint: disable-next-line(unsafe-typecast)
            candidateWindowEndsAt = uint64(block.timestamp) + SEASON_CHALLENGE_WINDOW;
            // forge-lint: disable-end(block-timestamp)
        } else {
            // Submissions own [open, windowEnd); expiry belongs to finalize — the
            // commit-window inclusive/exclusive law, so no instant is contested.
            // forge-lint: disable-next-line(block-timestamp)
            if (block.timestamp >= candidateWindowEndsAt) revert ChallengeWindowClosed();
            if (!_beatsCandidate(candidates, _candidate)) revert CandidateNotSuperior();
        }
        _candidate = candidates;
        emit SeasonCandidateSubmitted(msg.sender, candidates, candidateWindowEndsAt);
    }

    /// Expiry pays the standing candidate (AD-17): permissionless, once, pull-based.
    /// Unfilled shares (0/1/2 eligible winners) and integer dust credit the escrow —
    /// the pool always fully accounts, nothing strands.
    function finalizeSeasonPayout() external {
        if (seasonPaid) revert SeasonAlreadyPaid();
        if (candidateWindowEndsAt == 0) revert NoCandidate();
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < candidateWindowEndsAt) revert ChallengeWindowOpen();
        // Defense re-check: season-day creation is closed after seasonEnd by admission,
        // so this can only differ from submit-time if that guard ever regresses.
        if (seasonMarketsTerminal != seasonMarketsCreated) revert SeasonMarketsNotTerminal();
        seasonPaid = true;
        uint256[3] memory amounts;
        uint256 paidTotal;
        for (uint256 i = 0; i < 3; i++) {
            if (_candidate[i] == address(0)) continue;
            amounts[i] = (seasonPool * _shareBps(i)) / SHARE_BPS_DENOMINATOR;
            seasonClaimableOf[_candidate[i]] += amounts[i];
            paidTotal += amounts[i];
        }
        seasonClaimableOf[seasonEscrow] += seasonPool - paidTotal;
        emit SeasonPayoutFinalized(_candidate, amounts, seasonPool - paidTotal);
    }

    /// Pull-based withdrawal (AD-17 hardening 3): balance zeroed before the transfer
    /// (checks-effects-interactions), and a failed send reverts the whole call so the
    /// balance survives — one reverting recipient blocks only itself, never the rest.
    function withdrawSeasonPayout() external {
        uint256 amount = seasonClaimableOf[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        seasonClaimableOf[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
        emit SeasonPayoutWithdrawn(msg.sender, amount);
    }

    function seasonCandidate() external view returns (address[3] memory candidates, uint64 windowEndsAt) {
        return (_candidate, candidateWindowEndsAt);
    }

    // -- scoring ledger reads (Story 2.5): each is the one on-chain answer the
    // Leaderboard, proof panel and `pnpm rebuild` re-derive against (AD-8). Zero-values
    // are honest "never scored" answers, so none of these revert on unknown keys. ------

    function seasonPointsOf(address player) external view returns (uint256) {
        return _scoring.seasonPoints[player];
    }

    function dailySpentOf(address player, uint32 utcDay) external view returns (uint256) {
        return _scoring.dailySpent[player][utcDay];
    }

    function dayAggregateOf(address player, uint32 leagueDay)
        external
        view
        returns (LeagueScoring.DayAggregate memory)
    {
        return _scoring.dayAggregates[player][leagueDay];
    }

    function dayMarketsOf(uint32 leagueDay) external view returns (LeagueScoring.DayMarkets memory) {
        return _scoring.dayMarkets[leagueDay];
    }

    function playedDaysOf(address player) external view returns (uint32[] memory) {
        return _scoring.playedDays[player];
    }

    /// The AD-16 fold, recomputed on every read (which subsumes "on every finalization").
    function streakOf(address player) external view returns (uint32) {
        return LeagueScoring.streakOf(_scoring, player);
    }

    /// FR-19's third tie-break key; 0 = no settled pick yet.
    function earliestCommitOrdinalOf(address player) external view returns (uint64) {
        return _scoring.earliestOrdinal[player];
    }

    function commitOrdinalOf(uint256 marketId) external view returns (uint64) {
        return _scoring.commitOrdinal[marketId];
    }

    /// Worker resume point (AD-13) and the exactly-once witness for tests and rebuild.
    function scoringProgressOf(uint256 marketId) external view returns (uint256 cursor, bool fullyScored) {
        LeagueScoring.MarketProgress storage prog = _scoring.progress[marketId];
        return (prog.cursor, prog.fullyScored);
    }

    // -- hooks LeagueCore calls on its own transitions --------------------------------

    /// createMarket admission (AD-17 hardening 1's structural half): a season-day
    /// market minted after seasonEnd could re-open standings the claim machine already
    /// gated on — refuse at the door, so the gate can only ever move toward terminal.
    function _requireSeasonDayCreatable(uint32 leagueDay) internal view {
        // forge-lint: disable-next-line(block-timestamp)
        if (leagueDay <= seasonEndDay && block.timestamp > seasonEnd) revert SeasonDayAfterSeasonEnd();
    }

    function _noteSeasonMarketCreated(uint32 leagueDay) internal {
        if (leagueDay <= seasonEndDay) seasonMarketsCreated++;
    }

    function _noteSeasonMarketTerminal(uint32 leagueDay) internal {
        if (leagueDay <= seasonEndDay) seasonMarketsTerminal++;
    }

    // -- the O(3) candidate calculus --------------------------------------------------

    /// Shape + eligibility + strict internal order. Zero-tail only (a hole would let a
    /// candidate hide a winner mid-list); every listed player must have points (FR-20's
    /// "eligible winner" — and every pointed player provably has a nonzero earliest
    /// ordinal, so the comparator never reads the 0 sentinel); each entry must strictly
    /// beat the next under the full FR-19 key, which also rejects duplicates.
    function _validateCandidate(address[3] calldata candidates) private view {
        bool tailStarted;
        for (uint256 i = 0; i < 3; i++) {
            if (candidates[i] == address(0)) {
                tailStarted = true;
                continue;
            }
            if (tailStarted) revert CandidateNotOrdered();
            if (_scoring.seasonPoints[candidates[i]] == 0) revert CandidateNotEligible();
            if (i > 0 && !_beats(candidates[i - 1], candidates[i])) revert CandidateNotOrdered();
        }
    }

    /// Lexicographic candidate comparison: the first differing slot decides. Filling an
    /// empty slot is superior (more eligible winners named); emptying one never is.
    function _beatsCandidate(address[3] calldata challenger, address[3] storage standing)
        private
        view
        returns (bool)
    {
        for (uint256 i = 0; i < 3; i++) {
            if (challenger[i] == standing[i]) continue;
            if (standing[i] == address(0)) return true;
            if (challenger[i] == address(0)) return false;
            return _beats(challenger[i], standing[i]);
        }
        return false;
    }

    /// FR-19's deterministic total order [amendment 2026-08-27, precision 2026-08-31]:
    /// Season Points desc, then current Streak desc, then earliest commitment
    /// appearance asc (the min commit ordinal the chain records), then address asc as
    /// the final key — no tie is representable, so a == b returns false and duplicate
    /// candidate entries fail the ordering check for free.
    function _beats(address a, address b) private view returns (bool) {
        uint256 pointsA = _scoring.seasonPoints[a];
        uint256 pointsB = _scoring.seasonPoints[b];
        if (pointsA != pointsB) return pointsA > pointsB;
        uint32 streakA = LeagueScoring.streakOf(_scoring, a);
        uint32 streakB = LeagueScoring.streakOf(_scoring, b);
        if (streakA != streakB) return streakA > streakB;
        uint64 ordinalA = _scoring.earliestOrdinal[a];
        uint64 ordinalB = _scoring.earliestOrdinal[b];
        if (ordinalA != ordinalB) return ordinalA < ordinalB;
        return uint160(a) < uint160(b);
    }

    /// FR-20's 50/30/20, positional. A pure function instead of a constant array only
    /// because Solidity has no constant arrays.
    function _shareBps(uint256 place) private pure returns (uint256) {
        if (place == 0) return 5000;
        if (place == 1) return 3000;
        return 2000;
    }
}
