// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {
    INativeQueryVerifier,
    NativeQueryVerifierLib
} from "@gluwa/usc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";
import {LeagueCore, MarketConfig, MarketState} from "./LeagueCore.sol";
import {SeasonParams} from "./LeagueSeason.sol";
import {IProofDecoder} from "./IProofDecoder.sol";

/// ProofGateway — the seven-check referee and the AD-4 fan-out (Stories 2.3-2.4,
/// FR-13/14, PRD §4.4). verify() accepts a proof only when every check passes; on
/// acceptance it resolves EVERY Committed market on the sourceKey in the same
/// transaction, each via its own decoderId and boundaries, and records the acceptance
/// (first accepted proof wins, AD-4). Checks 5 and 7 close the replay and prover-trust
/// classes the upstream example contracts leave open — the judge-facing claim, so each
/// check rejects with its own named error and carries a negative test. Like LeagueCore,
/// this contract exposes no owner, no upgrade path and no way to repoint a decoder: the
/// only privileged power is appending to the registry (AD-20). The gateway deploys its
/// own LeagueCore [decision 2026-09-03], which records this address as its one
/// resolver — the mutual reference is born atomic, with no prediction step and no
/// setter to mis-wire, and the "full contract surface deploys together" rule from
/// review 2026-09-02 becomes structural.
contract ProofGateway {
    error InvalidRegistrarSet();
    error NotDecoderRegistrar();
    error ZeroDecoderAddress();
    error CodelessDecoder();
    error UnknownDecoder();
    error UnknownSourceKey();
    error ProofAlreadyAccepted();
    error VerifierRejectedProof();
    error SourceTxFailed();
    error WrongEmitter();
    error WrongEventSignature();
    error WrongSubject();
    error SourceEventPreOpen();
    error NoResolvableMarket();

    event DecoderRegistered(uint32 indexed decoderId, address decoder);
    event ProofAccepted(bytes32 indexed sourceKey, uint64 sourceChainKey, uint64 height, uint64 occurredAt);

    LeagueCore public immutable leagueCore;

    // Fixed at construction with no mutator, mirroring isMarketCreator (AD-20): adding a
    // registrar is a redeploy, never a privileged call.
    mapping(address => bool) public isDecoderRegistrar;

    // Registry ids are dense from 1 (0 is MarketConfig's unset sentinel) and append-only:
    // no function takes an existing id, so a registered decoder can never be repointed.
    uint32 public decoderCount;
    mapping(uint32 => address) private _decoders;

    // Check 5's replay guard and AD-4's "first accepted proof wins", keyed by sourceKey:
    // the Creditcoin chain-head time at acceptance, 0 while none. LeagueCore.void
    // deliberately does NOT read this [review 2026-09-03]: acceptance is atomic with
    // resolution, so a market the proof settled is already terminal to void's state
    // check — while a sibling this fan-out SKIPPED can never resolve on the consumed
    // key, and gating its void on this mapping would freeze it forever (see void's doc).
    mapping(bytes32 => uint64) public acceptedAt;

    constructor(address[] memory creators, address[] memory registrars, SeasonParams memory season) {
        // With no post-deploy fix path, a mis-wired deployment would be permanently
        // unusable; the constructor is the only place to refuse it (the creator-set and
        // season-param refusals live in LeagueCore's own constructors and bubble up
        // from `new` — the full contract surface deploys together, Season included,
        // which is Story 2.10's critic-G1 point).
        if (registrars.length == 0) revert InvalidRegistrarSet();
        for (uint256 i = 0; i < registrars.length; i++) {
            if (registrars[i] == address(0)) revert InvalidRegistrarSet();
            isDecoderRegistrar[registrars[i]] = true;
        }
        leagueCore = new LeagueCore(creators, season);
    }

    /// Append-only registration (AD-3): a new source-event shape is a new id; existing
    /// ids never move, and registering touches nothing in LeagueCore.
    function registerDecoder(address decoder) external returns (uint32 decoderId) {
        if (!isDecoderRegistrar[msg.sender]) revert NotDecoderRegistrar();
        if (decoder == address(0)) revert ZeroDecoderAddress();
        // With no repoint function, a fat-fingered codeless address would strand every
        // market family pinned to its id (they could only void) — refuse it at the door,
        // the same mis-wiring class the constructor refuses [review 2026-09-02].
        if (decoder.code.length == 0) revert CodelessDecoder();
        decoderId = ++decoderCount;
        _decoders[decoderId] = decoder;
        emit DecoderRegistered(decoderId, decoder);
    }

    function decoderOf(uint32 decoderId) external view returns (address) {
        address decoder = _decoders[decoderId];
        if (decoder == address(0)) revert UnknownDecoder();
        return decoder;
    }

    /// The seven checks (FR-13). Permissionless: the checks are the guard and caller
    /// timing is a race everyone can see (AD-4), so the worker is merely the caller of
    /// record. The caller points at a sourceKey; every expectation the proof is judged
    /// against comes from immutable market config, never from calldata.
    function verify(
        bytes32 sourceKey,
        uint64 height,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof
    ) external {
        uint256[] memory markets = leagueCore.getMarketsBySourceKey(sourceKey);
        if (markets.length == 0) revert UnknownSourceKey();
        // Check 5 before any verification work: a consumed key rejects deterministically,
        // whatever the replayed proof's own validity.
        if (acceptedAt[sourceKey] != 0) revert ProofAlreadyAccepted();

        // Every market under one key shares the four source fields by construction — the
        // key is their keccak (LeagueCore.sourceKeyOf) — so the first market's immutable
        // config is the authority for all of them (AD-6).
        MarketConfig memory config = leagueCore.getMarketConfig(markets[0]);

        // Checks 7 and 2's chain half are structural: the verifier address is the 0xFD2
        // precompile constant inside the vendored library (this ABI has no caller-supplied
        // prover), and the chainKey queried is immutable config, never calldata — a proof
        // of the same emitter on another chain fails the genuine verifier here.
        bool proven = NativeQueryVerifierLib.getVerifier()
            .verifyAndEmit(config.sourceChainKey, height, encodedTransaction, merkleProof, continuityProof);
        if (!proven) revert VerifierRejectedProof();

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        // Check 1: the verifier proves inclusion, never success — a reverted source tx
        // still has a provable receipt (the documented upstream footgun, PRD §4.4).
        if (receipt.receiptStatus != 1) revert SourceTxFailed();

        EvmV1Decoder.LogEntry memory log =
            _matchingLog(receipt.receiptLogs, config.emitter, config.eventSignature, config.subjectFilter);

        (bool anyResolved, bool preOpenSeen, uint64 occurredAt) = _resolveEligibleMarkets(markets, log);
        if (!anyResolved) {
            // A proof that helps no market must not consume the key: recording it would
            // let a stale event block the real one under first-accepted-proof-wins.
            if (preOpenSeen) revert SourceEventPreOpen();
            revert NoResolvableMarket();
        }

        // Chain-head time is the one deciding clock (AD-10); uint64 narrowing is safe
        // for any realistic chain time.
        // forge-lint: disable-start(block-timestamp)
        // forge-lint: disable-next-line(unsafe-typecast)
        acceptedAt[sourceKey] = uint64(block.timestamp);
        // forge-lint: disable-end(block-timestamp)
        emit ProofAccepted(sourceKey, config.sourceChainKey, height, occurredAt);
    }

    /// Checks 2, 3, 4 as progressive narrowing so each engineered failure surfaces its
    /// own check's error for the FR-13 negative tests: emitter, then signature, then
    /// subject. The first fully matching log wins — with a subject filter set, any later
    /// match is a duplicate of the same report, and without one the market family has
    /// declared the event needs no narrowing (AD-3 admission). Consequence, accepted
    /// [review 2026-09-02]: a receipt whose FIRST matching log is pre-open is rejected
    /// even if a later matching log would settle — one-matching-log-per-receipt is an
    /// admission property of every listed family (Lido emits one report per tx).
    function _matchingLog(
        EvmV1Decoder.LogEntry[] memory logs,
        address emitter,
        bytes32 eventSignature,
        bytes32 subjectFilter
    ) private pure returns (EvmV1Decoder.LogEntry memory) {
        bool emitterSeen;
        bool signatureSeen;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].address_ != emitter) continue;
            emitterSeen = true;
            // Guarded topics[0]: an anonymous event carries no signature topic.
            if (logs[i].topics.length == 0 || logs[i].topics[0] != eventSignature) continue;
            signatureSeen = true;
            if (subjectFilter != bytes32(0)) {
                if (logs[i].topics.length < 2 || logs[i].topics[1] != subjectFilter) continue;
            }
            return logs[i];
        }
        if (!emitterSeen) revert WrongEmitter();
        if (!signatureSeen) revert WrongEventSignature();
        revert WrongSubject();
    }

    /// Check 6 per market, then the AD-4 fan-out in the same pass (Story 2.4, FR-14):
    /// every Committed sibling whose decoder reads the log and whose window had opened
    /// resolves here, each via its own decoderId and boundaries — the caller supplied no
    /// market list and chooses nothing; one proof, one transaction, one budget unit.
    /// Check 6 itself: the event's own declared time must be at or after that market's
    /// sourceWindowOpen (commitPicks is exclusive at open, the event window inclusive
    /// there, so no instant belongs to both). Ineligible markets are skipped, never
    /// reverted on — one mis-stated sibling (uncommitted, voided, unregistered or
    /// unreadable decoder, pre-open window) can never block the rest (AD-4 isolation);
    /// what it forfeits is its own resolution, and void (AD-19) returns its stakes.
    /// The decoder consult is an explicit staticcall, not try/catch: a try clause
    /// cannot catch RETURN-DATA decode failures (Solidity raises them in the caller),
    /// so a wrong-but-answering contract registered as a decoder would revert verify
    /// un-caught and brick its whole key — probe-proven [review 2026-09-03]. The raw
    /// form makes the isolation total (call failure, wrong return shape, out-of-range
    /// time all skip) and cannot re-enter; LeagueCore.resolve trusts only msg.sender.
    function _resolveEligibleMarkets(uint256[] memory markets, EvmV1Decoder.LogEntry memory log)
        private
        returns (bool anyResolved, bool preOpenSeen, uint64 occurredAt)
    {
        bytes memory decodeCall = abi.encodeCall(IProofDecoder.decode, (log.topics, log.data));
        for (uint256 i = 0; i < markets.length; i++) {
            if (leagueCore.stateOf(markets[i]) != MarketState.Committed) continue;
            MarketConfig memory config = leagueCore.getMarketConfig(markets[i]);
            address decoder = _decoders[config.decoderId];
            if (decoder == address(0)) continue;
            (bool ok, bytes memory ret) = decoder.staticcall(decodeCall);
            // A compliant (int256, uint64) return is exactly two words.
            if (!ok || ret.length != 64) continue;
            (int256 value, uint256 rawEventTime) = abi.decode(ret, (int256, uint256));
            // A Solidity decoder zero-pads its uint64; dirty high bits mean the answer
            // came from something that is not the attested decoder shape.
            if (rawEventTime > type(uint64).max) continue;
            // forge-lint: disable-next-line(unsafe-typecast)
            uint64 eventTime = uint64(rawEventTime);
            if (eventTime < config.sourceWindowOpen) {
                preOpenSeen = true;
                continue;
            }
            // Siblings share the log, so shape-level occurredAt extraction agrees
            // across their decoders; the first RESOLVED market's reading is the
            // event's — an ordering fixed by on-chain creation order, never by the
            // caller, so `pnpm rebuild` reproduces it (AD-8) [review 2026-09-02].
            if (!anyResolved) occurredAt = eventTime;
            leagueCore.resolve(markets[i], value, eventTime);
            anyResolved = true;
        }
    }
}
