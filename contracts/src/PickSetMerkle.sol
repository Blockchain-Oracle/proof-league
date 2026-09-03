// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// PickSetMerkle — the canonical pick-set commitment tree (Story 2.5, AD-4/AD-5),
/// mirrored line-for-line by packages/shared/src/pickset-merkle.ts and held identical
/// by the pickset-vectors CI gate. Two deliberate deviations from the OpenZeppelin
/// MerkleProof idiom, both load-bearing:
///
/// 1. POSITION-BOUND pairing. OZ's processProof hashes sorted pairs, which erases leaf
///    position — fine for allowlists, fatal here: AD-5 makes the (player asc, nonce asc)
///    ordering PART of the commitment, and AD-4's contiguous scoring cursor is only sound
///    if a proof binds its leaf to one index. So pairing is by index parity (left||right,
///    never sorted), and verification walks the index's bits.
/// 2. SIZE-BOUND root. The cursor needs the set's length on-chain, but commitPicks
///    (Story 2.2, settled ABI) stores a single bytes32. So the committed root binds the
///    count: keccak256(abi.encode(treeRoot, leafCount)) — the Merkle-Mountain-Range
///    "root commits to size" construction — and every scoreBatch call must open it.
///
/// Leaves are full EIP-712 pick digests (LeagueCanon.hashPickLeaf), computed on-chain
/// from submitted fields — a forged leaf equal to an inner node would need a pick whose
/// digest collides with keccak of two siblings, i.e. a preimage break. Trees pad to the
/// next power of two with bytes32(0); a padding slot can never score because every index
/// is range-checked against the bound leafCount.
library PickSetMerkle {
    // The canonical zero-pick commitment (AD-14): state, not the root value, signals
    // committed, so the empty set needs no tree at all.
    bytes32 internal constant EMPTY_ROOT = bytes32(0);

    // Both planes' shared set-size ceiling [review 2026-09-03]: past 2^255 the depthOf
    // probe's shift wraps to 0 and loops to out-of-gas, and past 2^31 the TS mirror's
    // int32 index walk diverges — so the canon bounds leafCount itself (2^31 - 1 dwarfs
    // any real market) and scoring refuses larger openings at the door.
    uint256 internal constant MAX_LEAF_COUNT = 2 ** 31 - 1;

    error LeafIndexOutOfRange();
    error WrongProofLength();

    /// What commitPicks stores for a non-empty set: the tree root fused with the leaf
    /// count, so no scoring call can lie about either without failing the opening check.
    function commitmentRootOf(bytes32 treeRoot, uint256 leafCount) internal pure returns (bytes32) {
        return keccak256(abi.encode(treeRoot, leafCount));
    }

    /// Padded-tree depth: the unique d with 2^(d-1) < leafCount <= 2^d (0 for a single
    /// leaf). Proofs must carry exactly d siblings — a truncated proof is rejected, never
    /// silently accepted at a shallower tree. Callers hold leafCount <= MAX_LEAF_COUNT
    /// (scoring rejects larger openings), which keeps the probe terminating [review
    /// 2026-09-03: at leafCount > 2^255 the shift would wrap to 0 and never exit].
    function depthOf(uint256 leafCount) internal pure returns (uint256 depth) {
        // Shifting the CONSTANT by the variable is the intended power-of-two probe here
        // (the lint assumes the reverse).
        // forge-lint: disable-next-line(incorrect-shift)
        while ((1 << depth) < leafCount) {
            depth++;
        }
    }

    /// Folds a leaf up the tree along its index's bit path and returns the root it
    /// implies; the caller compares against the opened treeRoot. Index parity picks the
    /// side at each level (bit 0 = leaf is the left child), which is exactly what makes
    /// the proof position-binding. The two guards are defense-in-depth at the scoring
    /// call site (its batch-range check subsumes the first; a wrong-length proof would
    /// fold to a wrong root anyway) but load-bearing for any standalone caller, and the
    /// TS mirror carries them identically [review 2026-09-03].
    function processProof(uint256 leafCount, uint256 index, bytes32 leaf, bytes32[] calldata proof)
        internal
        pure
        returns (bytes32 node)
    {
        if (index >= leafCount) revert LeafIndexOutOfRange();
        if (proof.length != depthOf(leafCount)) revert WrongProofLength();
        node = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            node = (index & 1 == 1)
                ? keccak256(abi.encodePacked(proof[i], node))
                : keccak256(abi.encodePacked(node, proof[i]));
            index >>= 1;
        }
    }
}
