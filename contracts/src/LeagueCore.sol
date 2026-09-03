// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MarketConfig, MarketState, Pick, PickCommitment, Resolution} from "./LeagueTypes.sol";
import {BoundaryCountOutOfRange, LeagueCanon} from "./LeagueCanon.sol";
import {LeagueScoring} from "./LeagueScoring.sol";

/// LeagueCore — the market registry and settlement ledger (Stories 2.1-2.5).
/// Sole minter of marketId; holds each Market's immutable config, the sourceKey index
/// the AD-4 fan-out walks, each Market's terminal Resolution, and the scoring state
/// (LeagueScoring, pre-split per CONVENTIONS §1 — the types live in LeagueTypes.sol and
/// the pure canonical mappings in LeagueCanon.sol, all inlined internal code, so the
/// deployed surface is still this one contract). Deliberately exposes no owner, no
/// upgrade path and no config mutator: the remedy for a broken market is redeploy +
/// rebuild (AD-13, AD-20). Deployed BY its ProofGateway's constructor
/// [decision 2026-09-03]: the deployer is recorded as the one resolver, so the mutual
/// reference is born atomic — no address prediction, no setter to mis-wire. Off-chain
/// config therefore points at the GATEWAY address only and derives this contract from
/// gateway.leagueCore() — a core configured independently could have any deployer as
/// its resolver, which no constructor check can refuse (the deploying gateway has no
/// code yet while this constructor runs) [review 2026-09-03].
contract LeagueCore {
    // Mirrors MIN_COMMIT_MARGIN_SEC in packages/shared/src/time.ts (AD-14): an unusably
    // thin commit window is unrepresentable on-chain.
    uint64 public constant MIN_COMMIT_MARGIN = 300;

    // AD-4's decode-gas ceiling made structural [review 2026-09-03]: the resolution
    // fan-out settles every market on a key in ONE transaction, so the per-key index is
    // capped at admission — a key can never accumulate more siblings than one verify
    // can afford, and the cap is stateful chain admission (like born-locked), so the
    // zod config mirror cannot and does not check it. 16 leaves generous room per
    // event family (Lido ships two readings) at well under 4M gas of fan-out.
    uint256 public constant MAX_MARKETS_PER_SOURCE_KEY = 16;

    error UnknownMarket();
    error CommitBeforeLock();
    error CommitWindowClosed();
    error MarketNotCommittable();
    error ZeroCommitmentField();
    error NotCommitted();
    error NotMarketCreator();
    error InvalidCreatorSet();
    error ZeroSourceField();
    error ZeroDecoderId();
    error ZeroLeagueDay();
    error BornLocked();
    error LockNotBeforeDeterminismHorizon();
    error ThinCommitWindow();
    error VoidClockNotLongest();
    error UnorderedBoundaries();
    error PayoutOptionMismatch();
    error NotProofGateway();
    error MarketNotResolvable();
    error NotResolved();
    error SourceKeyFull();
    error MarketNotScorable();

    event MarketCreated(uint256 indexed marketId, bytes32 indexed sourceKey, MarketConfig config);
    event PicksCommitted(uint256 indexed marketId, bytes32 root, string uri, bytes32 sha256Hash);
    event MarketResolved(
        uint256 indexed marketId, bytes32 indexed sourceKey, int256 value, uint8 winningOption, uint64 occurredAt
    );

    // Fixed at construction with no mutator: adding a creator is a redeploy, never a
    // privileged call (AD-20; fully permissionless creation was rejected as a direct DoS
    // on the proof budget, AD-21).
    mapping(address => bool) public isMarketCreator;

    // The one address allowed to resolve (AD-4, AD-20): the deployer, immutable. For
    // the canonical core — always discovered via ProofGateway.leagueCore(), never
    // deployed directly — that deployer IS the gateway, so the resolver can never be
    // repointed at something that skips the seven checks. A directly-deployed core
    // records whatever deployed it (the unit tests use exactly this); the guarantee is
    // a property of the gateway-deploys-core procedure plus the header's config rule,
    // not of this field alone [review 2026-09-03].
    address public immutable proofGateway;

    uint256 public marketCount;
    mapping(uint256 => MarketConfig) private _configs;
    mapping(uint256 => MarketState) private _states;
    // Built at creation so resolution never takes a caller-supplied market list (AD-4).
    mapping(bytes32 => uint256[]) private _marketsBySourceKey;
    mapping(uint256 => PickCommitment) private _commitments;
    mapping(uint256 => Resolution) private _resolutions;
    // Story 2.5's ledger (cursor, allowance, aggregates, streak inputs, tie-break
    // ordinals), owned by LeagueScoring; this contract only assembles contexts.
    LeagueScoring.State private _scoring;

    constructor(address[] memory creators) {
        // With no post-deploy fix path (AD-20), a creator-less or zero-entry deployment
        // would be permanently unusable; the constructor is the only place to refuse it.
        if (creators.length == 0) revert InvalidCreatorSet();
        for (uint256 i = 0; i < creators.length; i++) {
            if (creators[i] == address(0)) revert InvalidCreatorSet();
            isMarketCreator[creators[i]] = true;
        }
        proofGateway = msg.sender;
    }

    /// Sole minter of marketId (AD-3). Validates the admission structure so FR-6 rules
    /// 3-4 and unusable windows are unrepresentable, stores the config immutably, and
    /// indexes the market under its sourceKey.
    function createMarket(MarketConfig calldata config) external returns (uint256 marketId) {
        if (!isMarketCreator[msg.sender]) revert NotMarketCreator();
        if (config.sourceChainKey == 0 || config.emitter == address(0) || config.eventSignature == bytes32(0)) {
            revert ZeroSourceField();
        }
        // Decoder registry ids start at 1; 0 is the unset sentinel. A 0-decoder market
        // could never resolve, only void — the dead-slot shape AD-21 makes unrepresentable.
        if (config.decoderId == 0) revert ZeroDecoderId();
        if (config.leagueDay == 0) revert ZeroLeagueDay();
        // A market whose open window never existed is a dead slot, not a Market (AD-21).
        // Chain-head time is the architecture's one deciding clock (AD-10); windows are
        // hour-scale, so validator-level timestamp drift cannot flip this admission.
        // forge-lint: disable-next-line(block-timestamp)
        if (config.lockTime <= block.timestamp) revert BornLocked();
        if (config.lockTime >= config.determinismHorizon) revert LockNotBeforeDeterminismHorizon();
        // Widened to uint256 so the uint64 ceiling fires the named admission error, never
        // an arithmetic panic — off-chain error mapping relies on the uniform surface.
        if (uint256(config.sourceWindowOpen) < uint256(config.lockTime) + MIN_COMMIT_MARGIN) {
            revert ThinCommitWindow();
        }
        // AD-19: the void clock is never the shorter one.
        if (config.voidDeadline <= config.sourceWindowOpen) revert VoidClockNotLongest();

        uint256 thresholds = config.boundaries.length;
        // 2-6 Outcome Options (PRD Glossary) = 1-5 internal thresholds.
        if (thresholds < 1 || thresholds > 5) revert BoundaryCountOutOfRange();
        for (uint256 i = 1; i < thresholds; i++) {
            // Strict ascent: an equal or inverted pair would carve an empty bucket.
            if (config.boundaries[i] <= config.boundaries[i - 1]) revert UnorderedBoundaries();
        }
        if (uint256(config.payoutN) != thresholds + 1) revert PayoutOptionMismatch();

        bytes32 sourceKey = LeagueCanon.sourceKeyOf(config);
        // The fan-out gas ceiling (AD-4): admission is where the loop bound is enforced,
        // because verify takes no market list to page with.
        if (_marketsBySourceKey[sourceKey].length >= MAX_MARKETS_PER_SOURCE_KEY) revert SourceKeyFull();

        marketId = ++marketCount;
        _configs[marketId] = config;
        _states[marketId] = MarketState.Created;
        _marketsBySourceKey[sourceKey].push(marketId);
        // AD-16's day-completeness input: every admitted market counts against its
        // leagueDay until terminal, so a never-committed market honestly holds the day
        // provisional until Story 2.6 voids it.
        LeagueScoring.noteMarketCreated(_scoring, config.leagueDay);
        emit MarketCreated(marketId, sourceKey, config);
    }

    /// AD-14: commitment precedes knowability, and the chain enforces it. Legal only inside
    /// [lockTime, sourceWindowOpen) — inclusive lower bound, exclusive upper (at open the
    /// outcome starts being computable, so the window is already shut). A market that missed
    /// its window can never commit again; its only remaining path is void (Story 2.6).
    function commitPicks(uint256 marketId, bytes32 root, string calldata uri, bytes32 sha256Hash) external {
        if (!isMarketCreator[msg.sender]) revert NotMarketCreator();
        _requireKnown(marketId);
        if (_states[marketId] != MarketState.Created) revert MarketNotCommittable();
        // The root may be the canonical empty root (zero-pick markets commit and proceed,
        // AD-14), but the published-file binding must always point at real bytes (AD-5).
        if (bytes(uri).length == 0 || sha256Hash == bytes32(0)) revert ZeroCommitmentField();
        MarketConfig storage config = _configs[marketId];
        // Chain-head time is the one deciding clock (AD-10).
        // forge-lint: disable-start(block-timestamp)
        if (block.timestamp < config.lockTime) revert CommitBeforeLock();
        if (block.timestamp >= config.sourceWindowOpen) revert CommitWindowClosed();
        // Narrowing is safe: block.timestamp < sourceWindowOpen, itself a uint64.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 committedAt = uint64(block.timestamp);
        // forge-lint: disable-end(block-timestamp)

        _states[marketId] = MarketState.Committed;
        _commitments[marketId] =
            PickCommitment({root: root, sha256Hash: sha256Hash, committedAt: committedAt, uri: uri});
        // FR-19's tie-break input (AD-16): the dense commit ordinal, minted here so
        // "earliest commitment appearance" is strict even within one block.
        LeagueScoring.noteCommitted(_scoring, marketId);
        emit PicksCommitted(marketId, root, uri, sha256Hash);
    }

    /// The fan-out's per-market landing (Story 2.4, AD-4): gateway-only, Committed-only,
    /// terminal. The winning option is computed here from the market's own immutable
    /// boundaries — the gateway hands over the decoded value and chooses nothing, and no
    /// ABI anywhere carries an outcome across this boundary in either direction (AD-20);
    /// the answer lives only in the stored Resolution and its event.
    function resolve(uint256 marketId, int256 value, uint64 occurredAt) external {
        if (msg.sender != proofGateway) revert NotProofGateway();
        _requireKnown(marketId);
        // The monotone machine (AD-19): Created never resolves (commitment precedes
        // knowability, AD-14) and Resolved/Voided are terminal, so re-resolution is
        // unrepresentable, not just forbidden.
        if (_states[marketId] != MarketState.Committed) revert MarketNotResolvable();
        MarketConfig memory config = _configs[marketId];
        uint8 winningOption = LeagueCanon.winningOptionOf(value, config.boundaries);
        _states[marketId] = MarketState.Resolved;
        // Chain-head time is the one deciding clock (AD-10); uint64 narrowing is safe
        // for any realistic chain time.
        // forge-lint: disable-start(block-timestamp)
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 resolvedAt = uint64(block.timestamp);
        // forge-lint: disable-end(block-timestamp)
        _resolutions[marketId] =
            Resolution({value: value, occurredAt: occurredAt, resolvedAt: resolvedAt, winningOption: winningOption});
        emit MarketResolved(marketId, LeagueCanon.sourceKeyOf(config), value, winningOption, occurredAt);
    }

    /// Story 2.5 (AD-4/AD-15/AD-16): permissionless, exactly-once, budget-capped batch
    /// scoring against the committed root. Resolved-only: a Voided market's picks never
    /// surface, and Committed markets still await their proof. batchStart must equal the
    /// contract-held cursor and (treeRoot, leafCount) must open the stored commitment —
    /// the full machine, skip lanes and the day/streak ledger live in LeagueScoring.
    function scoreBatch(
        uint256 marketId,
        uint256 batchStart,
        Pick[] calldata picks,
        bytes32[][] calldata proofs,
        uint256 leafCount,
        bytes32 treeRoot
    ) external {
        _requireKnown(marketId);
        if (_states[marketId] != MarketState.Resolved) revert MarketNotScorable();
        MarketConfig storage config = _configs[marketId];
        LeagueScoring.scoreBatch(
            _scoring,
            LeagueScoring.ScoreContext({
                marketId: marketId,
                committedRoot: _commitments[marketId].root,
                leagueDay: config.leagueDay,
                payoutN: config.payoutN,
                winningOption: _resolutions[marketId].winningOption,
                // The leaf domain is THIS deployment (AD-5): a pick signed for another
                // chain or core can never prove into this cursor.
                chainId: block.chainid,
                core: address(this)
            }),
            batchStart,
            picks,
            proofs,
            leafCount,
            treeRoot
        );
    }

    // -- canonical-mapping wrappers (implementations in LeagueCanon) -----------------

    /// Public as the canonical mapper the conformance suites and `pnpm rebuild` pin.
    function winningOptionOf(int256 value, int256[] memory boundaries) public pure returns (uint8) {
        return LeagueCanon.winningOptionOf(value, boundaries);
    }

    /// Public as the canonical leaf encoder the EIP-712 conformance suite pins (ARCH8).
    function hashPickLeaf(uint256 chainId, address verifyingContract, Pick calldata pick)
        public
        pure
        returns (bytes32)
    {
        return LeagueCanon.hashPickLeaf(chainId, verifyingContract, pick);
    }

    function sourceKeyOf(MarketConfig memory config) public pure returns (bytes32) {
        return LeagueCanon.sourceKeyOf(config);
    }

    // -- views -----------------------------------------------------------------------

    function getMarketConfig(uint256 marketId) external view returns (MarketConfig memory) {
        _requireKnown(marketId);
        return _configs[marketId];
    }

    /// Reverts rather than returning an all-zero struct for an uncommitted market: with
    /// bytes32(0) the legal empty root, silence would be ambiguous. Keyed on committedAt
    /// (never 0 for a real commitment) so a commitment stays readable after later terminal
    /// transitions, not on the current state.
    function getPickCommitment(uint256 marketId) external view returns (PickCommitment memory) {
        _requireKnown(marketId);
        if (_commitments[marketId].committedAt == 0) revert NotCommitted();
        return _commitments[marketId];
    }

    /// Reverts for an unresolved market rather than returning an all-zero struct: value
    /// 0 is a legal decoded answer, so silence would be ambiguous (the getPickCommitment
    /// rule). Keyed on resolvedAt — never 0 for a real resolution.
    function getResolution(uint256 marketId) external view returns (Resolution memory) {
        _requireKnown(marketId);
        if (_resolutions[marketId].resolvedAt == 0) revert NotResolved();
        return _resolutions[marketId];
    }

    function stateOf(uint256 marketId) external view returns (MarketState) {
        _requireKnown(marketId);
        return _states[marketId];
    }

    function getMarketsBySourceKey(bytes32 sourceKey) external view returns (uint256[] memory) {
        return _marketsBySourceKey[sourceKey];
    }

    // Scoring ledger reads (Story 2.5): each is the one on-chain answer the Leaderboard,
    // proof panel and `pnpm rebuild` re-derive against (AD-8). Zero-values are honest
    // "never scored" answers, so none of these revert on unknown keys.
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

    // Ids are dense from 1, so existence is a range check; the zero-value MarketState
    // (Created) can therefore never leak for an unminted id.
    function _requireKnown(uint256 marketId) private view {
        if (marketId == 0 || marketId > marketCount) revert UnknownMarket();
    }
}
