// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";

/// The blind-verified reference receipt (FR-13): Lido's 2026-08-22 12:00:11 UTC rebase
/// report, tx 0x50c4ee80…9efe68 (full hash in docs/research event-catalog liveness
/// verdicts; truncated here because the secret-scan key pattern cannot tell a 32-byte
/// hash from a key outside docs/) at Ethereum mainnet block 25810661. Raw words fetched
/// from ethereum-rpc.publicnode.com on 2026-09-02; the 2.3785% APR target was derived
/// independently in the event-catalog research (2026-08-22) before this decoder
/// existed — reproducing it from these raw fields is the conformance claim, not a
/// self-check.
library LidoReceiptFixture {
    address internal constant STETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    // keccak-derived, not a hex literal: self-documents the event shape and was verified
    // byte-identical to the on-chain topic0 in the research (0xff08c3ef…, docs/research).
    bytes32 internal constant TOKEN_REBASED_SIG =
        keccak256("TokenRebased(uint256,uint256,uint256,uint256,uint256,uint256,uint256)");

    uint64 internal constant SOURCE_HEIGHT = 25810661;
    // 2026-08-22T12:00:11Z — the indexed reportTimestamp topic, check 6's occurredAt.
    uint256 internal constant REPORT_TIMESTAMP = 1787400011;

    uint256 internal constant TIME_ELAPSED = 86400;
    uint256 internal constant PRE_TOTAL_SHARES = 7713302907485298844613542;
    uint256 internal constant PRE_TOTAL_ETHER = 9581388839978816630252600;
    uint256 internal constant POST_TOTAL_SHARES = 7709768606259603421153178;
    uint256 internal constant POST_TOTAL_ETHER = 9577622655746937730279786;
    uint256 internal constant SHARES_MINTED_AS_FEES = 55770679817929887922;

    // ((postE/postS)/(preE/preS) - 1) * 365d/86400 in 1e18 fixed point = 2.3785% at the
    // 4-decimal display precision the research blind-verified.
    int256 internal constant EXPECTED_VALUE_1E18 = 23785407967424491;

    function topics() internal pure returns (bytes32[] memory t) {
        t = new bytes32[](2);
        t[0] = TOKEN_REBASED_SIG;
        t[1] = bytes32(REPORT_TIMESTAMP);
    }

    function data() internal pure returns (bytes memory) {
        return abi.encode(
            TIME_ELAPSED,
            PRE_TOTAL_SHARES,
            PRE_TOTAL_ETHER,
            POST_TOTAL_SHARES,
            POST_TOTAL_ETHER,
            SHARES_MINTED_AS_FEES
        );
    }

    function logEntry() internal pure returns (EvmV1Decoder.LogEntry memory) {
        return EvmV1Decoder.LogEntry({address_: STETH, topics: topics(), data: data()});
    }
}
