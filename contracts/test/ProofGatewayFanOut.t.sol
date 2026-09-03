// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {StdStorage, stdStorage} from "forge-std/Test.sol";
import {LeagueCore, MarketConfig, MarketState} from "../src/LeagueCore.sol";
import {ProofGateway} from "../src/ProofGateway.sol";
import {IProofDecoder} from "../src/IProofDecoder.sol";
import {TxBytesCodec} from "./helpers/TxBytesCodec.sol";
import {LidoReceiptFixture} from "./helpers/LidoReceiptFixture.sol";
import {GatewayTestBase} from "./helpers/GatewayTestBase.sol";

/// Story 2.4 — the resolution fan-out (FR-14, AD-4): one accepted proof resolves every
/// Committed market on its sourceKey in the same transaction, each through its own
/// decoderId and boundaries, with non-Committed siblings skipped and the full
/// derivation record emitted (FR-16). The two market families are real readings of the
/// blind-verified reference receipt: the rate-ratio yield (the base's _lidoConfig) and
/// the sharesMintedAsFees figure, decoded from the same words by different decoders.
contract ProofGatewayFanOutTest is GatewayTestBase {
    using stdStorage for StdStorage;

    uint32 internal feesDecoderId;

    function setUp() public override {
        super.setUp();
        // Deployed before the prank (the base's footgun note applies here too).
        SharesMintedDecoder fees = new SharesMintedDecoder();
        vm.prank(OPERATOR);
        feesDecoderId = gateway.registerDecoder(address(fees));
    }

    /// The tips-and-fees market on the SAME sourceKey as _lidoConfig (identical four
    /// source fields — only decoder and boundaries differ, and neither is part of the
    /// key): thresholds at 40 and 50 shares, and the receipt's 55.77 crosses both —
    /// option 2.
    function _feesConfig() internal view returns (MarketConfig memory c) {
        c = _lidoConfig();
        int256[] memory b = new int256[](2);
        b[0] = 40e18;
        b[1] = 50e18;
        c.decoderId = feesDecoderId;
        c.payoutN = 3;
        c.boundaries = b;
    }

    // Sibling fixtures create BOTH markets before any warp (creation at a sibling's
    // lockTime would be BornLocked) and build each config before its prank (the
    // MIN_COMMIT_MARGIN view call inside a config builder would consume it otherwise).
    function _create(MarketConfig memory c) internal returns (uint256 marketId) {
        vm.prank(OPERATOR);
        marketId = league.createMarket(c);
    }

    function _commit(uint256 marketId, string memory uri) internal {
        vm.prank(OPERATOR);
        league.commitPicks(marketId, bytes32(0), uri, keccak256(bytes(uri)));
    }

    function _referenceTx() internal pure returns (bytes memory) {
        return TxBytesCodec.encode(
            1, TxBytesCodec.singleLog(LidoReceiptFixture.STETH, LidoReceiptFixture.topics(), LidoReceiptFixture.data())
        );
    }

    // ---- AC 1 + AC 3: both siblings resolve in one tx, each via its own decoder and
    // boundaries, with the full derivation record emitted (FR-14, FR-16) ----

    function test_verify_resolvesYieldAndFeesSiblingsInOneTransaction() public {
        MarketConfig memory yield = _lidoConfig();
        uint256 yieldId = _create(yield);
        uint256 feesId = _create(_feesConfig());
        vm.warp(yield.lockTime);
        _commit(yieldId, "supabase://picksets/yield.json");
        _commit(feesId, "supabase://picksets/fees.json");
        bytes32 key = league.sourceKeyOf(yield);
        bytes memory txBytes = _armed(_referenceTx());

        // The emitted surface, in creation order, then the acceptance: decoded value,
        // bucket and the event's own time per market — with each MarketCreated config
        // already on-chain, `pnpm rebuild` re-derives every field from events alone.
        uint64 occurredAt = uint64(LidoReceiptFixture.REPORT_TIMESTAMP);
        vm.expectEmit(true, true, true, true, address(league));
        emit LeagueCore.MarketResolved(yieldId, key, LidoReceiptFixture.EXPECTED_VALUE_1E18, 1, occurredAt);
        vm.expectEmit(true, true, true, true, address(league));
        emit LeagueCore.MarketResolved(feesId, key, int256(LidoReceiptFixture.SHARES_MINTED_AS_FEES), 2, occurredAt);
        vm.expectEmit(true, false, false, true, address(gateway));
        emit ProofGateway.ProofAccepted(key, MAINNET_CHAIN_KEY, HEIGHT, occurredAt);
        _verify(key, txBytes);

        // Both terminal, each on its own decoder's reading of the same proven words.
        assertEq(uint8(league.stateOf(yieldId)), uint8(MarketState.Resolved));
        assertEq(uint8(league.stateOf(feesId)), uint8(MarketState.Resolved));
        LeagueCore.Resolution memory yieldRes = league.getResolution(yieldId);
        assertEq(yieldRes.value, LidoReceiptFixture.EXPECTED_VALUE_1E18);
        assertEq(yieldRes.winningOption, 1);
        LeagueCore.Resolution memory feesRes = league.getResolution(feesId);
        assertEq(feesRes.value, int256(LidoReceiptFixture.SHARES_MINTED_AS_FEES));
        assertEq(feesRes.winningOption, 2);
        // One budget unit: the whole fan-out consulted the precompile exactly once.
        assertEq(_mock().verifyCallCount(), 1);
        assertEq(gateway.acceptedAt(key), uint64(block.timestamp));
    }

    // ---- AC 2: non-Committed siblings skip, never revert (AD-4 isolation) ----

    /// The voided-sibling negative, testable before Story 2.6 ships void(): the sibling's
    /// state slot is forced to the Voided enum value AD-19 will mint, through the same
    /// stateOf surface the fan-out reads. Created FIRST, so the loop must survive it
    /// before reaching the healthy market — a revert on the voided sibling would fail
    /// this verify, and that is exactly what the AC forbids.
    function test_verify_voidedSiblingNeverRevertsTheSettle() public {
        MarketConfig memory yield = _lidoConfig();
        uint256 voidedId = _create(yield);
        uint256 healthyId = _create(_feesConfig());
        vm.warp(yield.lockTime);
        _commit(voidedId, "supabase://picksets/voided.json");
        _commit(healthyId, "supabase://picksets/healthy.json");
        stdstore.target(address(league)).sig(league.stateOf.selector).with_key(voidedId)
            .checked_write(uint256(MarketState.Voided));

        bytes32 key = league.sourceKeyOf(_lidoConfig());
        bytes memory txBytes = _armed(_referenceTx());
        _verify(key, txBytes);

        assertEq(uint8(league.stateOf(healthyId)), uint8(MarketState.Resolved));
        // Voided stays terminal: skipped by the fan-out, untouched by the settle.
        assertEq(uint8(league.stateOf(voidedId)), uint8(MarketState.Voided));
        assertGt(gateway.acceptedAt(key), 0);
    }

    function test_verify_neverCommittedSiblingIsSkippedAndStaysCreated() public {
        // Created first, never committed: the loop must pass over it to settle the rest.
        MarketConfig memory yield = _lidoConfig();
        uint256 createdId = _create(yield);
        uint256 committedId = _create(_feesConfig());
        vm.warp(yield.lockTime);
        _commit(committedId, "supabase://picksets/fees.json");

        bytes32 key = league.sourceKeyOf(yield);
        bytes memory txBytes = _armed(_referenceTx());
        _verify(key, txBytes);

        assertEq(uint8(league.stateOf(committedId)), uint8(MarketState.Resolved));
        // Its commit window was missed, so its only remaining path is void (AD-14/AD-19).
        assertEq(uint8(league.stateOf(createdId)), uint8(MarketState.Created));
    }

    /// A pre-open sibling forfeits its own resolution, nothing else — and ProofAccepted's
    /// occurredAt is the first RESOLVED market's reading, so a skipped sibling never
    /// supplies the recorded event time.
    function test_verify_preOpenSiblingIsSkippedWhileOpenSiblingResolves() public {
        // Window opens one second after the report's own declared time: pre-open for
        // this market alone (windows are per-market; the sourceKey fields are shared).
        MarketConfig memory preOpen = _lidoConfig();
        preOpen.lockTime = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) - 299;
        preOpen.sourceWindowOpen = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) + 1;
        preOpen.determinismHorizon = preOpen.sourceWindowOpen;
        preOpen.voidDeadline = preOpen.sourceWindowOpen + 24 hours;
        MarketConfig memory open = _feesConfig();
        open.lockTime = uint64(LidoReceiptFixture.REPORT_TIMESTAMP) - 300;
        open.sourceWindowOpen = uint64(LidoReceiptFixture.REPORT_TIMESTAMP);
        open.determinismHorizon = open.sourceWindowOpen;
        open.voidDeadline = open.sourceWindowOpen + 24 hours;

        uint256 preOpenId = _create(preOpen);
        uint256 openId = _create(open);
        // preOpen.lockTime is one second inside open's window too: both commits are legal here.
        vm.warp(preOpen.lockTime);
        _commit(preOpenId, "supabase://picksets/pre.json");
        _commit(openId, "supabase://picksets/open.json");

        bytes32 key = league.sourceKeyOf(preOpen);
        bytes memory txBytes = _armed(_referenceTx());
        vm.expectEmit(true, false, false, true, address(gateway));
        emit ProofGateway.ProofAccepted(key, MAINNET_CHAIN_KEY, HEIGHT, uint64(LidoReceiptFixture.REPORT_TIMESTAMP));
        _verify(key, txBytes);

        assertEq(uint8(league.stateOf(openId)), uint8(MarketState.Resolved));
        assertEq(uint8(league.stateOf(preOpenId)), uint8(MarketState.Committed));
    }

    // ---- the resolver gate, seen from outside the pair (AD-20) ----

    /// The one fact this file adds over LeagueCoreResolve.t.sol's gate negatives (which
    /// run with the test contract AS the resolver): under the SHIPPED wiring — core
    /// deployed by the gateway — even the market creator who committed the picks cannot
    /// reach settled state.
    function test_resolve_rejectsMarketCreatorUnderShippedWiring() public {
        MarketConfig memory yield = _lidoConfig();
        uint256 marketId = _create(yield);
        vm.warp(yield.lockTime);
        _commit(marketId, "supabase://picksets/yield.json");
        vm.prank(OPERATOR);
        vm.expectRevert(LeagueCore.NotProofGateway.selector);
        league.resolve(marketId, 23e15, uint64(LidoReceiptFixture.REPORT_TIMESTAMP));
    }

    /// The fan-out's occurredAt convention, pinned [review 2026-09-03]: every decoder
    /// registered for one event family must extract the same occurredAt from the same
    /// log, or ProofAccepted's stamp and check 6's window verdicts would depend on
    /// market creation order across heterogeneous decoders. AD-3 admission attests
    /// this off-chain; here the two live readings of the reference receipt prove it
    /// for the shipped registry.
    function test_decoders_agreeOnOccurredAtForSharedLog() public view {
        (, uint64 lidoTime) = IProofDecoder(gateway.decoderOf(lidoDecoderId))
            .decode(LidoReceiptFixture.topics(), LidoReceiptFixture.data());
        (, uint64 feesTime) = IProofDecoder(gateway.decoderOf(feesDecoderId))
            .decode(LidoReceiptFixture.topics(), LidoReceiptFixture.data());
        assertEq(lidoTime, feesTime);
        assertEq(lidoTime, uint64(LidoReceiptFixture.REPORT_TIMESTAMP));
    }
}

/// The second market family on the reference receipt (AC 1's tips-and-fees reading):
/// decodes sharesMintedAsFees from the same words the yield decoder cross-multiplies —
/// same proven log, its own derivation, so the fan-out demonstrably applies each
/// market's own decoderId rather than one scalar answer to every sibling. Guards
/// mirror LidoRateRatioDecoder's hygiene [review 2026-09-03]: a stand-in that
/// truncated where the real decoder reverts would prove the wrong contract.
contract SharesMintedDecoder is IProofDecoder {
    // The six non-indexed words, exactly; anything else is not this event's data.
    uint256 private constant REBASE_DATA_WORDS = 6;

    error MalformedRebaseLog();

    function decode(bytes32[] calldata topics, bytes calldata data)
        external
        pure
        returns (int256 value, uint64 occurredAt)
    {
        if (topics.length < 2 || data.length != REBASE_DATA_WORDS * 32) revert MalformedRebaseLog();
        uint256 reportTimestamp = uint256(topics[1]);
        if (reportTimestamp > type(uint64).max) revert MalformedRebaseLog();
        (,,,,, uint256 sharesMintedAsFees) = abi.decode(data, (uint256, uint256, uint256, uint256, uint256, uint256));
        if (sharesMintedAsFees > uint256(type(int256).max)) revert MalformedRebaseLog();
        // Both narrowings guarded above.
        // forge-lint: disable-start(unsafe-typecast)
        value = int256(sharesMintedAsFees);
        occurredAt = uint64(reportTimestamp);
        // forge-lint: disable-end(unsafe-typecast)
    }
}
