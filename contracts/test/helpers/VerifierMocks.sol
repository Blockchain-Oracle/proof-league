// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {INativeQueryVerifier} from "@gluwa/usc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";

/// Stand-in for the 0xFD2 Native Query Verifier precompile (etched there via vm.etch).
/// A proof is genuine only if the exact (chainKey, height, txBytes) tuple was armed —
/// so a proof "verified" under another chainKey or with tampered bytes is rejected the
/// way the real precompile would reject a wrong-chain merkle/continuity chain.
contract MockNativeQueryVerifier {
    mapping(bytes32 => bool) private _armed;

    uint256 public verifyCallCount;
    uint64 public lastChainKey;
    uint64 public lastHeight;
    bytes32 public lastTxBytesHash;

    function arm(uint64 chainKey, uint64 height, bytes32 txBytesHash) external {
        _armed[keccak256(abi.encode(chainKey, height, txBytesHash))] = true;
    }

    function verifyAndEmit(
        uint64 chainKey,
        uint64 height,
        bytes calldata encodedTransaction,
        INativeQueryVerifier.MerkleProof calldata,
        INativeQueryVerifier.ContinuityProof calldata
    ) external returns (bool) {
        verifyCallCount++;
        lastChainKey = chainKey;
        lastHeight = height;
        lastTxBytesHash = keccak256(encodedTransaction);
        return _armed[keccak256(abi.encode(chainKey, height, keccak256(encodedTransaction)))];
    }
}

/// The spoofed-prover stand-in for check 7's negative test: approves everything, counts
/// consultations. The test proves the gateway never asks it — the verify ABI carries no
/// prover address, so the only trust path is the genuine precompile constant.
contract AlwaysTrueVerifier {
    uint256 public verifyCallCount;

    function verifyAndEmit(
        uint64,
        uint64,
        bytes calldata,
        INativeQueryVerifier.MerkleProof calldata,
        INativeQueryVerifier.ContinuityProof calldata
    ) external returns (bool) {
        verifyCallCount++;
        return true;
    }
}
