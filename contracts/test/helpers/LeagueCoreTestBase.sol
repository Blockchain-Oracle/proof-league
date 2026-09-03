// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LeagueCore, MarketConfig} from "../../src/LeagueCore.sol";

/// Shared LeagueCore harness [review 2026-09-03]: one deploy path and ONE baseline
/// config for every suite that exercises the core directly, so the boundary vector the
/// resolve tests and packages/shared/src/outcome.selftest.ts mirror can never drift
/// between copies. Deploying from the test contract makes the test contract the
/// recorded proofGateway (the gateway-deploys-core wiring, decision 2026-09-03).
abstract contract LeagueCoreTestBase is Test {
    LeagueCore internal league;

    address internal constant OPERATOR = address(0xA11CE);
    address internal constant WORKER = address(0xB0B);
    address internal constant STRANGER = address(0xBAD);
    // Fixed chain-time origin so every admission window in the tests is explicit.
    uint64 internal constant T0 = 1_756_000_000;

    bytes32 internal constant ROOT = keccak256("pickset-root");
    bytes32 internal constant SHA = keccak256("pickset-file-bytes");
    string internal constant URI = "picksets/1-4f2a.json";

    function setUp() public virtual {
        vm.warp(T0);
        address[] memory creators = new address[](2);
        creators[0] = OPERATOR;
        creators[1] = WORKER;
        league = new LeagueCore(creators);
    }

    /// Baseline admissible config: 5 Outcome Options = 4 ordered internal thresholds
    /// (open-ended outer buckets keep the value->option mapping total), yields as 1e18
    /// fixed-point fractions, commit window exactly MIN_COMMIT_MARGIN wide so the
    /// boundary case is proven admissible.
    function _validConfig() internal view returns (MarketConfig memory c) {
        int256[] memory b = new int256[](4);
        b[0] = 22e15; // 2.20% APR
        b[1] = 225e14; // 2.25%
        b[2] = 23e15; // 2.30%
        b[3] = 235e14; // 2.35%
        c = MarketConfig({
            sourceChainKey: 3, // Ethereum mainnet per the day-1 spike probe
            emitter: address(0x17144556fd3424EDC8Fc8A4C940B2D04936d17eb),
            eventSignature: keccak256("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)"),
            subjectFilter: bytes32(0),
            decoderId: 1,
            payoutN: 5,
            leagueDay: 1,
            lockTime: T0 + 1 hours,
            sourceWindowOpen: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            voidDeadline: T0 + 1 hours + league.MIN_COMMIT_MARGIN() + 24 hours,
            determinismHorizon: T0 + 1 hours + league.MIN_COMMIT_MARGIN(),
            boundaries: b
        });
    }

    // Config built before the prank: _validConfig reads MIN_COMMIT_MARGIN via an
    // external view call, which would otherwise consume the single-call prank.
    function _createdMarket() internal returns (uint256 id, MarketConfig memory c) {
        c = _validConfig();
        vm.prank(OPERATOR);
        id = league.createMarket(c);
    }

    function _committedMarket() internal returns (uint256 id, MarketConfig memory c) {
        (id, c) = _createdMarket();
        vm.warp(c.lockTime);
        vm.prank(WORKER);
        league.commitPicks(id, ROOT, URI, SHA);
    }
}
