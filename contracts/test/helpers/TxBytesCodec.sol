// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";

/// Builds prover `txBytes` in the EvmV1 envelope — abi.encode(uint8 txType, bytes[] chunks)
/// with the receipt in the last chunk — so tests exercise the gateway through the same
/// decode path (EvmV1Decoder.decodeReceiptFields) the real proven payload takes.
library TxBytesCodec {
    /// Type-2 shape: three chunks. The gateway reads only the type byte, the chunk count
    /// and the receipt chunk, so the tx-field chunks carry inert zeros / empty bytes.
    function encode(uint8 receiptStatus, EvmV1Decoder.LogEntry[] memory logs) internal pure returns (bytes memory) {
        bytes[] memory chunks = new bytes[](3);
        chunks[0] = abi.encode(uint64(0), uint64(0), address(0), false, address(0), uint256(0), bytes(""));
        chunks[1] = bytes("");
        // LogEntry encodes identically to the LogEntryTuple the decoder expects (same
        // field layout; struct names are invisible to abi.encode).
        chunks[2] = abi.encode(receiptStatus, uint64(0), logs, bytes(""));
        return abi.encode(uint8(2), chunks);
    }

    function singleLog(address emitter, bytes32[] memory topics, bytes memory data)
        internal
        pure
        returns (EvmV1Decoder.LogEntry[] memory logs)
    {
        logs = new EvmV1Decoder.LogEntry[](1);
        logs[0] = EvmV1Decoder.LogEntry({address_: emitter, topics: topics, data: data});
    }
}
