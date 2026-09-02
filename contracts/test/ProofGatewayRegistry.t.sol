// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {LeagueCore} from "../src/LeagueCore.sol";
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
        league = new LeagueCore(ops);
        gateway = new ProofGateway(league, ops);
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

    // ---- constructor refusals: no post-deploy fix path exists (AD-20) ----

    function test_constructor_rejectsEmptyRegistrarSet() public {
        vm.expectRevert(ProofGateway.InvalidRegistrarSet.selector);
        new ProofGateway(league, new address[](0));
    }

    function test_constructor_rejectsZeroRegistrarEntry() public {
        address[] memory regs = new address[](2);
        regs[0] = OPERATOR;
        regs[1] = address(0);
        vm.expectRevert(ProofGateway.InvalidRegistrarSet.selector);
        new ProofGateway(league, regs);
    }

    function test_constructor_rejectsZeroLeagueCore() public {
        address[] memory regs = new address[](1);
        regs[0] = OPERATOR;
        vm.expectRevert(ProofGateway.ZeroLeagueCore.selector);
        new ProofGateway(LeagueCore(address(0)), regs);
    }
}
