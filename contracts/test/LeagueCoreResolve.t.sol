// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {stdJson} from "forge-std/StdJson.sol";
import {LeagueCore, MarketConfig, MarketState} from "../src/LeagueCore.sol";
import {LeagueCoreTestBase} from "./helpers/LeagueCoreTestBase.sol";

/// Story 2.4 — LeagueCore.resolve: gateway-only, Committed-only, terminal (AD-4,
/// AD-19, AD-20), and the total value->option mapping (FR-7). The base harness deploys
/// `league` from the test contract, so the test contract IS the recorded proofGateway
/// (the gateway-deploys-core wiring, decision 2026-09-03): unpranked calls exercise
/// the legal path, pranked ones the gate. The gateway-side fan-out lives in
/// ProofGatewayFanOut.t.sol.
contract LeagueCoreResolveTest is LeagueCoreTestBase {
    using stdJson for string;

    // The shared conformance fixture (AD-8): outcome.selftest.ts re-derives the same
    // vectors through winningOptionIndex, so the two planes can only drift by failing CI
    // — the eip712-vectors.json mechanism, applied to the bucket map [review 2026-09-03].
    string internal constant OUTCOME_VECTORS_PATH = "../packages/shared/src/outcome-vectors.json";

    function test_constructor_recordsDeployerAsProofGateway() public view {
        assertEq(league.proofGateway(), address(this));
    }

    function test_resolve_settlesCommittedMarketAndStoresResolution() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        vm.warp(c.sourceWindowOpen + 100);
        // 2.31%: past the 2.20/2.25/2.30 thresholds, short of 2.35 -> option 3 of 0-4.
        league.resolve(id, 231e14, c.sourceWindowOpen + 10);
        assertEq(uint8(league.stateOf(id)), uint8(MarketState.Resolved));
        LeagueCore.Resolution memory resolution = league.getResolution(id);
        assertEq(resolution.value, 231e14);
        assertEq(resolution.winningOption, 3);
        assertEq(resolution.occurredAt, c.sourceWindowOpen + 10);
        assertEq(resolution.resolvedAt, c.sourceWindowOpen + 100);
    }

    /// AC 3 (FR-16): the event alone carries the decoded value, the bucket it landed in
    /// and the event's own declared time — with the config already emitted at creation,
    /// the proof panel and `pnpm rebuild` need no private state to re-derive the outcome.
    function test_resolve_emitsMarketResolvedWithDerivationRecord() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        vm.expectEmit(true, true, true, true);
        emit LeagueCore.MarketResolved(id, league.sourceKeyOf(c), 231e14, 3, c.sourceWindowOpen + 10);
        league.resolve(id, 231e14, c.sourceWindowOpen + 10);
    }

    /// AD-20's negative: neither a stranger NOR a market creator reaches settled state —
    /// the only resolver is the gateway that deployed this contract, itself reachable
    /// only through the seven checks.
    function test_resolve_revertsForAnyCallerButTheGateway() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        vm.prank(STRANGER);
        vm.expectRevert(LeagueCore.NotProofGateway.selector);
        league.resolve(id, 231e14, c.sourceWindowOpen);
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.NotProofGateway.selector);
        league.resolve(id, 231e14, c.sourceWindowOpen);
    }

    /// Commitment precedes knowability (AD-14): a Created market has no committed pick-set
    /// to score against, so resolution is unrepresentable before commitPicks.
    function test_resolve_revertsOnCreatedMarket() public {
        (uint256 id, MarketConfig memory c) = _createdMarket();
        vm.expectRevert(LeagueCore.MarketNotResolvable.selector);
        league.resolve(id, 231e14, c.sourceWindowOpen);
    }

    /// Resolved is terminal (AD-19): the machine is monotone even for its one resolver.
    function test_resolve_revertsOnDoubleResolve() public {
        (uint256 id, MarketConfig memory c) = _committedMarket();
        league.resolve(id, 231e14, c.sourceWindowOpen);
        vm.expectRevert(LeagueCore.MarketNotResolvable.selector);
        league.resolve(id, 235e14, c.sourceWindowOpen);
    }

    function test_resolve_revertsOnUnknownMarket() public {
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.resolve(1, 231e14, T0);
    }

    /// The total value->option mapping, both edges of every threshold: each threshold is
    /// the INCLUSIVE lower edge of the bucket above it, outer buckets open-ended, so any
    /// int256 — negative yields included — lands in exactly one option (FR-7 honesty).
    /// Every vector comes from the SHARED fixture the TS mirror re-derives too.
    function test_winningOptionOf_reproducesEverySharedVector() public view {
        string memory json = vm.readFile(OUTCOME_VECTORS_PATH);
        uint256 count = json.readUint(".count");
        // The armed fixture carries every bucket, both threshold edges, and the
        // blind-verified reference receipt. A shrunken file must fail loudly.
        assertGe(count, 8, "outcome vectors file lost its armed set");
        for (uint256 i = 0; i < count; i++) {
            string memory p = string.concat(".vectors[", vm.toString(i), "]");
            int256 value = json.readInt(string.concat(p, ".value"));
            int256[] memory boundaries = json.readIntArray(string.concat(p, ".boundaries"));
            uint256 expected = json.readUint(string.concat(p, ".expected"));
            assertEq(
                uint256(league.winningOptionOf(value, boundaries)),
                expected,
                string.concat("bucket mismatch: ", json.readString(string.concat(p, ".name")))
            );
        }
    }

    /// The public mapper enforces the admission bound itself [review 2026-09-03]: it is
    /// callable with arbitrary arrays, and past 255 thresholds the uint8 narrowing
    /// would silently wrap — so out-of-range counts revert by name instead.
    function test_winningOptionOf_revertsOutsideAdmissionBounds() public {
        vm.expectRevert(LeagueCore.BoundaryCountOutOfRange.selector);
        league.winningOptionOf(0, new int256[](0));
        vm.expectRevert(LeagueCore.BoundaryCountOutOfRange.selector);
        league.winningOptionOf(0, new int256[](6));
    }

    function test_getResolution_revertsWhenNotResolved() public {
        vm.expectRevert(LeagueCore.UnknownMarket.selector);
        league.getResolution(1);
        (uint256 id,) = _committedMarket();
        vm.expectRevert(LeagueCore.NotResolved.selector);
        league.getResolution(id);
    }
}
