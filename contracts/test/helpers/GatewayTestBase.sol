// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {INativeQueryVerifier} from "@gluwa/usc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";
import {LeagueCore, MarketConfig} from "../../src/LeagueCore.sol";
import {ProofGateway} from "../../src/ProofGateway.sol";
import {LidoRateRatioDecoder} from "../../src/LidoRateRatioDecoder.sol";
import {MockNativeQueryVerifier} from "./VerifierMocks.sol";
import {LidoReceiptFixture} from "./LidoReceiptFixture.sol";

/// Shared ProofGateway harness [review 2026-09-03]: one wiring path (the gateway
/// deploys its LeagueCore, decision 2026-09-03), one etched 0xFD2 mock, one reference-
/// day market builder and one verify call shape for every gateway suite — so a change
/// to verify's ABI or the mock's arming protocol lands in exactly one place instead of
/// drifting across per-story copies.
abstract contract GatewayTestBase is Test {
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

    function setUp() public virtual {
        vm.warp(T0);
        address[] memory ops = new address[](1);
        ops[0] = OPERATOR;
        gateway = new ProofGateway(ops, ops);
        league = gateway.leagueCore();
        // Deployed before the prank: `new` would otherwise consume the single-call prank
        // and registerDecoder would run unpranked (the LeagueCore.t.sol footgun).
        LidoRateRatioDecoder lido = new LidoRateRatioDecoder();
        vm.prank(OPERATOR);
        lidoDecoderId = gateway.registerDecoder(address(lido));
        vm.etch(VERIFIER_PRECOMPILE, type(MockNativeQueryVerifier).runtimeCode);
    }

    function _mock() internal pure returns (MockNativeQueryVerifier) {
        return MockNativeQueryVerifier(VERIFIER_PRECOMPILE);
    }

    /// Reference-day market keyed to the real stETH TokenRebased report: one 2.30%
    /// threshold, and the blind-verified 2.3785% crosses it — option 1.
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

    function _armed(bytes memory txBytes) internal returns (bytes memory) {
        _mock().arm(MAINNET_CHAIN_KEY, HEIGHT, keccak256(txBytes));
        return txBytes;
    }

    function _verify(bytes32 sourceKey, bytes memory txBytes) internal {
        INativeQueryVerifier.MerkleProof memory mp = INativeQueryVerifier.MerkleProof({
            root: bytes32(0), siblings: new INativeQueryVerifier.MerkleProofEntry[](0)
        });
        INativeQueryVerifier.ContinuityProof memory cp =
            INativeQueryVerifier.ContinuityProof({lowerEndpointDigest: bytes32(0), roots: new bytes32[](0)});
        gateway.verify(sourceKey, HEIGHT, txBytes, mp, cp);
    }
}
