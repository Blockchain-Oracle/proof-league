// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {INativeQueryVerifier} from "@gluwa/usc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";
import {LeagueCore, MarketConfig} from "../src/LeagueCore.sol";
import {ProofGateway} from "../src/ProofGateway.sol";
import {LidoRateRatioDecoder} from "../src/LidoRateRatioDecoder.sol";
import {IProofDecoder} from "../src/IProofDecoder.sol";
import {MockNativeQueryVerifier, AlwaysTrueVerifier} from "./helpers/VerifierMocks.sol";
import {TxBytesCodec} from "./helpers/TxBytesCodec.sol";
import {LidoReceiptFixture} from "./helpers/LidoReceiptFixture.sol";

/// Story 2.3 — the seven checks, each negative-tested against an engineered proof
/// (FR-13, AD-6, AD-20, NFR-5). The reference proof is the blind-verified 2026-08-22
/// Lido rebase receipt; the 0xFD2 precompile is stood in by a mock that only approves
/// exactly armed (chainKey, height, txBytes) tuples.
contract ProofGatewayChecksTest is Test {
    LeagueCore internal league;
    ProofGateway internal gateway;
    uint32 internal lidoDecoderId;

    address internal constant OPERATOR = address(0xA11CE);
    // The genuine Native Query Verifier precompile address (check 7's only trust path).
    address internal constant VERIFIER_PRECOMPILE = 0x0000000000000000000000000000000000000FD2;
    // CC3 testnet chainKey for Ethereum mainnet (day-1 spike / research 2026-08-22).
    uint64 internal constant MAINNET_CHAIN_KEY = 3;
    uint64 internal constant SEPOLIA_CHAIN_KEY = 1;
    uint64 internal constant HEIGHT = LidoReceiptFixture.SOURCE_HEIGHT;
    // 2026-08-16, comfortably before the reference report's occurredAt (2026-08-22).
    uint64 internal constant T0 = 1_787_000_000;

    function setUp() public {
        vm.warp(T0);
        address[] memory ops = new address[](1);
        ops[0] = OPERATOR;
        league = new LeagueCore(ops);
        gateway = new ProofGateway(league, ops);
        // Deployed before the prank: `new` would otherwise consume the single-call prank
        // and registerDecoder would run unpranked (the LeagueCore.t.sol footgun).
        LidoRateRatioDecoder lido = new LidoRateRatioDecoder();
        vm.prank(OPERATOR);
        lidoDecoderId = gateway.registerDecoder(address(lido));
        vm.etch(VERIFIER_PRECOMPILE, type(MockNativeQueryVerifier).runtimeCode);
    }

    // ---- fixture plumbing ----

    function _mock() internal pure returns (MockNativeQueryVerifier) {
        return MockNativeQueryVerifier(VERIFIER_PRECOMPILE);
    }

    /// Reference-day market keyed to the real stETH TokenRebased report.
    function _lidoConfig() internal view returns (MarketConfig memory c) {
        int256[] memory b = new int256[](1);
        b[0] = 23e15; // 2.30% APR — a single threshold suffices for gateway tests
        c = MarketConfig({
            sourceChainKey: MAINNET_CHAIN_KEY,
            emitter: LidoReceiptFixture.STETH,
            eventSignature: LidoReceiptFixture.TOKEN_REBASED_SIG,
            subjectFilter: bytes32(LidoReceiptFixture.REPORT_TIMESTAMP),
            decoderId: lidoDecoderId,
            payoutN: 2,
            leagueDay: 1,
            lockTime: T0 + 1 hours,
            sourceWindowOpen: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            voidDeadline: T0 + 1 hours + league.MIN_COMMIT_MARGIN() + 24 hours,
            determinismHorizon: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            boundaries: b
        });
    }

    function _createAndCommit(MarketConfig memory c) internal returns (uint256 marketId, bytes32 sourceKey) {
        vm.prank(OPERATOR);
        marketId = league.createMarket(c);
        sourceKey = league.sourceKeyOf(c);
        vm.warp(c.lockTime);
        vm.prank(OPERATOR);
        league.commitPicks(marketId, bytes32(0), "supabase://picksets/ref.json", keccak256("pickset-bytes"));
    }

    /// The reference receipt surrounded by decoys the log filter must skip: a foreign
    /// emitter with the right shape, an anonymous stETH log, and a wrong-signature
    /// stETH log — so the happy path also proves checks 2-4 select, not just reject.
    function _referenceLogs() internal pure returns (EvmV1Decoder.LogEntry[] memory logs) {
        logs = new EvmV1Decoder.LogEntry[](4);
        logs[0] = EvmV1Decoder.LogEntry({
            address_: address(0xD0D0),
            topics: LidoReceiptFixture.topics(),
            data: LidoReceiptFixture.data()
        });
        logs[1] = EvmV1Decoder.LogEntry({
            address_: LidoReceiptFixture.STETH,
            topics: new bytes32[](0),
            data: ""
        });
        bytes32[] memory transferTopics = new bytes32[](1);
        transferTopics[0] = keccak256("Transfer(address,address,uint256)");
        logs[2] = EvmV1Decoder.LogEntry({
            address_: LidoReceiptFixture.STETH,
            topics: transferTopics,
            data: ""
        });
        logs[3] = LidoReceiptFixture.logEntry();
    }

    function _armed(bytes memory txBytes) internal returns (bytes memory) {
        _mock().arm(MAINNET_CHAIN_KEY, HEIGHT, keccak256(txBytes));
        return txBytes;
    }

    function _verify(bytes32 sourceKey, bytes memory txBytes) internal {
        INativeQueryVerifier.MerkleProof memory mp = INativeQueryVerifier.MerkleProof({
            root: bytes32(0),
            siblings: new INativeQueryVerifier.MerkleProofEntry[](0)
        });
        INativeQueryVerifier.ContinuityProof memory cp =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: bytes32(0), roots: new bytes32[](0)});
        gateway.verify(sourceKey, HEIGHT, txBytes, mp, cp);
    }

    // ---- happy path: all seven checks pass, acceptance recorded once ----

    function test_verify_acceptsProvenEventAndRecordsAcceptance() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectEmit(true, false, false, true, address(gateway));
        emit ProofGateway.ProofAccepted(
            key, MAINNET_CHAIN_KEY, HEIGHT, uint64(LidoReceiptFixture.REPORT_TIMESTAMP)
        );
        _verify(key, txBytes);
        assertEq(gateway.acceptedAt(key), uint64(block.timestamp));
        // The genuine precompile was consulted exactly once, about the config's chain.
        assertEq(_mock().verifyCallCount(), 1);
        assertEq(_mock().lastChainKey(), MAINNET_CHAIN_KEY);
    }

    // ---- check 1: the Ethereum transaction succeeded ----

    function test_verify_check1_revertedSourceTxRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        // Armed and provable: the verifier proves inclusion, never success — status is
        // the gateway's own check.
        bytes memory txBytes = _armed(TxBytesCodec.encode(0, _referenceLogs()));
        vm.expectRevert(ProofGateway.SourceTxFailed.selector);
        _verify(key, txBytes);
    }

    // ---- check 2: it came from the right contract, on the right chain ----

    function test_verify_check2_wrongEmitterRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes memory txBytes = _armed(
            TxBytesCodec.encode(
                1,
                TxBytesCodec.singleLog(
                    address(0xD0D0), LidoReceiptFixture.topics(), LidoReceiptFixture.data()
                )
            )
        );
        vm.expectRevert(ProofGateway.WrongEmitter.selector);
        _verify(key, txBytes);
    }

    function test_verify_check2_wrongSourceChainRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes memory txBytes = TxBytesCodec.encode(1, _referenceLogs());
        // A proof genuine on Sepolia's chainKey: the gateway must still interrogate the
        // verifier about the market's own chain (immutable config — there is no calldata
        // chainKey to steer it with), so the wrong-chain proof fails verification.
        // expectCall is trace-level, so it survives the expected revert (the mock's own
        // storage recording would roll back with it).
        _mock().arm(SEPOLIA_CHAIN_KEY, HEIGHT, keccak256(txBytes));
        vm.expectCall(
            VERIFIER_PRECOMPILE,
            abi.encodeWithSelector(MockNativeQueryVerifier.verifyAndEmit.selector, MAINNET_CHAIN_KEY, HEIGHT)
        );
        vm.expectRevert(ProofGateway.VerifierRejectedProof.selector);
        _verify(key, txBytes);
    }

    // ---- check 3: it is the right kind of event ----

    function test_verify_check3_wrongEventSignatureRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes32[] memory topics = LidoReceiptFixture.topics();
        topics[0] = keccak256("SomeOtherEvent(uint256)");
        bytes memory txBytes = _armed(
            TxBytesCodec.encode(
                1, TxBytesCodec.singleLog(LidoReceiptFixture.STETH, topics, LidoReceiptFixture.data())
            )
        );
        vm.expectRevert(ProofGateway.WrongEventSignature.selector);
        _verify(key, txBytes);
    }

    // ---- check 4: it is about the right thing ----

    function test_verify_check4_wrongSubjectRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes32[] memory topics = LidoReceiptFixture.topics();
        // The previous day's report: right contract, right event, wrong subject.
        topics[1] = bytes32(LidoReceiptFixture.REPORT_TIMESTAMP - 86400);
        bytes memory txBytes = _armed(
            TxBytesCodec.encode(
                1, TxBytesCodec.singleLog(LidoReceiptFixture.STETH, topics, LidoReceiptFixture.data())
            )
        );
        vm.expectRevert(ProofGateway.WrongSubject.selector);
        _verify(key, txBytes);
    }

    function test_verify_zeroSubjectFilterNeedsNoSubjectMatch() public {
        MarketConfig memory c = _lidoConfig();
        c.subjectFilter = bytes32(0); // the market family declared no narrowing needed
        (, bytes32 key) = _createAndCommit(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes);
        assertGt(gateway.acceptedAt(key), 0);
    }

    // ---- check 5: it has not been used before ----

    function test_verify_check5_replayedProofRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes);
        vm.expectRevert(ProofGateway.ProofAlreadyAccepted.selector);
        _verify(key, txBytes);
    }

    function test_verify_check5_firstAcceptedProofWinsOverLaterValidProof() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes);
        // A second, independently valid proof for the same key (armed at another height)
        // still rejects: acceptance is a one-shot per sourceKey (AD-4).
        bytes memory second = TxBytesCodec.encode(1, _referenceLogs());
        _mock().arm(MAINNET_CHAIN_KEY, HEIGHT + 1, keccak256(second));
        INativeQueryVerifier.MerkleProof memory mp = INativeQueryVerifier.MerkleProof({
            root: bytes32(0),
            siblings: new INativeQueryVerifier.MerkleProofEntry[](0)
        });
        INativeQueryVerifier.ContinuityProof memory cp =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: bytes32(0), roots: new bytes32[](0)});
        vm.expectRevert(ProofGateway.ProofAlreadyAccepted.selector);
        gateway.verify(key, HEIGHT + 1, second, mp, cp);
    }

    // ---- check 6: the market was open when it happened ----

    function test_verify_check6_preOpenSourceEventRejected() public {
        MarketConfig memory c = _lidoConfig();
        // The window opens one second after the event's own declared time: the report
        // pre-dates the market, so settling on it would let a known outcome be marketed.
        c.lockTime = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) - 299;
        c.sourceWindowOpen = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) + 1;
        c.determinismHorizon = c.sourceWindowOpen;
        c.voidDeadline = c.sourceWindowOpen + 24 hours;
        (, bytes32 key) = _createAndCommit(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectRevert(ProofGateway.SourceEventPreOpen.selector);
        _verify(key, txBytes);
        // Rejection must not consume the key, or a stale event would block the real one.
        assertEq(gateway.acceptedAt(key), 0);
    }

    function test_verify_check6_eventAtOpenInstantAccepted() public {
        MarketConfig memory c = _lidoConfig();
        // Boundary from the legal side: the event window is inclusive at open (the
        // commit window is exclusive there — no instant belongs to both).
        c.lockTime = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) - 300;
        c.sourceWindowOpen = uint64(LidoReceiptFixture.REPORT_TIMESTAMP);
        c.determinismHorizon = c.sourceWindowOpen;
        c.voidDeadline = c.sourceWindowOpen + 24 hours;
        (, bytes32 key) = _createAndCommit(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes);
        assertGt(gateway.acceptedAt(key), 0);
    }

    // ---- check 7: the submitter proved it through the real verifier ----

    function test_verify_check7_spoofedProverPathRejected() public {
        (, bytes32 key) = _createAndCommit(_lidoConfig());
        // An attacker-deployed verifier that approves everything, at a normal address.
        // The gateway's ABI offers no way to point at it (the upstream example repos'
        // vulnerability class): the genuine precompile is consulted, says no, verify
        // reverts, and the spoof is never called.
        AlwaysTrueVerifier spoof = new AlwaysTrueVerifier();
        bytes memory txBytes = TxBytesCodec.encode(1, _referenceLogs()); // not armed
        // Trace-level assertions (revert-immune): the spoof is consulted exactly zero
        // times, the genuine precompile exactly once.
        vm.expectCall(
            address(spoof), abi.encodeWithSelector(AlwaysTrueVerifier.verifyAndEmit.selector), 0
        );
        vm.expectCall(
            VERIFIER_PRECOMPILE, abi.encodeWithSelector(MockNativeQueryVerifier.verifyAndEmit.selector), 1
        );
        vm.expectRevert(ProofGateway.VerifierRejectedProof.selector);
        _verify(key, txBytes);
    }

    // ---- acceptance preconditions and sibling isolation ----

    function test_verify_unknownSourceKeyRejected() public {
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectRevert(ProofGateway.UnknownSourceKey.selector);
        _verify(keccak256("no-such-key"), txBytes);
    }

    function test_verify_uncommittedMarketCannotAcceptProof() public {
        MarketConfig memory c = _lidoConfig();
        vm.prank(OPERATOR);
        league.createMarket(c);
        bytes32 key = league.sourceKeyOf(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectRevert(ProofGateway.NoResolvableMarket.selector);
        _verify(key, txBytes);
    }

    function test_verify_unregisteredDecoderMarketIsIneligible() public {
        MarketConfig memory c = _lidoConfig();
        c.decoderId = 99; // admission attests feasibility off-chain; on-chain it skips
        (, bytes32 key) = _createAndCommit(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectRevert(ProofGateway.NoResolvableMarket.selector);
        _verify(key, txBytes);
    }

    /// The catch{} skip in _anyEligibleMarket, proven load-bearing [review 2026-09-02]:
    /// a sibling whose REGISTERED decoder reverts on this log shape (a decoder for a
    /// different event family) must be skipped like any other ineligible market —
    /// deleting the try/catch turns this acceptance into a revert and goes red.
    function test_verify_revertingDecoderSiblingNeverBlocksAcceptance() public {
        RevertingDecoder reverting = new RevertingDecoder(); // before the prank (footgun above)
        vm.prank(OPERATOR);
        uint32 revertingId = gateway.registerDecoder(address(reverting));
        MarketConfig memory healthy = _lidoConfig();
        MarketConfig memory broken = _lidoConfig();
        broken.decoderId = revertingId;
        // The broken sibling is created FIRST so the eligibility loop must survive its
        // reverting decoder before reaching the healthy market — with healthy first the
        // short-circuit would mask a deleted try/catch (watched: mutation run 2026-09-02).
        vm.prank(OPERATOR);
        uint256 brokenId = league.createMarket(broken);
        vm.prank(OPERATOR);
        uint256 healthyId = league.createMarket(healthy);
        bytes32 key = league.sourceKeyOf(healthy);
        vm.warp(healthy.lockTime);
        vm.startPrank(OPERATOR);
        league.commitPicks(healthyId, bytes32(0), "supabase://picksets/a.json", keccak256("a"));
        league.commitPicks(brokenId, bytes32(0), "supabase://picksets/b.json", keccak256("b"));
        vm.stopPrank();
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes);
        assertGt(gateway.acceptedAt(key), 0);
    }

    function test_verify_revertingDecoderAloneCannotAccept() public {
        RevertingDecoder reverting = new RevertingDecoder(); // before the prank (footgun above)
        vm.prank(OPERATOR);
        uint32 revertingId = gateway.registerDecoder(address(reverting));
        MarketConfig memory c = _lidoConfig();
        c.decoderId = revertingId;
        (, bytes32 key) = _createAndCommit(c);
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        vm.expectRevert(ProofGateway.NoResolvableMarket.selector);
        _verify(key, txBytes);
    }

    function test_verify_ineligibleSiblingNeverBlocksAcceptance() public {
        MarketConfig memory healthy = _lidoConfig();
        MarketConfig memory broken = _lidoConfig();
        broken.decoderId = 99; // same sourceKey (decoderId is not part of the key)
        vm.prank(OPERATOR);
        uint256 healthyId = league.createMarket(healthy);
        vm.prank(OPERATOR);
        uint256 brokenId = league.createMarket(broken);
        bytes32 key = league.sourceKeyOf(healthy);
        vm.warp(healthy.lockTime);
        vm.startPrank(OPERATOR);
        league.commitPicks(healthyId, bytes32(0), "supabase://picksets/a.json", keccak256("a"));
        league.commitPicks(brokenId, bytes32(0), "supabase://picksets/b.json", keccak256("b"));
        vm.stopPrank();
        bytes memory txBytes = _armed(TxBytesCodec.encode(1, _referenceLogs()));
        _verify(key, txBytes); // the broken sibling is skipped, never a revert (AD-4)
        assertGt(gateway.acceptedAt(key), 0);
    }
}

/// A registered decoder for some OTHER event family: reverts on every log it cannot
/// read, standing in for the misconfigured-sibling scenario.
contract RevertingDecoder is IProofDecoder {
    error NotMyEvent();

    function decode(bytes32[] calldata, bytes calldata) external pure returns (int256, uint64) {
        revert NotMyEvent();
    }
}
