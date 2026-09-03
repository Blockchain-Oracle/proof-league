// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// A Hosted Round's full immutable configuration, fixed at creation (AD-11): the round's
/// outcome is a pure function of blockhash(settleBlock) and these fields, so the moment
/// the round exists, nobody — operator, player or caller — retains any influence over it.
struct RoundConfig {
    // The pre-committed Sepolia block whose hash fixes the outcome. Must be a FUTURE
    // block at creation: its hash is unknowable then, which is the whole integrity claim.
    uint64 settleBlock;
    // The round's declared settle moment, chosen so settleBlock's expected mining time
    // is at or past it (a block-number-to-clock mapping no contract can verify — the
    // worker owns that arithmetic). Emitted verbatim as RoundSettled.occurredAt, so the
    // event's declared time (check 6's input on the league side) is fixed at creation
    // and can never vary with when or by whom settle() lands.
    uint64 scheduledSettleTime;
    // The draw's shape (AD-3): uniform over [valueMin, valueMin + valueSpan) on the same
    // 1e18 fixed-point scale as MarketConfig.boundaries. A Mainnet-Read-Gate fallback
    // family mimics any target value domain by config here plus boundaries there —
    // configs, never new contracts.
    int256 valueMin;
    uint256 valueSpan;
}

/// The monotone round machine, mirroring AD-19's market shape: Created -> Settled | Voided,
/// both terminal. Ids are dense from 1, so the zero-value state can never leak for an
/// unminted round (the LeagueCore idiom).
enum RoundState {
    Created,
    Settled,
    Voided
}

/// A settled round's record: the drawn value and the chain-head time settle() landed
/// (operational transparency — how late after settleBlock the sweep ran; the round's
/// DECLARED time stays scheduledSettleTime, fixed at creation).
struct RoundResult {
    int256 value;
    uint64 settledAt;
}

/// ContestSource — the Hosted Round outcome contract, deployed on Sepolia (Story 2.7,
/// FR-21, AD-11). It emits the settlement event the league's ProofGateway proves and
/// decodes through the identical seven-check path as every mainnet source — zero
/// special-casing on the league side. settle(roundId) is permissionless and derives the
/// outcome exclusively from blockhash(settleBlock) + creation-fixed parameters:
/// identical result regardless of caller or timing, revert before settleBlock is mined,
/// and a lapsed 256-block blockhash horizon voids the round instead of ever letting a
/// zero hash masquerade as entropy. Like LeagueCore, this contract exposes no owner, no
/// upgrade path and no config mutator (AD-20): round creation is gated by a
/// constructor-fixed creator set, and everything after creation is clock-and-chain fact.
contract ContestSource {
    // The EVM's BLOCKHASH reach: hashes are readable for exactly the 256 most recent
    // blocks (excluding the current one). Past it blockhash() returns zero — a value an
    // adversary could predict — so settlement must refuse it and void instead (AD-11).
    uint256 public constant BLOCKHASH_HORIZON = 256;

    error InvalidCreatorSet();
    error NotRoundCreator();
    error UnknownRound();
    error SettleBlockNotFuture();
    error ScheduledTimeNotFuture();
    error EmptyValueSpan();
    error ValueSpanOverflow();
    error RoundNotSettleable();
    error SettleBlockNotMined();
    error SettleHorizonLapsed();
    error RoundNotVoidable();
    error VoidBeforeHorizon();
    error RoundNotSettled();

    event RoundCreated(uint256 indexed roundId, RoundConfig config);
    // The league-facing settlement event: emitter + signature + indexed roundId are the
    // market's (emitter, eventSignature, subjectFilter) source identity on the league
    // side, and (value, occurredAt) is exactly the IProofDecoder answer shape.
    event RoundSettled(uint256 indexed roundId, int256 value, uint64 occurredAt);
    event RoundVoided(uint256 indexed roundId);

    // Fixed at construction with no mutator (AD-20; mirrors isMarketCreator): adding a
    // creator is a redeploy, never a privileged call. Fully permissionless creation was
    // rejected for the same reason as market creation — spam rounds would be free
    // garbage on the operator surface.
    mapping(address => bool) public isRoundCreator;

    uint256 public roundCount;
    mapping(uint256 => RoundConfig) private _configs;
    mapping(uint256 => RoundState) private _states;
    mapping(uint256 => RoundResult) private _results;

    constructor(address[] memory creators) {
        // With no post-deploy fix path, a creator-less deployment would be permanently
        // unusable; the constructor is the only place to refuse it (LeagueCore idiom).
        if (creators.length == 0) revert InvalidCreatorSet();
        for (uint256 i = 0; i < creators.length; i++) {
            if (creators[i] == address(0)) revert InvalidCreatorSet();
            isRoundCreator[creators[i]] = true;
        }
    }

    /// Fixes every outcome-determining parameter before any player can commit (the AC's
    /// "before Lock Time" is sequencing the operator cannot dodge: the league market's
    /// subjectFilter needs this roundId, so the round always exists first).
    function createRound(RoundConfig calldata config) external returns (uint256 roundId) {
        if (!isRoundCreator[msg.sender]) revert NotRoundCreator();
        // A present-or-past settleBlock would let the creator read its hash before
        // committing to it — the exact grind AD-11 exists to kill.
        if (config.settleBlock <= block.number) revert SettleBlockNotFuture();
        // Chain-head time is the one deciding clock (AD-10). A past declared settle
        // moment would emit an occurredAt that predates the round's own creation.
        // forge-lint: disable-next-line(block-timestamp)
        if (config.scheduledSettleTime <= block.timestamp) revert ScheduledTimeNotFuture();
        // A zero-width domain has no draw; refuse it as admission, not at settle.
        if (config.valueSpan == 0) revert EmptyValueSpan();
        // Both guards keep valueMin + (valueSpan - 1) inside int256, so settle's
        // arithmetic can never panic — every revert on this surface is a named error.
        if (config.valueSpan > uint256(type(int256).max)) revert ValueSpanOverflow();
        if (config.valueMin > type(int256).max - int256(config.valueSpan - 1)) revert ValueSpanOverflow();

        roundId = ++roundCount;
        _configs[roundId] = config;
        _states[roundId] = RoundState.Created;
        emit RoundCreated(roundId, config);
    }

    /// Permissionless settlement (AD-11): the checks are the guard and the derivation is
    /// a pure function of (creation-fixed config, blockhash), so caller identity and
    /// timing inside the horizon are provably irrelevant — the negative tests pin the
    /// same value at the window's first and last block. Legal only inside
    /// (settleBlock, settleBlock + 256]: before it the hash does not exist yet (at
    /// settleBlock itself BLOCKHASH still returns zero for the executing block), and
    /// past it the hash is zero again — settle and voidRound partition the timeline
    /// with no gap and no overlap, the AD-19-style disjunctive liveness guarantee.
    function settle(uint256 roundId) external {
        _requireKnown(roundId);
        if (_states[roundId] != RoundState.Created) revert RoundNotSettleable();
        RoundConfig storage config = _configs[roundId];
        if (block.number <= config.settleBlock) revert SettleBlockNotMined();
        // Widened before adding: a settleBlock near the uint64 ceiling must fire the
        // named error, never an arithmetic panic.
        if (block.number > uint256(config.settleBlock) + BLOCKHASH_HORIZON) revert SettleHorizonLapsed();
        bytes32 entropy = blockhash(config.settleBlock);
        // Unreachable inside the horizon on any real chain; kept so EVM-semantics drift
        // degrades to an honest revert rather than a predictable all-zero draw.
        if (entropy == bytes32(0)) revert SettleHorizonLapsed();

        // roundId is the domain separator: two rounds sharing one settleBlock draw
        // independently. Modulo bias over a 2^256 draw is <= valueSpan / 2^256 —
        // immeasurable at any real span, and the round is presented as luck, never
        // skill (AD-11 copy law).
        uint256 draw = uint256(keccak256(abi.encodePacked(entropy, roundId)));
        // Casts are guarded at admission: draw % valueSpan < valueSpan <= int256.max,
        // and valueMin + (valueSpan - 1) fits int256.
        // forge-lint: disable-next-line(unsafe-typecast)
        int256 value = config.valueMin + int256(draw % config.valueSpan);

        _states[roundId] = RoundState.Settled;
        // Chain-head time is the one deciding clock (AD-10); uint64 narrowing is safe
        // for any realistic chain time.
        // forge-lint: disable-start(block-timestamp)
        // forge-lint: disable-next-line(unsafe-typecast)
        _results[roundId] = RoundResult({value: value, settledAt: uint64(block.timestamp)});
        // forge-lint: disable-end(block-timestamp)
        // occurredAt is the creation-fixed declared time, NEVER the settle tx's clock:
        // the proven event's every field is caller-independent, so the league-side
        // check 6 reads a time nobody chose after the round existed.
        emit RoundSettled(roundId, value, config.scheduledSettleTime);
    }

    /// The lapsed-horizon void (AD-11): permissionless and terminal, legal exactly where
    /// settle is not — strictly past settleBlock + 256 while still Created. Mirrors
    /// LeagueCore.void's clock-fact philosophy: nobody can invoke it early, nobody can
    /// block it late, and the league-side market voids independently on its own
    /// voidDeadline (AD-19) since a voided round's event will never arrive.
    function voidRound(uint256 roundId) external {
        _requireKnown(roundId);
        if (_states[roundId] != RoundState.Created) revert RoundNotVoidable();
        if (block.number <= uint256(_configs[roundId].settleBlock) + BLOCKHASH_HORIZON) {
            revert VoidBeforeHorizon();
        }
        _states[roundId] = RoundState.Voided;
        emit RoundVoided(roundId);
    }

    // -- views (the 5.2 operator surface and transparency panel read these) -----------

    function getRoundConfig(uint256 roundId) external view returns (RoundConfig memory) {
        _requireKnown(roundId);
        return _configs[roundId];
    }

    function stateOf(uint256 roundId) external view returns (RoundState) {
        _requireKnown(roundId);
        return _states[roundId];
    }

    /// Reverts for an unsettled round rather than returning an all-zero struct: value 0
    /// is a legal draw, so silence would be ambiguous (the getResolution idiom). Settled
    /// is terminal, so keying on state is exact.
    function getRoundResult(uint256 roundId) external view returns (RoundResult memory) {
        _requireKnown(roundId);
        if (_states[roundId] != RoundState.Settled) revert RoundNotSettled();
        return _results[roundId];
    }

    // Ids are dense from 1, so existence is a range check; the zero-value RoundState
    // (Created) can therefore never leak for an unminted id.
    function _requireKnown(uint256 roundId) private view {
        if (roundId == 0 || roundId > roundCount) revert UnknownRound();
    }
}
