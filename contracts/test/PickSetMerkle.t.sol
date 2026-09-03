// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {PickSetMerkle} from "../src/PickSetMerkle.sol";

/// Story 2.5 — the pick-set tree canon vs packages/shared pickset-merkle.ts (AD-4/AD-5).
/// The vectors file's trees are the TS builder's; this suite re-verifies every proof and
/// both root bindings from PickSetMerkle.sol's own index-walk, so the two constructions
/// can only drift by failing CI. The mutation tests prove the gate can go red: position,
/// size and every sibling must all move the verdict.
contract PickSetMerkleConformanceTest is Test {
    using stdJson for string;

    string internal constant VECTORS_PATH = "../packages/shared/src/pickset-vectors.json";

    string internal json;

    function setUp() public {
        json = vm.readFile(VECTORS_PATH);
    }

    function _tree(uint256 t)
        internal
        view
        returns (uint256 leafCount, bytes32[] memory leaves, bytes32 treeRoot, bytes32 commitmentRoot)
    {
        string memory p = string.concat(".trees[", vm.toString(t), "]");
        leafCount = json.readUint(string.concat(p, ".leafCount"));
        leaves = json.readBytes32Array(string.concat(p, ".leaves"));
        treeRoot = json.readBytes32(string.concat(p, ".treeRoot"));
        commitmentRoot = json.readBytes32(string.concat(p, ".commitmentRoot"));
    }

    function _proof(uint256 t, uint256 i) internal view returns (bytes32[] memory) {
        return json.readBytes32Array(
            string.concat(".trees[", vm.toString(t), "].proofs[", vm.toString(i), "]")
        );
    }

    // The library takes calldata proofs; the external self-call is the memory bridge.
    function processProofExt(uint256 leafCount, uint256 index, bytes32 leaf, bytes32[] calldata proof)
        external
        pure
        returns (bytes32)
    {
        return PickSetMerkle.processProof(leafCount, index, leaf, proof);
    }

    function test_processProof_reproducesEverySharedVector() public view {
        uint256 count = json.readUint(".count");
        // The armed set carries the single leaf, a full row, both padding shapes and the
        // real-digest tree. A shrunken file must fail loudly, not pass emptily.
        assertGe(count, 5, "vectors file lost its armed set");
        for (uint256 t = 0; t < count; t++) {
            (uint256 leafCount, bytes32[] memory leaves, bytes32 treeRoot, bytes32 commitmentRoot) = _tree(t);
            assertEq(PickSetMerkle.commitmentRootOf(treeRoot, leafCount), commitmentRoot, "size binding drifted");
            for (uint256 i = 0; i < leafCount; i++) {
                assertEq(this.processProofExt(leafCount, i, leaves[i], _proof(t, i)), treeRoot, "proof drifted");
            }
        }
    }

    /// Position binding is the whole point (the scoring cursor rides on it): the same
    /// proof at any other in-range index must imply a different root.
    function test_processProof_bindsTheLeafToItsIndex() public view {
        uint256 count = json.readUint(".count");
        for (uint256 t = 0; t < count; t++) {
            (uint256 leafCount, bytes32[] memory leaves, bytes32 treeRoot,) = _tree(t);
            for (uint256 i = 0; i < leafCount; i++) {
                bytes32[] memory proof = _proof(t, i);
                for (uint256 other = 0; other < leafCount; other++) {
                    if (other == i) continue;
                    assertTrue(
                        this.processProofExt(leafCount, other, leaves[i], proof) != treeRoot,
                        "proof verified at a foreign index"
                    );
                }
            }
        }
    }

    function test_processProof_rejectsOutOfRangeIndexAndShortProof() public {
        // Tree 3 is five-leaves-padded: depth 3, so both guards have teeth.
        (uint256 leafCount, bytes32[] memory leaves, bytes32 treeRoot,) = _tree(3);
        bytes32[] memory proof = _proof(3, 0);

        vm.expectRevert(PickSetMerkle.LeafIndexOutOfRange.selector);
        this.processProofExt(leafCount, leafCount, leaves[0], proof);

        bytes32[] memory truncated = new bytes32[](proof.length - 1);
        for (uint256 i = 0; i < truncated.length; i++) {
            truncated[i] = proof[i + 1];
        }
        vm.expectRevert(PickSetMerkle.WrongProofLength.selector);
        this.processProofExt(leafCount, 0, leaves[0], truncated);

        // A padding slot is in the padded tree but outside the bound set: unprovable.
        vm.expectRevert(PickSetMerkle.LeafIndexOutOfRange.selector);
        this.processProofExt(leafCount, 7, bytes32(0), proof);

        // And a flipped sibling must move the implied root.
        bytes32[] memory mutated = _proof(3, 0);
        mutated[0] = mutated[0] ^ bytes32(uint256(1));
        assertTrue(this.processProofExt(leafCount, 0, leaves[0], mutated) != treeRoot, "sibling is dead weight");
    }
}
