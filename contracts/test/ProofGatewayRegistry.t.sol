// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LeagueCore} from "../src/LeagueCore.sol";
import {SeasonParams} from "../src/LeagueSeason.sol";
import {ProofGateway} from "../src/ProofGateway.sol";

/// Story 2.3 — the decoder registry: append-only ids, never repointed, registrar-gated
/// at construction with no post-deploy mutator (AD-3, AD-20). Registration lives wholly
/// in the gateway — LeagueCore holds no decoder state, so "registering never touches
/// LeagueCore" is structural, not policed.
contract ProofGatewayRegistryTest is Test {
    LeagueCore internal league;
    ProofGateway internal gateway;

    address internal constant OPERATOR = address(0xA11CE);
    address internal constant STRANGER = address(0xBAD);
    address internal constant DECODER_A = address(0xDECA);
    address internal constant DECODER_B = address(0xDECB);

    function setUp() public {
        address[] memory ops = new address[](1);
        ops[0] = OPERATOR;
        gateway = new ProofGateway(ops, ops, _season());
        league = gateway.leagueCore();
        // Minimal bytecode so the fixture addresses pass the codeless-decoder refusal
        // [review 2026-09-02]; registry tests only exercise bookkeeping, never decode().
        vm.etch(DECODER_A, hex"00");
        vm.etch(DECODER_B, hex"00");
    }

    function test_registerDecoder_mintsSequentialIdsFromOne() public {
        vm.startPrank(OPERATOR);
        uint32 first = gateway.registerDecoder(DECODER_A);
        uint32 second = gateway.registerDecoder(DECODER_B);
        vm.stopPrank();
        assertEq(first, 1); // 0 stays MarketConfig's unset sentinel
        assertEq(second, 2);
        assertEq(gateway.decoderCount(), 2);
        assertEq(gateway.decoderOf(1), DECODER_A);
        assertEq(gateway.decoderOf(2), DECODER_B);
    }

    function test_registerDecoder_rejectsStranger() public {
        vm.prank(STRANGER);
        vm.expectRevert(ProofGateway.NotDecoderRegistrar.selector);
        gateway.registerDecoder(DECODER_A);
    }

    function test_registerDecoder_rejectsZeroAddress() public {
        vm.prank(OPERATOR);
        vm.expectRevert(ProofGateway.ZeroDecoderAddress.selector);
        gateway.registerDecoder(address(0));
    }

    /// A codeless address in a never-repointable registry would strand every market
    /// family pinned to its id — refused at registration [review 2026-09-02].
    function test_registerDecoder_rejectsCodelessAddress() public {
        vm.prank(OPERATOR);
        vm.expectRevert(ProofGateway.CodelessDecoder.selector);
        gateway.registerDecoder(address(0xF00D));
    }

    function test_registry_appendOnly_existingIdsNeverMove() public {
        vm.startPrank(OPERATOR);
        gateway.registerDecoder(DECODER_A);
        gateway.registerDecoder(DECODER_B);
        // Re-registering an address is a NEW id — there is no function in the ABI that
        // takes an existing id, so repointing is unrepresentable, not just forbidden.
        uint32 again = gateway.registerDecoder(DECODER_A);
        vm.stopPrank();
        assertEq(again, 3);
        assertEq(gateway.decoderOf(1), DECODER_A);
        assertEq(gateway.decoderOf(2), DECODER_B);
        assertEq(gateway.decoderOf(3), DECODER_A);
    }

    function test_decoderOf_unknownIdReverts() public {
        vm.expectRevert(ProofGateway.UnknownDecoder.selector);
        gateway.decoderOf(0);
        vm.prank(OPERATOR);
        gateway.registerDecoder(DECODER_A);
        vm.expectRevert(ProofGateway.UnknownDecoder.selector);
        gateway.decoderOf(2);
    }

    // Season horizon far past every registry warp; params refused per-field in
    // LeagueSeasonSurface's own suite.
    function _season() internal view returns (SeasonParams memory) {
        // forge-lint: disable-next-line(block-timestamp)
        return SeasonParams({seasonEnd: uint64(block.timestamp) + 3650 days, seasonEndDay: 100_000, escrow: address(0xE5C)});
    }

    // ---- constructor refusals and wiring: no post-deploy fix path exists (AD-20) ----

    function test_constructor_rejectsEmptyRegistrarSet() public {
        address[] memory ops = new address[](1);
        ops[0] = OPERATOR;
        vm.expectRevert(ProofGateway.InvalidRegistrarSet.selector);
        new ProofGateway(ops, new address[](0), _season());
    }

    function test_constructor_rejectsZeroRegistrarEntry() public {
        address[] memory ops = new address[](1);
        ops[0] = OPERATOR;
        address[] memory regs = new address[](2);
        regs[0] = OPERATOR;
        regs[1] = address(0);
        vm.expectRevert(ProofGateway.InvalidRegistrarSet.selector);
        new ProofGateway(ops, regs, _season());
    }

    /// Creator-set refusals live in LeagueCore's constructor and bubble up through the
    /// gateway's `new` — a creator-less deployment of the pair is refused as one unit.
    function test_constructor_rejectsEmptyCreatorSetFromLeagueCore() public {
        address[] memory regs = new address[](1);
        regs[0] = OPERATOR;
        vm.expectRevert(LeagueCore.InvalidCreatorSet.selector);
        new ProofGateway(new address[](0), regs, _season());
    }

    /// The 2026-09-03 wiring decision, held both ways: the gateway deployed the core in
    /// its constructor, and the core recorded that gateway as its one resolver — the
    /// mutual reference exists from the first block with no setter to mis-wire.
    function test_constructor_gatewayAndCoreReferenceEachOtherAtomically() public view {
        assertEq(league.proofGateway(), address(gateway));
        assertEq(address(gateway.leagueCore()), address(league));
    }
}
