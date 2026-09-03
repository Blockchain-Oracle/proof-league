// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Pick} from "./LeagueTypes.sol";
import {LeagueCanon} from "./LeagueCanon.sol";
import {PickSetMerkle} from "./PickSetMerkle.sol";

/// LeagueScoring — Story 2.5's engine (AD-15/AD-16, FR-8/15/18/19), an internal library
/// over one storage struct so LeagueCore stays under the file-size law while the scoring
/// state lives in the core's own storage (no delegatecall, no second deployment).
///
/// The exactly-once machine: a contract-held cursor walks the committed set in leaf
/// order, batches must be contiguous (batchStart == cursor), and every leaf is either
/// SETTLED once or SKIPPED once with a named reason — the skip lane never reverts, so a
/// hostile or malformed leaf can never strand the leaves behind it (the stuck-market
/// class AD-16 exists to prevent). Because AD-5 sorts the published set (player asc,
/// nonce asc), a player's picks are contiguous, and "latest nonce wins" reduces to a
/// one-slot holdover: each valid leaf either supersedes the held leaf (same player) or
/// finalizes it (new player); the holdover settles at the set's end.
library LeagueScoring {
    // Mirrors PICK_POINTS_DAILY in packages/shared/src/payout.ts (AD-15): the free daily
    // allowance the chain re-caps at scoring, so over-staking can't pay even if every
    // off-chain guard failed.
    uint256 internal constant DAILY_ALLOWANCE = 100;

    error BatchShapeMismatch();
    error NonContiguousBatch();
    error BatchBeyondSet();
    error CommitmentOpeningMismatch();
    error InvalidPickProof();

    /// Every non-settling leaf outcome, named so the projection and `pnpm rebuild` can
    /// reproduce the skip lane decision-for-decision (AD-8):
    /// OutOfOrder   — violates the committed (player asc, nonce asc) sort; skipped
    ///                without entering the holdover, so one malformed leaf costs itself,
    ///                never its neighbors.
    /// Superseded   — a later nonce by the same player replaced it (latest nonce wins).
    /// Tombstone    — a zero-stake cancellation that stayed final (AD-5).
    /// ForeignMarket — signed for a different marketId than the set it was committed in;
    ///                scoring it here would judge it against the wrong Resolution.
    /// OverBudget   — would breach the day's allowance (AD-15; both lanes, see _settle).
    enum SkipReason {
        OutOfOrder,
        Superseded,
        Tombstone,
        ForeignMarket,
        OverBudget
    }

    event PickScored(
        uint256 indexed marketId,
        uint64 leafIndex,
        address indexed player,
        uint8 optionIndex,
        uint16 stake,
        uint32 utcDay,
        bool correct,
        uint256 pointsAwarded
    );
    event PickSkipped(uint256 indexed marketId, uint64 leafIndex, address indexed player, SkipReason reason);
    event MarketFullyScored(uint256 indexed marketId);
    event DayFinalized(uint32 indexed leagueDay);

    /// The one-slot holdover: the last valid leaf, not yet settled because a later leaf
    /// by the same player could still supersede it. Packs to two slots.
    struct PendingPick {
        address player;
        uint32 nonce;
        uint32 utcDay;
        uint16 stake;
        uint16 stakedSoFarInDay;
        uint8 optionIndex;
        bool occupied;
        uint64 leafIndex;
    }

    struct MarketProgress {
        uint256 cursor;
        bool fullyScored;
        PendingPick pending;
    }

    /// Per-player-per-leagueDay tallies (AD-16). marketsPending is deliberately absent:
    /// picks only surface on-chain when scored, so per-player pending is unknowable —
    /// day completeness is the day-global DayMarkets counter below instead.
    struct DayAggregate {
        uint32 picksCount;
        uint32 correctCount;
    }

    /// Day-global finalization counter: created at admission, terminal at full scoring
    /// (Story 2.6's void will mark terminal too). A day is final when every market it
    /// contains is terminal; a market created later for the same day honestly re-opens
    /// it, and the fold below simply recomputes (AD-16's late-finalization rule).
    struct DayMarkets {
        uint32 created;
        uint32 terminal;
    }

    struct State {
        mapping(uint256 => MarketProgress) progress;
        // AD-15's ledger, keyed by the Pick's SIGNED utcDay — never the market's
        // leagueDay (two different questions, two different keys, stated in the spine).
        mapping(address => mapping(uint32 => uint256)) dailySpent;
        // FR-15: gross returns accumulate here; the Leaderboard sorts by exactly this.
        mapping(address => uint256) seasonPoints;
        mapping(address => mapping(uint32 => DayAggregate)) dayAggregates;
        // Every leagueDay a player has at least one settled pick on, in scoring-arrival
        // order; the streak fold sorts a memory copy, so out-of-order finalization can
        // never corrupt storage.
        mapping(address => uint32[]) playedDays;
        mapping(uint32 => DayMarkets) dayMarkets;
        // Dense commit ordinals from 1 (0 = never committed): strict ordering even for
        // two commits sharing a block timestamp, which committedAt cannot give.
        mapping(uint256 => uint64) commitOrdinal;
        uint64 commitCount;
        // FR-19's on-chain tie-break key (AD-16): min commit ordinal over the markets of
        // a player's settled picks; 0 = never scored.
        mapping(address => uint64) earliestOrdinal;
    }

    /// The per-batch immutable facts LeagueCore assembles from its own storage, so this
    /// library never reaches into market state it doesn't own.
    struct ScoreContext {
        uint256 marketId;
        bytes32 committedRoot;
        uint32 leagueDay;
        uint8 payoutN;
        uint8 winningOption;
        uint256 chainId;
        address core;
    }

    // -- hooks LeagueCore calls from its own lifecycle functions ---------------------

    function noteMarketCreated(State storage s, uint32 leagueDay) internal {
        s.dayMarkets[leagueDay].created += 1;
    }

    function noteCommitted(State storage s, uint256 marketId) internal {
        s.commitOrdinal[marketId] = ++s.commitCount;
    }

    /// Story 2.6's terminal edge in the day ledger: a voided market counts toward its
    /// leagueDay's completion exactly like a fully-scored one — while its picks, never
    /// scored, leave every aggregate and dailySpent untouched (AD-15's structural stake
    /// return, AD-16's "voided Picks never count").
    function noteVoided(State storage s, uint32 leagueDay) internal {
        _markTerminalForDay(s, leagueDay);
    }

    // -- the scoring machine ---------------------------------------------------------

    /// One contiguous batch of leaves [batchStart, batchStart + picks.length). Every
    /// call carries the commitment's opening (treeRoot, leafCount) and is checked
    /// against the stored root, so nothing about the set's shape is ever trusted from a
    /// caller — the function is permissionless (AD-4).
    function scoreBatch(
        State storage s,
        ScoreContext memory ctx,
        uint256 batchStart,
        Pick[] calldata picks,
        bytes32[][] calldata proofs,
        uint256 leafCount,
        bytes32 treeRoot
    ) internal {
        MarketProgress storage prog = s.progress[ctx.marketId];
        // AD-4: fully-scored markets no-op — a late duplicate submission (two workers,
        // a resubmitted tx) must burn gas, never revert a batch pipeline.
        if (prog.fullyScored) return;

        if (ctx.committedRoot == PickSetMerkle.EMPTY_ROOT) {
            // The canonical zero-pick commitment opens only as the empty shape; the call
            // then falls through to completion below (cursor 0 == leafCount 0).
            if (leafCount != 0 || treeRoot != bytes32(0)) revert CommitmentOpeningMismatch();
        } else {
            // The size ceiling keeps the depth probe terminating and the TS mirror
            // exact (see MAX_LEAF_COUNT); an opening past it is a worker-corrupted
            // commitment, honestly unscoreable like any other wrong root.
            if (
                leafCount == 0 || leafCount > PickSetMerkle.MAX_LEAF_COUNT
                    || PickSetMerkle.commitmentRootOf(treeRoot, leafCount) != ctx.committedRoot
            ) {
                revert CommitmentOpeningMismatch();
            }
        }
        if (picks.length != proofs.length) revert BatchShapeMismatch();
        // AD-4 [review 2026-08-31]: contiguous only — covers both below-cursor replays
        // and skip-ahead batches with the one named check, so no intermediate player's
        // leaf can ever be stranded.
        if (batchStart != prog.cursor) revert NonContiguousBatch();
        if (batchStart + picks.length > leafCount) revert BatchBeyondSet();

        for (uint256 i = 0; i < picks.length; i++) {
            _consumeLeaf(s, ctx, prog, batchStart + i, picks[i], proofs[i], leafCount, treeRoot);
        }
        prog.cursor = batchStart + picks.length;

        if (prog.cursor == leafCount) {
            _finishMarket(s, ctx, prog);
        }
    }

    /// Proof-check one leaf, then run the ordering/supersession lane. Only proof and
    /// shape failures revert (they are the CALLER's errors); everything wrong with the
    /// committed CONTENT skips, because content was fixed at commit time and reverting
    /// on it would wedge the cursor forever.
    function _consumeLeaf(
        State storage s,
        ScoreContext memory ctx,
        MarketProgress storage prog,
        uint256 leafIndex,
        Pick calldata pick,
        bytes32[] calldata proof,
        uint256 leafCount,
        bytes32 treeRoot
    ) private {
        bytes32 leaf = LeagueCanon.hashPickLeaf(ctx.chainId, ctx.core, pick);
        if (PickSetMerkle.processProof(leafCount, leafIndex, leaf, proof) != treeRoot) revert InvalidPickProof();
        // Never truncates in practice: reaching leaf 2^64 would need 2^64 contiguous
        // prior leaves scored on-chain first.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 idx = uint64(leafIndex);

        if (pick.marketId != ctx.marketId) {
            emit PickSkipped(ctx.marketId, idx, pick.player, SkipReason.ForeignMarket);
            return;
        }
        PendingPick storage pending = prog.pending;
        // The committed sort is the supersession machine's load-bearing assumption, so a
        // leaf violating it is skipped WITHOUT touching the holdover: the ordering
        // baseline stays at the last valid leaf and scoring marches on. Two pinned facts
        // [review 2026-09-03]: "player asc" is NUMERIC address order (= lowercase-hex
        // string order; CHECKSUMMED-hex string order differs — ASCII 'B' < 'a' — so the
        // Story 2.2 sorter must never sort checksummed strings), and on a sort-VIOLATING
        // set latest-nonce-wins holds only among in-order leaves: a final word committed
        // out of order skips while its stale predecessor settles — deterministic,
        // rebuild-reproducible worker fault, negative-tested, never a caller choice.
        if (
            pending.occupied
                && (pick.player < pending.player || (pick.player == pending.player && pick.nonce <= pending.nonce))
        ) {
            emit PickSkipped(ctx.marketId, idx, pick.player, SkipReason.OutOfOrder);
            return;
        }
        if (pending.occupied && pending.player == pick.player) {
            // Latest nonce wins (AD-5): the held leaf was never this player's final word.
            emit PickSkipped(ctx.marketId, pending.leafIndex, pending.player, SkipReason.Superseded);
        } else if (pending.occupied) {
            _settle(s, ctx, pending);
        }
        pending.player = pick.player;
        pending.nonce = pick.nonce;
        pending.utcDay = pick.utcDay;
        pending.stake = pick.stake;
        pending.stakedSoFarInDay = pick.stakedSoFarInDay;
        pending.optionIndex = pick.optionIndex;
        pending.occupied = true;
        pending.leafIndex = idx;
    }

    /// Settle one final (never-superseded) pick: budget lanes, then aggregates, points
    /// and the tie-break ordinal. An out-of-range optionIndex needs no special lane — it
    /// can never equal winningOption, so it settles as an ordinary incorrect pick.
    function _settle(State storage s, ScoreContext memory ctx, PendingPick storage p) private {
        if (p.stake == 0) {
            emit PickSkipped(ctx.marketId, p.leafIndex, p.player, SkipReason.Tombstone);
            return;
        }
        // AD-15's deterministic skip [review 2026-08-31]: the signed cumulative
        // stakedSoFarInDay IS the player's day spend in nonce order, so this decision is
        // a pure function of the pick — interleaved cross-market batches cannot move it.
        // Signer law the Story 2.2 intake half must pin with a vector: the cumulative
        // counts LIVE lower-nonce stakes only — a client that counts a pick's own
        // superseded predecessors gets the player's final word skipped here.
        if (uint256(p.stakedSoFarInDay) + p.stake > DAILY_ALLOWANCE) {
            emit PickSkipped(ctx.marketId, p.leafIndex, p.player, SkipReason.OverBudget);
            return;
        }
        // Defense-in-depth backstop: on any budget-honest committed set (worker law:
        // sum of live stakes per signed utcDay <= 100) this lane is unreachable — the
        // passing picks' stakes sum under the allowance in every order — so it costs the
        // prefix rule none of its determinism. It exists so even a hostile commitment
        // can never pay a player past the allowance.
        uint256 spent = s.dailySpent[p.player][p.utcDay];
        if (spent + p.stake > DAILY_ALLOWANCE) {
            emit PickSkipped(ctx.marketId, p.leafIndex, p.player, SkipReason.OverBudget);
            return;
        }
        s.dailySpent[p.player][p.utcDay] = spent + p.stake;

        DayAggregate storage agg = s.dayAggregates[p.player][ctx.leagueDay];
        if (agg.picksCount == 0) s.playedDays[p.player].push(ctx.leagueDay);
        agg.picksCount += 1;
        bool correct = p.optionIndex == ctx.winningOption;
        uint256 points = 0;
        if (correct) {
            agg.correctCount += 1;
            // Payout law (PRD Glossary): gross return = stake x N — mirrors grossPayout
            // in packages/shared/src/payout.ts.
            points = uint256(p.stake) * ctx.payoutN;
            s.seasonPoints[p.player] += points;
        }
        // FR-19 tie-break (AD-16): min commit ordinal across the player's settled picks,
        // so a later-scored but earlier-committed market still lowers it.
        uint64 ord = s.commitOrdinal[ctx.marketId];
        uint64 current = s.earliestOrdinal[p.player];
        if (current == 0 || ord < current) s.earliestOrdinal[p.player] = ord;

        emit PickScored(ctx.marketId, p.leafIndex, p.player, p.optionIndex, p.stake, p.utcDay, correct, points);
    }

    /// The set's end: the holdover is by construction the final leaf of the last
    /// player's run, so it settles now; then the market turns terminal for its day.
    function _finishMarket(State storage s, ScoreContext memory ctx, MarketProgress storage prog) private {
        if (prog.pending.occupied) {
            _settle(s, ctx, prog.pending);
            prog.pending.occupied = false;
        }
        prog.fullyScored = true;
        emit MarketFullyScored(ctx.marketId);
        _markTerminalForDay(s, ctx.leagueDay);
    }

    /// Shared by full scoring and void — the only two ways a market turns terminal for
    /// its day. DayFinalized is the projection's cue to re-read affected streaks
    /// (class-2 recompute); the chain's own streak answer is always the live fold below,
    /// so the event carries no truth a view couldn't reproduce (AD-8).
    function _markTerminalForDay(State storage s, uint32 leagueDay) private {
        DayMarkets storage dm = s.dayMarkets[leagueDay];
        dm.terminal += 1;
        if (dm.terminal == dm.created) emit DayFinalized(leagueDay);
    }

    // -- the streak fold (AD-16) -----------------------------------------------------

    /// The order-independent streak: a fold over the player's FINALIZED days in
    /// leagueDay order — recomputed from scratch on every read, which subsumes
    /// "recomputed on every finalization" — so a provisional day finalizing (or
    /// breaking) late still yields the correct value. Finalized days: correct>0
    /// extends, correct==0 breaks (picksCount>0 is structural — a day only enters
    /// playedDays via a settled pick). Unplayed days and not-yet-final days pause.
    /// Bounded: playedDays holds distinct leagueDays of a weeks-long season, and
    /// AD-17's payout verifies only 3 candidates, so the O(n^2) in-memory sort is a
    /// view-only cost the chain never pays in a transaction.
    function streakOf(State storage s, address player) internal view returns (uint32 streak) {
        uint32[] memory played = s.playedDays[player];
        for (uint256 i = 1; i < played.length; i++) {
            uint32 d = played[i];
            uint256 j = i;
            while (j > 0 && played[j - 1] > d) {
                played[j] = played[j - 1];
                j--;
            }
            played[j] = d;
        }
        for (uint256 i = 0; i < played.length; i++) {
            DayMarkets storage dm = s.dayMarkets[played[i]];
            if (dm.terminal != dm.created) continue;
            if (s.dayAggregates[player][played[i]].correctCount > 0) {
                streak += 1;
            } else {
                streak = 0;
            }
        }
    }
}
