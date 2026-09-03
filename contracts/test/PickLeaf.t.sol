// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {LeagueCore, Pick} from "../src/LeagueCore.sol";

/// Story 2.2 AC 2 — the canonical abi.encode leaf layout vs packages/shared hashPick (AD-5,
/// ARCH8). The vectors file's digests are viem's; this suite re-derives every one from
/// LeagueCore's own encoding, so the two planes can only drift by failing CI. The mutation
/// test proves the gate can actually go red: every field, including both domain fields, must
/// move the digest.
contract PickLeafConformanceTest is Test {
    using stdJson for string;

    string internal constant VECTORS_PATH = "../packages/shared/src/eip712-vectors.json";

    LeagueCore internal league;
    string internal json;

    function setUp() public {
        address[] memory creators = new address[](1);
        creators[0] = address(0xA11CE);
        league = new LeagueCore(creators);
        json = vm.readFile(VECTORS_PATH);
    }

    function _vector(uint256 i)
        internal
        view
        returns (uint256 chainId, address verifyingContract, Pick memory pick, bytes32 digest)
    {
        string memory p = string.concat(".vectors[", vm.toString(i), "]");
        chainId = json.readUint(string.concat(p, ".chainId"));
        verifyingContract = json.readAddress(string.concat(p, ".verifyingContract"));
        digest = json.readBytes32(string.concat(p, ".digest"));
        // Narrowing casts are safe: the generator writes values already bounded by the
        // EIP-712 schema's field widths, and the ceilings vector exercises each maximum.
        // forge-lint: disable-start(unsafe-typecast)
        pick = Pick({
            player: json.readAddress(string.concat(p, ".pick.player")),
            marketId: json.readUint(string.concat(p, ".pick.marketId")),
            optionIndex: uint8(json.readUint(string.concat(p, ".pick.optionIndex"))),
            stake: uint16(json.readUint(string.concat(p, ".pick.stake"))),
            nonce: uint32(json.readUint(string.concat(p, ".pick.nonce"))),
            utcDay: uint32(json.readUint(string.concat(p, ".pick.utcDay"))),
            stakedSoFarInDay: uint16(json.readUint(string.concat(p, ".pick.stakedSoFarInDay")))
        });
        // forge-lint: disable-end(unsafe-typecast)
    }

    function test_hashPickLeaf_reproducesEverySharedVector() public view {
        uint256 count = json.readUint(".count");
        // The armed fixture carries at least: representative, type-ceilings, tombstone,
        // domain-separation. A shrunken file must fail loudly, not pass emptily.
        assertGe(count, 4, "vectors file lost its armed set");
        for (uint256 i = 0; i < count; i++) {
            (uint256 chainId, address verifyingContract, Pick memory pick, bytes32 digest) = _vector(i);
            assertEq(
                league.hashPickLeaf(chainId, verifyingContract, pick),
                digest,
                string.concat(
                    "digest mismatch: ", json.readString(string.concat(".vectors[", vm.toString(i), "].name"))
                )
            );
        }
    }

    /// The mutation base is selected by name, not position: if generator ordering ever
    /// changes and "type-ceilings" landed here, the +1 perturbations below would panic on
    /// overflow instead of failing meaningfully [review 2026-09-02].
    function _representativeIndex() internal view returns (uint256) {
        uint256 count = json.readUint(".count");
        for (uint256 i = 0; i < count; i++) {
            string memory name = json.readString(string.concat(".vectors[", vm.toString(i), "].name"));
            if (keccak256(bytes(name)) == keccak256("representative")) return i;
        }
        revert("representative vector missing from fixture");
    }

    /// Perturbing any single field — message or domain — must change the digest, or two
    /// different Picks (or two deployments) could share a leaf.
    function test_hashPickLeaf_everyFieldChangesTheDigest() public view {
        (uint256 chainId, address verifyingContract, Pick memory pick, bytes32 digest) =
            _vector(_representativeIndex());

        Pick memory m = pick;
        m.player = address(0xDEAD);
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "player is dead weight");
        m = pick;
        m.marketId += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "marketId is dead weight");
        m = pick;
        m.optionIndex += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "optionIndex is dead weight");
        m = pick;
        m.stake += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "stake is dead weight");
        m = pick;
        m.nonce += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "nonce is dead weight");
        m = pick;
        m.utcDay += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "utcDay is dead weight");
        m = pick;
        m.stakedSoFarInDay += 1;
        assertTrue(league.hashPickLeaf(chainId, verifyingContract, m) != digest, "stakedSoFarInDay is dead weight");

        assertTrue(league.hashPickLeaf(chainId + 1, verifyingContract, pick) != digest, "chainId is dead weight");
        assertTrue(league.hashPickLeaf(chainId, address(0xDEAD), pick) != digest, "verifyingContract is dead weight");
    }
}
