// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueCoreTestBase} from "./helpers/LeagueCoreTestBase.sol";
import {LeagueCore, MarketConfig, MarketState} from "../src/LeagueCore.sol";
import {LeagueSeriesSurface} from "../src/LeagueSeries.sol";

/// Story 2.11 (AD-21): the Market Engine's judged claims — registration immutable and
/// creator-gated, instantiation permissionless and DETERMINISTIC (two callers at
/// different times mint byte-identical params), early calls refused, dead slots skipped
/// never minted, the day cap enforced in-contract, anchored boundaries derived from
/// chain-resident observations only (and refusing to derive while an observation is
/// live), and the hosted path accepting nothing but a subject from nobody but a creator.
contract LeagueSeriesTest is LeagueCoreTestBase {
    // Slot 0 opens 12h after T0; the base's clock idiom (explicit windows off T0).
    uint64 internal constant SLOT0 = T0 + 12 hours;

    function _staticTemplate() internal pure returns (LeagueSeriesSurface.SeriesTemplate memory t) {
        int256[] memory base = new int256[](2);
        base[0] = 10e18;
        base[1] = 20e18;
        t = LeagueSeriesSurface.SeriesTemplate({
            sourceChainKey: 3,
            emitter: address(0x17144556fd3424EDC8Fc8A4C940B2D04936d17eb),
            eventSignature: keccak256("SeriesEvidence(uint256)"),
            subjectFilter: bytes32(uint256(7)),
            externalSubject: false,
            decoderId: 1,
            payoutN: 3,
            firstSlotTime: SLOT0,
            slotPeriodSec: 24 hours,
            lockLeadSec: 1 hours,
            voidTailSec: 2 hours,
            horizonTailSec: 0,
            preCreateLeadSec: 72 hours,
            obsLagSec: 1 hours,
            maxInstancesPerDay: 2,
            baseBoundaries: base,
            anchorOffsets: new int256[](0)
        });
    }

    function _anchoredTemplate() internal pure returns (LeagueSeriesSurface.SeriesTemplate memory t) {
        t = _staticTemplate();
        int256[] memory offsets = new int256[](2);
        offsets[0] = -1e18;
        offsets[1] = 1e18;
        t.anchorOffsets = offsets;
    }

    function _registered(LeagueSeriesSurface.SeriesTemplate memory t) internal returns (uint256 id) {
        vm.prank(OPERATOR);
        id = league.registerSeries(t);
    }

    // -- registration ---------------------------------------------------------------

    function test_registerStoresImmutableTemplateAndGates() public {
        LeagueSeriesSurface.SeriesTemplate memory t = _staticTemplate();
        vm.prank(STRANGER);
        vm.expectRevert(LeagueCore.NotMarketCreator.selector);
        league.registerSeries(t);

        uint256 id = _registered(t);
        assertEq(id, 1);
        LeagueSeriesSurface.SeriesTemplate memory stored = league.seriesTemplateOf(id);
        assertEq(stored.firstSlotTime, SLOT0);
        assertEq(stored.baseBoundaries[1], 20e18);
        // No edit or unregister surface exists at all — immutability is structural; the
        // one mutation path a template has is none.
    }

    function test_registerRefusesMalformedTemplates() public {
        LeagueSeriesSurface.SeriesTemplate memory t;

        t = _staticTemplate();
        t.slotPeriodSec = 30 minutes; // skip-loop bound depends on the period floor
        _expectInvalid(t);

        t = _staticTemplate();
        t.lockLeadSec = league.MIN_COMMIT_MARGIN() - 1; // would mint thin commit windows
        _expectInvalid(t);

        t = _staticTemplate();
        t.preCreateLeadSec = t.lockLeadSec; // empty call window: a permanently dead series
        _expectInvalid(t);

        t = _staticTemplate();
        t.firstSlotTime = T0 + 30 minutes; // first lock not strictly future
        _expectInvalid(t);

        t = _staticTemplate();
        t.payoutN = 4; // options != boundaries + 1
        _expectInvalid(t);

        t = _anchoredTemplate();
        t.anchorOffsets = new int256[](1); // offsets shape must match boundaries
        _expectInvalid(t);

        t = _anchoredTemplate();
        (t.anchorOffsets[0], t.anchorOffsets[1]) = (t.anchorOffsets[1], t.anchorOffsets[0]); // unsorted
        _expectInvalid(t);

        t = _anchoredTemplate();
        t.externalSubject = true; // hosted observations live on another chain
        t.subjectFilter = bytes32(0);
        _expectInvalid(t);

        t = _staticTemplate();
        t.externalSubject = true; // hosted series may not fix a subject
        _expectInvalid(t);

        t = _staticTemplate();
        t.voidTailSec = 0;
        _expectInvalid(t);

        t = _staticTemplate();
        t.maxInstancesPerDay = 0;
        _expectInvalid(t);
    }

    function _expectInvalid(LeagueSeriesSurface.SeriesTemplate memory t) internal {
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueSeriesSurface.InvalidSeriesTemplate.selector);
        league.registerSeries(t);
    }

    // -- instantiation: due window, determinism, dead slots, cap ---------------------

    function test_unknownSeriesReverts() public {
        vm.expectRevert(LeagueSeriesSurface.UnknownSeries.selector);
        league.instantiateNext(0);
        vm.expectRevert(LeagueSeriesSurface.UnknownSeries.selector);
        league.instantiateNext(99);
    }

    function test_earlyCallRefused() public {
        LeagueSeriesSurface.SeriesTemplate memory t = _staticTemplate();
        t.preCreateLeadSec = 2 hours; // due window opens SLOT0 - 2h = T0 + 10h
        uint256 id = _registered(t);
        vm.expectRevert(LeagueSeriesSurface.SeriesSlotNotDue.selector);
        league.instantiateNext(id);
    }

    function test_permissionlessMintDerivesExactConfig() public {
        uint256 id = _registered(_staticTemplate());
        vm.prank(STRANGER); // anyone advances the engine — AD-21's permissionless claim
        uint256 marketId = league.instantiateNext(id);
        assertEq(marketId, 1);

        MarketConfig memory c = league.getMarketConfig(marketId);
        assertEq(c.lockTime, SLOT0 - 1 hours);
        assertEq(c.sourceWindowOpen, SLOT0);
        assertEq(c.voidDeadline, SLOT0 + 2 hours);
        assertEq(c.determinismHorizon, SLOT0);
        assertEq(c.leagueDay, uint32(SLOT0 / 1 days));
        assertEq(c.subjectFilter, bytes32(uint256(7)));
        assertEq(c.boundaries[0], 10e18);
        assertEq(league.seriesNextSlot(id), 1);
        assertEq(league.seriesInstancesOf(id).length, 1);
        assertTrue(league.stateOf(marketId) == MarketState.Created);
    }

    /// The determinism centerpiece: the SAME slot minted by different callers at
    /// different times yields byte-identical MarketConfig.
    function test_twoCallersDifferentTimesMintByteIdenticalParams() public {
        uint256 id = _registered(_staticTemplate());
        uint256 snapshot = vm.snapshotState();

        vm.prank(STRANGER);
        uint256 firstMarket = league.instantiateNext(id);
        bytes memory firstParams = abi.encode(league.getMarketConfig(firstMarket));

        vm.revertToState(snapshot);
        vm.warp(SLOT0 - 2 hours); // hours later, a different caller
        vm.prank(WORKER);
        uint256 secondMarket = league.instantiateNext(id);
        bytes memory secondParams = abi.encode(league.getMarketConfig(secondMarket));

        assertEq(keccak256(firstParams), keccak256(secondParams));
    }

    function test_deadSlotSkippedNeverMinted() public {
        uint256 id = _registered(_staticTemplate());
        vm.warp(SLOT0); // slot 0's lock (SLOT0 - 1h) is past: dead
        vm.expectEmit(true, true, false, true);
        emit LeagueSeriesSurface.SeriesSlotSkipped(id, 0, SLOT0 - 1 hours);
        uint256 marketId = league.instantiateNext(id);

        // Exactly one market exists and it is slot 1 — the dead slot left no corpse.
        assertEq(league.marketCount(), 1);
        assertEq(league.getMarketConfig(marketId).sourceWindowOpen, SLOT0 + 24 hours);
        assertEq(league.seriesNextSlot(id), 2);
        LeagueSeriesSurface.SeriesInstance[] memory instances = league.seriesInstancesOf(id);
        assertEq(instances.length, 1);
        assertEq(instances[0].slotIndex, 1);
    }

    function test_overCapDayRefused() public {
        LeagueSeriesSurface.SeriesTemplate memory t = _staticTemplate();
        t.slotPeriodSec = 1 hours; // several slots share a utcDay
        t.maxInstancesPerDay = 1;
        uint256 id = _registered(t);

        league.instantiateNext(id); // slot 0 consumes the day's allowance
        vm.expectRevert(LeagueSeriesSurface.SeriesDayCapExceeded.selector);
        league.instantiateNext(id);
    }

    // -- anchored derivation: chain-resident observations only -----------------------

    function test_anchoredDerivationFullLifecycle() public {
        uint256 id = _registered(_anchoredTemplate());

        // Slot 0: no observation exists yet -> base boundaries.
        uint256 first = league.instantiateNext(id);
        assertEq(league.getMarketConfig(first).boundaries[0], 10e18);

        // A LIVE in-window observation refuses derivation: slot 1 cannot mint while
        // slot 0 is still Committed — call-time state can never leak into params.
        vm.warp(SLOT0 - 1 hours);
        vm.prank(WORKER);
        league.commitPicks(first, ROOT, URI, SHA);
        vm.warp(SLOT0 + 3 hours);
        vm.expectRevert(LeagueSeriesSurface.SeriesObservationsNotFinal.selector);
        league.instantiateNext(id);

        // Resolved -> the anchor is the decoded value; boundaries = anchor + offsets.
        league.resolve(first, 15e18, SLOT0); // test base IS the recorded proofGateway
        uint256 second = league.instantiateNext(id);
        MarketConfig memory c = league.getMarketConfig(second);
        assertEq(c.boundaries[0], 14e18);
        assertEq(c.boundaries[1], 16e18);
        // And the public view re-derives the SAME boundaries forever (the rebuild pin).
        int256[] memory derived = league.deriveSeriesBoundaries(id, 1);
        assertEq(derived[0], 14e18);
        assertEq(derived[1], 16e18);
    }

    function test_anchoredVoidedObservationFallsBackToBase() public {
        uint256 id = _registered(_anchoredTemplate());
        uint256 first = league.instantiateNext(id);

        // Slot 0 never commits and voids past its deadline (the 2.6 edge); a voided
        // observation has no value, so slot 1 honestly falls back to base.
        vm.warp(SLOT0 + 2 hours + 1);
        league.void(first);
        uint256 second = league.instantiateNext(id);
        assertEq(league.getMarketConfig(second).boundaries[0], 10e18);
        assertEq(league.getMarketConfig(second).boundaries[1], 20e18);
    }

    // -- the hosted path: only a creator, only a subject -----------------------------

    function test_hostedPathGatesAndBindsSubject() public {
        LeagueSeriesSurface.SeriesTemplate memory t = _staticTemplate();
        t.externalSubject = true;
        t.subjectFilter = bytes32(0);
        uint256 hosted = _registered(t);
        uint256 fixedSeries = _registered(_staticTemplate());

        // Cross-path refusals: each mode accepts only its own entry point.
        vm.expectRevert(LeagueSeriesSurface.SeriesSubjectMode.selector);
        league.instantiateNext(hosted);
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueSeriesSurface.SeriesSubjectMode.selector);
        league.instantiateHostedSlot(fixedSeries, bytes32(uint256(1)));

        // A stranger cannot supply a subject; a creator cannot supply a zero one.
        vm.prank(STRANGER);
        vm.expectRevert(LeagueCore.NotMarketCreator.selector);
        league.instantiateHostedSlot(hosted, bytes32(uint256(1)));
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueSeriesSurface.SeriesZeroSubject.selector);
        league.instantiateHostedSlot(hosted, bytes32(0));

        // The creator supplies the subject and NOTHING else: every other param is
        // formula-derived, identical to the fixed path's derivation.
        vm.prank(OPERATOR);
        uint256 marketId = league.instantiateHostedSlot(hosted, bytes32(uint256(0xC0)));
        MarketConfig memory c = league.getMarketConfig(marketId);
        assertEq(c.subjectFilter, bytes32(uint256(0xC0)));
        assertEq(c.lockTime, SLOT0 - 1 hours);
        assertEq(c.sourceWindowOpen, SLOT0);
    }
}
