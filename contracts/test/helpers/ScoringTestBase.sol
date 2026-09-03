// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeagueCoreTestBase} from "./LeagueCoreTestBase.sol";
import {MarketConfig, Pick} from "../../src/LeagueTypes.sol";
import {PickSetMerkle} from "../../src/PickSetMerkle.sol";

/// Shared Story 2.5 harness: builds committed pick sets and drives scoreBatch. The
/// PAIRING and SIBLING-WALK here are an independent Solidity re-derivation of the canon,
/// so a fold bug in PickSetMerkle's verifier cannot be self-confirmed by proofs from
/// the same code path; depthOf and commitmentRootOf ARE shared with the verifier — that
/// coupling is backstopped by the TS-built pickset-vectors gate, which pins both
/// independently [review 2026-09-03].
abstract contract ScoringTestBase is LeagueCoreTestBase {
    // Ascending addresses on purpose: the committed sort is (player asc, nonce asc), so
    // ALICE < BOB < CARA keeps fixture ordering legible.
    address internal constant ALICE = address(uint160(0xA01));
    address internal constant BOB = address(uint160(0xB02));
    address internal constant CARA = address(uint160(0xC03));
    uint32 internal constant UTC_DAY = 20699;

    function _pick(address player, uint256 marketId, uint8 option, uint16 stake, uint32 nonce, uint16 soFar)
        internal
        pure
        returns (Pick memory)
    {
        return Pick({
            player: player,
            marketId: marketId,
            optionIndex: option,
            stake: stake,
            nonce: nonce,
            utcDay: UTC_DAY,
            stakedSoFarInDay: soFar
        });
    }

    function _leavesOf(Pick[] memory picks) internal view returns (bytes32[] memory leaves) {
        leaves = new bytes32[](picks.length);
        for (uint256 i = 0; i < picks.length; i++) {
            // External self-call so the memory picks cross into the calldata signature.
            leaves[i] = league.hashPickLeaf(block.chainid, address(league), picks[i]);
        }
    }

    function _paddedRow(bytes32[] memory leaves) private pure returns (bytes32[] memory row) {
        // forge-lint: disable-next-line(incorrect-shift)
        row = new bytes32[](1 << PickSetMerkle.depthOf(leaves.length));
        for (uint256 i = 0; i < leaves.length; i++) {
            row[i] = leaves[i];
        }
    }

    function _foldOnce(bytes32[] memory row) private pure returns (bytes32[] memory next) {
        next = new bytes32[](row.length / 2);
        for (uint256 i = 0; i < next.length; i++) {
            next[i] = keccak256(abi.encodePacked(row[2 * i], row[2 * i + 1]));
        }
    }

    function _treeRootOf(bytes32[] memory leaves) internal pure returns (bytes32) {
        bytes32[] memory row = _paddedRow(leaves);
        while (row.length > 1) {
            row = _foldOnce(row);
        }
        return row[0];
    }

    function _proofFor(bytes32[] memory leaves, uint256 index) internal pure returns (bytes32[] memory proof) {
        uint256 depth = PickSetMerkle.depthOf(leaves.length);
        proof = new bytes32[](depth);
        bytes32[] memory row = _paddedRow(leaves);
        uint256 idx = index;
        for (uint256 level = 0; level < depth; level++) {
            proof[level] = row[idx ^ 1];
            row = _foldOnce(row);
            idx >>= 1;
        }
    }

    /// Commit a market's set as the worker would: size-bound root for a non-empty set,
    /// the canonical empty root otherwise. Callers create ALL markets before the first
    /// commit — the shared baseline config is born-locked once time passes lockTime.
    function _commitPickSet(uint256 marketId, MarketConfig memory c, Pick[] memory picks) internal {
        bytes32 root = picks.length == 0
            ? PickSetMerkle.EMPTY_ROOT
            : PickSetMerkle.commitmentRootOf(_treeRootOf(_leavesOf(picks)), picks.length);
        if (block.timestamp < c.lockTime) vm.warp(c.lockTime);
        vm.prank(WORKER);
        league.commitPicks(marketId, root, URI, SHA);
    }

    /// The test contract deployed the core, so it IS the recorded proofGateway and can
    /// land resolutions directly (the LeagueCoreResolve.t.sol pattern).
    function _resolveTo(uint256 marketId, int256 value) internal {
        league.resolve(marketId, value, uint64(block.timestamp));
    }

    /// One contiguous batch of [start, start + count) out of the full set.
    function _scoreSlice(uint256 marketId, Pick[] memory all, uint256 start, uint256 count) internal {
        bytes32[] memory leaves = _leavesOf(all);
        Pick[] memory batch = new Pick[](count);
        bytes32[][] memory proofs = new bytes32[][](count);
        for (uint256 i = 0; i < count; i++) {
            batch[i] = all[start + i];
            proofs[i] = _proofFor(leaves, start + i);
        }
        league.scoreBatch(marketId, start, batch, proofs, all.length, _treeRootOf(leaves));
    }

    function _scoreAll(uint256 marketId, Pick[] memory all) internal {
        _scoreSlice(marketId, all, 0, all.length);
    }

    /// Precomputed full-set batch arguments, for tests that must place vm.expectEmit
    /// IMMEDIATELY before league.scoreBatch — the cheatcode binds to the next external
    /// call, and the leaf hashing inside _scoreSlice is itself a call.
    function _preparedBatch(Pick[] memory all)
        internal
        view
        returns (bytes32[][] memory proofs, uint256 leafCount, bytes32 treeRoot)
    {
        bytes32[] memory leaves = _leavesOf(all);
        proofs = new bytes32[][](all.length);
        for (uint256 i = 0; i < all.length; i++) {
            proofs[i] = _proofFor(leaves, i);
        }
        leafCount = all.length;
        treeRoot = _treeRootOf(leaves);
    }

    /// A market on an arbitrary leagueDay whose windows hang off NOW, so fixtures stay
    /// creatable after earlier markets already warped past their own locks.
    function _createOnDay(uint32 leagueDay) internal returns (uint256 id, MarketConfig memory c) {
        c = _validConfig();
        c.leagueDay = leagueDay;
        // forge-lint: disable-next-line(unsafe-typecast)
        c.lockTime = uint64(block.timestamp) + 1 hours;
        c.sourceWindowOpen = c.lockTime + league.MIN_COMMIT_MARGIN();
        c.determinismHorizon = c.sourceWindowOpen;
        c.voidDeadline = c.sourceWindowOpen + 24 hours;
        vm.prank(OPERATOR);
        id = league.createMarket(c);
    }

    /// Created -> Committed -> Resolved in one move for suites that don't probe the
    /// intermediate states. Value 231e14 lands in option 3 of the baseline boundaries.
    function _readyOnDay(uint32 leagueDay, Pick[] memory picks) internal returns (uint256 id) {
        MarketConfig memory c;
        (id, c) = _createOnDay(leagueDay);
        for (uint256 i = 0; i < picks.length; i++) {
            picks[i].marketId = id;
        }
        _commitPickSet(id, c, picks);
        _resolveTo(id, 231e14);
    }

    function _scoredReadyMarket(Pick[] memory picks) internal returns (uint256 id) {
        return _readyOnDay(1, picks);
    }
}
