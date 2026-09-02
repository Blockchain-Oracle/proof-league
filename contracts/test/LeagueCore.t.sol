// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LeagueCore, MarketConfig, MarketState} from "../src/LeagueCore.sol";

/// Story 2.1 — LeagueCore market registry: sole-minted marketId, immutable config,
/// admission structure enforced on-chain (AD-3, AD-14, AD-19, FR-6), no privileged
/// mutation path (AD-20, NFR-5).
contract LeagueCoreTest is Test {
    LeagueCore internal league;

    address internal constant OPERATOR = address(0xA11CE);
    address internal constant WORKER = address(0xB0B);
    address internal constant STRANGER = address(0xBAD);
    // Fixed chain-time origin so every admission window in the tests is explicit.
    uint64 internal constant T0 = 1_756_000_000;

    function setUp() public {
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

    function _configHash(uint256 marketId) internal view returns (bytes32) {
        return keccak256(abi.encode(league.getMarketConfig(marketId)));
    }

    // ---- AC 1: sole-minted id, stored config, sourceKey index ----

    function test_createMarket_mintsSequentialIdsFromOne() public {
        // Config is built before each prank: _validConfig reads MIN_COMMIT_MARGIN via an
        // external view call, which would otherwise consume the single-call prank.
        MarketConfig memory c = _validConfig();
        vm.prank(OPERATOR);
        uint256 first = league.createMarket(c);
        vm.prank(WORKER);
        uint256 second = league.createMarket(c);
        assertEq(first, 1);
        assertEq(second, 2);
        assertEq(league.marketCount(), 2);
    }

    function test_createMarket_storesConfigVerbatim() public {
        MarketConfig memory c = _validConfig();
        vm.prank(OPERATOR);
        uint256 id = league.createMarket(c);
        MarketConfig memory got = league.getMarketConfig(id);
        assertEq(keccak256(abi.encode(got)), keccak256(abi.encode(c)));
    }

    function test_createMarket_indexesMarketsBySourceKey() public {
        MarketConfig memory yield = _validConfig();
        MarketConfig memory tips = _validConfig();
        tips.decoderId = 2; // same source event, second derivation (AD-4 fan-out siblings)
        MarketConfig memory other = _validConfig();
        other.subjectFilter = bytes32(uint256(1)); // different key
        vm.startPrank(OPERATOR);
        uint256 a = league.createMarket(yield);
        uint256 b = league.createMarket(tips);
        uint256 cId = league.createMarket(other);
        vm.stopPrank();

        uint256[] memory sameKey = league.getMarketsBySourceKey(league.sourceKeyOf(yield));
        assertEq(sameKey.length, 2);
        assertEq(sameKey[0], a);
        assertEq(sameKey[1], b);
        uint256[] memory otherKey = league.getMarketsBySourceKey(league.sourceKeyOf(other));
        assertEq(otherKey.length, 1);
        assertEq(otherKey[0], cId);
    }

    function test_createMarket_emitsMarketCreated() public {
        MarketConfig memory c = _validConfig();
        vm.expectEmit(true, true, true, true);
        emit LeagueCore.MarketCreated(1, league.sourceKeyOf(c), c);
        vm.prank(OPERATOR);
        league.createMarket(c);
    }

    function test_createMarket_initialStateIsCreated() public {
        MarketConfig memory c = _validConfig();
        vm.prank(OPERATOR);
        uint256 id = league.createMarket(c);
        assertEq(uint8(league.stateOf(id)), uint8(MarketState.Created));
    }

    function test_getters_revertOnUnknownMarket() public {
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.getMarketConfig(1);
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.stateOf(0);
    }

    // ---- AC 2: admission structure — bad configs are unrepresentable ----

    function test_createMarket_revertsWhenCallerNotCreator() public {
        MarketConfig memory c = _validConfig();
        vm.prank(STRANGER);
        vm.expectRevert(LeagueCore.NotMarketCreator.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnZeroSourceFields() public {
        MarketConfig memory c = _validConfig();
        c.sourceChainKey = 0;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ZeroSourceField.selector);
        league.createMarket(c);

        c = _validConfig();
        c.emitter = address(0);
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ZeroSourceField.selector);
        league.createMarket(c);

        c = _validConfig();
        c.eventSignature = bytes32(0);
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ZeroSourceField.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsWhenLockNotBeforeDeterminismHorizon() public {
        MarketConfig memory c = _validConfig();
        c.determinismHorizon = c.lockTime; // FR-6 rule 3: lock must strictly precede
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.LockNotBeforeDeterminismHorizon.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnThinCommitWindow() public {
        MarketConfig memory c = _validConfig();
        c.sourceWindowOpen = c.lockTime + league.MIN_COMMIT_MARGIN() - 1;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ThinCommitWindow.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsWhenVoidClockNotLongest() public {
        MarketConfig memory c = _validConfig();
        c.voidDeadline = c.sourceWindowOpen; // AD-19: void clock is never the shorter one
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.VoidClockNotLongest.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnBornLockedMarket() public {
        MarketConfig memory c = _validConfig();
        c.lockTime = T0; // lockTime == now: no open window ever existed (AD-21 dead-slot law)
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.BornLocked.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnUnorderedBoundaries() public {
        MarketConfig memory c = _validConfig();
        c.boundaries[2] = c.boundaries[1]; // equal adjacent thresholds: an empty bucket
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.UnorderedBoundaries.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnBoundaryCountOutOfRange() public {
        MarketConfig memory c = _validConfig();
        c.boundaries = new int256[](0); // zero thresholds = one option = no market
        c.payoutN = 1;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.BoundaryCountOutOfRange.selector);
        league.createMarket(c);

        c = _validConfig();
        c.boundaries = new int256[](6); // 7 options exceeds the Glossary's 2-6
        // casting to 'int256' is safe: i + 1 never exceeds 6
        // forge-lint: disable-next-line(unsafe-typecast)
        for (uint256 i = 0; i < 6; i++) c.boundaries[i] = int256(i + 1);
        c.payoutN = 7;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.BoundaryCountOutOfRange.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnPayoutOptionMismatch() public {
        MarketConfig memory c = _validConfig();
        c.payoutN = 4; // 4 thresholds carve 5 options; Payout law says N == option count
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.PayoutOptionMismatch.selector);
        league.createMarket(c);
    }

    function test_createMarket_revertsOnZeroDecoderId() public {
        MarketConfig memory c = _validConfig();
        c.decoderId = 0; // registry ids start at 1; a 0-decoder market is a dead slot (AD-21)
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ZeroDecoderId.selector);
        league.createMarket(c);
    }

    /// lockTime + MIN_COMMIT_MARGIN near the uint64 ceiling must fire the named admission
    /// error, never an arithmetic panic — off-chain error mapping relies on the uniform
    /// custom-error surface [review 2026-09-02].
    function test_createMarket_thinWindowAtUint64EdgeRevertsCleanly() public {
        MarketConfig memory c = _validConfig();
        c.lockTime = type(uint64).max - 2;
        c.determinismHorizon = type(uint64).max - 1;
        c.sourceWindowOpen = type(uint64).max - 1;
        c.voidDeadline = type(uint64).max;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ThinCommitWindow.selector);
        league.createMarket(c);
    }

    function test_constructor_revertsOnEmptyCreatorSet() public {
        // AD-20 removes every post-deploy fix path, so a creator-less deployment would be
        // permanently unusable; the constructor is the only place to catch it.
        vm.expectRevert(LeagueCore.InvalidCreatorSet.selector);
        new LeagueCore(new address[](0));
    }

    function test_constructor_revertsOnZeroAddressCreator() public {
        address[] memory creators = new address[](1);
        vm.expectRevert(LeagueCore.InvalidCreatorSet.selector);
        new LeagueCore(creators);
    }

    function test_createMarket_revertsOnZeroLeagueDay() public {
        MarketConfig memory c = _validConfig();
        c.leagueDay = 0;
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.ZeroLeagueDay.selector);
        league.createMarket(c);
    }

    // ---- AC 3: immutable thereafter, no privileged path ----

    function test_configUntouchedByLaterCreations() public {
        MarketConfig memory c = _validConfig();
        vm.prank(OPERATOR);
        league.createMarket(c);
        bytes32 before = _configHash(1);
        MarketConfig memory c2 = _validConfig();
        c2.decoderId = 9;
        vm.prank(OPERATOR);
        league.createMarket(c2);
        assertEq(_configHash(1), before);
    }

    /// Tripwire, not proof: the real guarantee is the ABI surface itself (createMarket is
    /// the only state-changing function this slice ships). The probe raw-calls the admin
    /// selectors a privileged design would have grown and asserts none exists and nothing
    /// moved (AD-20).
    function test_noPrivilegedMutationPath() public {
        MarketConfig memory c = _validConfig();
        vm.prank(OPERATOR);
        league.createMarket(c);
        bytes32 before = _configHash(1);

        bytes[] memory probes = new bytes[](6);
        probes[0] = abi.encodeWithSignature("setLockTime(uint256,uint64)", 1, T0);
        probes[1] = abi.encodeWithSignature("setBoundaries(uint256,int256[])", 1, new int256[](2));
        probes[2] = abi.encodeWithSignature("adminResolve(uint256,uint8)", 1, 0);
        probes[3] = abi.encodeWithSignature("transferOwnership(address)", STRANGER);
        probes[4] = abi.encodeWithSignature("upgradeTo(address)", STRANGER);
        probes[5] = abi.encodeWithSignature("addMarketCreator(address)", STRANGER);
        for (uint256 i = 0; i < probes.length; i++) {
            vm.prank(OPERATOR);
            (bool ok,) = address(league).call(probes[i]);
            assertFalse(ok, "a privileged selector answered");
        }
        (bool hasOwner,) = address(league).staticcall(abi.encodeWithSignature("owner()"));
        assertFalse(hasOwner, "an owner() surface exists");
        assertEq(_configHash(1), before);
    }

    function test_creatorSetIsFixedAtConstruction() public view {
        assertTrue(league.isMarketCreator(OPERATOR));
        assertTrue(league.isMarketCreator(WORKER));
        assertFalse(league.isMarketCreator(STRANGER));
    }

    // Mirrors MIN_COMMIT_MARGIN_SEC in packages/shared/src/time.ts; drift here would let
    // an off-chain validator accept a config the chain rejects (AD-14).
    function test_minCommitMarginMirrorsSharedConstant() public view {
        assertEq(league.MIN_COMMIT_MARGIN(), 300);
    }
}
