// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// A Market's full immutable configuration, written before it opens (AD-3). The on-chain
/// copy is the authority; packages/shared/src/config.ts is its zod mirror.
/// Outcome Options are encoded as ordered internal thresholds with open-ended outer
/// buckets: N options = N-1 thresholds, so every decoded value maps to exactly one
/// option and an out-of-range outcome is unrepresentable (FR-7 honesty).
struct MarketConfig {
    // Source identity: which event on which chain settles this Market (check 2 reads
    // "the right contract on the right chain" — the chainKey is config, never calldata, AD-6).
    uint64 sourceChainKey;
    address emitter;
    bytes32 eventSignature;
    // Optional indexed-topic filter; zero means the event needs no subject narrowing.
    bytes32 subjectFilter;
    // Decoder is an append-only ProofGateway registry id; registering never touches this contract (AD-3).
    uint32 decoderId;
    // Payout law (PRD Glossary): gross return = stake x N where N = option count, so N is
    // structurally bound to boundaries.length + 1 at admission.
    uint8 payoutN;
    // Streak/day attribution key (AD-16); never any transaction's timestamp.
    uint32 leagueDay;
    uint64 lockTime;
    uint64 sourceWindowOpen;
    uint64 voidDeadline;
    // FR-6 rule 3: lock must fall before the moment the outcome starts being computable.
    uint64 determinismHorizon;
    // 1e18 fixed-point thresholds, strictly ascending (yields may be negative: int256).
    int256[] boundaries;
}

/// Exactly the canonical monotone machine (AD-19): Created -> Committed -> Resolved | Voided,
/// with Created -> Voided a legal edge. Display chips derive off-chain (AD-18).
enum MarketState {
    Created,
    Committed,
    Resolved,
    Voided
}

/// LeagueCore — the market registry (Story 2.1 slice).
/// Sole minter of marketId; holds each Market's immutable config and the sourceKey index
/// the AD-4 fan-out will walk. Deliberately exposes no owner, no upgrade path and no
/// config mutator: the remedy for a broken market is redeploy + rebuild (AD-13, AD-20).
contract LeagueCore {
    // Mirrors MIN_COMMIT_MARGIN_SEC in packages/shared/src/time.ts (AD-14): an unusably
    // thin commit window is unrepresentable on-chain.
    uint64 public constant MIN_COMMIT_MARGIN = 300;

    // EIP-712 (AD-5). The domain name/version mirror PICK_DOMAIN_NAME/VERSION in
    // packages/shared/src/pick.ts; the typehash string must match viem's derivation of
    // PICK_TYPES field-for-field or the conformance suite goes red.
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant DOMAIN_NAME_HASH = keccak256(bytes("ProofLeague"));
    bytes32 private constant DOMAIN_VERSION_HASH = keccak256(bytes("1"));
    bytes32 private constant PICK_TYPEHASH = keccak256(
        "Pick(address player,uint256 marketId,uint8 optionIndex,uint16 stake,uint32 nonce,uint32 utcDay,uint16 stakedSoFarInDay)"
    );

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
    error BoundaryCountOutOfRange();
    error PayoutOptionMismatch();

    event MarketCreated(uint256 indexed marketId, bytes32 indexed sourceKey, MarketConfig config);
    event PicksCommitted(uint256 indexed marketId, bytes32 root, string uri, bytes32 sha256Hash);

    /// The merkle commitment binding a market's published pick-set file (AD-5): the root the
    /// scoring proofs open against, plus the dual-homed file's uri and sha256 so the exact
    /// bytes are pinned on-chain. The canonical empty root is bytes32(0) — state, not the
    /// root value, is the committed signal.
    struct PickCommitment {
        bytes32 root;
        bytes32 sha256Hash;
        uint64 committedAt;
        string uri;
    }

    /// One signed Pick, exactly the EIP-712 message schema in packages/shared/src/pick.ts
    /// (AD-5). Field order and widths are part of the canonical encoding; the conformance
    /// suite in test/PickLeaf.t.sol holds the two planes identical.
    struct Pick {
        address player;
        uint256 marketId;
        uint8 optionIndex;
        uint16 stake;
        uint32 nonce;
        uint32 utcDay;
        uint16 stakedSoFarInDay;
    }

    // Fixed at construction with no mutator: adding a creator is a redeploy, never a
    // privileged call (AD-20; fully permissionless creation was rejected as a direct DoS
    // on the proof budget, AD-21).
    mapping(address => bool) public isMarketCreator;

    uint256 public marketCount;
    mapping(uint256 => MarketConfig) private _configs;
    mapping(uint256 => MarketState) private _states;
    // Built at creation so resolution never takes a caller-supplied market list (AD-4).
    mapping(bytes32 => uint256[]) private _marketsBySourceKey;
    mapping(uint256 => PickCommitment) private _commitments;

    constructor(address[] memory creators) {
        // With no post-deploy fix path (AD-20), a creator-less or zero-entry deployment
        // would be permanently unusable; the constructor is the only place to refuse it.
        if (creators.length == 0) revert InvalidCreatorSet();
        for (uint256 i = 0; i < creators.length; i++) {
            if (creators[i] == address(0)) revert InvalidCreatorSet();
            isMarketCreator[creators[i]] = true;
        }
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

        marketId = ++marketCount;
        _configs[marketId] = config;
        _states[marketId] = MarketState.Created;
        bytes32 sourceKey = sourceKeyOf(config);
        _marketsBySourceKey[sourceKey].push(marketId);
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
        emit PicksCommitted(marketId, root, uri, sha256Hash);
    }

    /// The canonical merkle leaf of one signed Pick: its full EIP-712 digest, domain
    /// included, so a leaf provable under one deployment's root can never verify against
    /// another's (AD-5). Domain parameters are explicit — scoring (Story 2.8) binds them to
    /// (block.chainid, address(this)); the conformance suite binds them to the shared
    /// vectors' recorded domains.
    function hashPickLeaf(uint256 chainId, address verifyingContract, Pick calldata pick)
        public
        pure
        returns (bytes32)
    {
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, DOMAIN_NAME_HASH, DOMAIN_VERSION_HASH, chainId, verifyingContract)
        );
        // The canonical abi.encode leaf layout (ARCH8): typehash then the seven message
        // fields in schema order, each padded to a full word.
        bytes32 structHash = keccak256(
            abi.encode(
                PICK_TYPEHASH,
                pick.player,
                pick.marketId,
                pick.optionIndex,
                pick.stake,
                pick.nonce,
                pick.utcDay,
                pick.stakedSoFarInDay
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    /// The AD-4 fan-out key: one accepted proof settles every market indexed here.
    function sourceKeyOf(MarketConfig calldata config) public pure returns (bytes32) {
        return keccak256(
            abi.encode(config.sourceChainKey, config.emitter, config.eventSignature, config.subjectFilter)
        );
    }

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

    function stateOf(uint256 marketId) external view returns (MarketState) {
        _requireKnown(marketId);
        return _states[marketId];
    }

    function getMarketsBySourceKey(bytes32 sourceKey) external view returns (uint256[] memory) {
        return _marketsBySourceKey[sourceKey];
    }

    // Ids are dense from 1, so existence is a range check; the zero-value MarketState
    // (Created) can therefore never leak for an unminted id.
    function _requireKnown(uint256 marketId) private view {
        if (marketId == 0 || marketId > marketCount) revert UnknownMarket();
    }
}
