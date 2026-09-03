// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MarketConfig, Pick} from "./LeagueTypes.sol";

// Declared at file scope so both LeagueCore's admission loop and the canonical mapper
// below can revert with the one error the conformance suites pin (same selector either
// way: custom-error selectors ignore declaration scope).
error BoundaryCountOutOfRange();

/// LeagueCanon — the three pure canonical mappings both planes mirror, pre-split from
/// LeagueCore.sol (CONVENTIONS §1). Each has exactly one TS twin held identical by a
/// shared-vector CI gate: hashPickLeaf <-> packages/shared/src/pick.ts (eip712-vectors),
/// winningOptionOf <-> outcome.ts (outcome-vectors), sourceKeyOf <-> the worker's key
/// derivation. LeagueCore keeps public wrappers, so the on-chain ABI surface the suites
/// and the gateway read is unchanged; internal-library functions inline at compile time,
/// so there is no deployed address and nothing to mis-wire (AD-20's ethos).
library LeagueCanon {
    // EIP-712 (AD-5). The domain name/version mirror PICK_DOMAIN_NAME/VERSION in
    // packages/shared/src/pick.ts; the typehash string must match viem's derivation of
    // PICK_TYPES field-for-field or the conformance suite goes red.
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant DOMAIN_NAME_HASH = keccak256(bytes("ProofLeague"));
    bytes32 private constant DOMAIN_VERSION_HASH = keccak256(bytes("1"));
    bytes32 private constant PICK_TYPEHASH = keccak256(
        "Pick(address player,uint256 marketId,uint8 optionIndex,uint16 stake,uint32 nonce,uint32 utcDay,uint16 stakedSoFarInDay)"
    );

    /// The canonical merkle leaf of one signed Pick: its full EIP-712 digest, domain
    /// included, so a leaf provable under one deployment's root can never verify against
    /// another's (AD-5). Domain parameters are explicit — scoring binds them to
    /// (block.chainid, address(core)); the conformance suite binds them to the shared
    /// vectors' recorded domains.
    function hashPickLeaf(uint256 chainId, address verifyingContract, Pick calldata pick)
        internal
        pure
        returns (bytes32)
    {
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, DOMAIN_NAME_HASH, DOMAIN_VERSION_HASH, chainId, verifyingContract)
        );
        // The canonical abi.encode leaf layout (ARCH8): typehash then the seven message
        // fields in schema order, each padded to a full word.
        bytes32 structHash = keccak256(
            abi.encode(
                PICK_TYPEHASH,
                pick.player,
                pick.marketId,
                pick.optionIndex,
                pick.stake,
                pick.nonce,
                pick.utcDay,
                pick.stakedSoFarInDay
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    /// The total value->option mapping (FR-7 honesty): N-1 strictly ascending thresholds
    /// carve N buckets with open-ended outer ones, each threshold the INCLUSIVE lower
    /// edge of the bucket above it — option i wins exactly when
    /// boundaries[i-1] <= value < boundaries[i]. Mirrored by winningOptionIndex in
    /// packages/shared/src/outcome.ts; the emitted resolution lets `pnpm rebuild` diff
    /// the two planes (AD-8).
    function winningOptionOf(int256 value, int256[] memory boundaries) internal pure returns (uint8) {
        // The core's wrapper is public as the canonical mapper, so the admission bound is
        // enforced here too: past 255 thresholds the uint8 narrowing below would silently
        // wrap for an unvalidated caller-supplied array [review 2026-09-03].
        if (boundaries.length < 1 || boundaries.length > 5) revert BoundaryCountOutOfRange();
        uint256 crossed;
        for (uint256 i = 0; i < boundaries.length; i++) {
            if (value >= boundaries[i]) crossed++;
        }
        // Never truncates: the guard above caps thresholds at 5.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint8(crossed);
    }

    /// The AD-4 fan-out key: one accepted proof settles every market indexed here.
    /// Memory, not calldata, so resolve can key its event from the stored config.
    function sourceKeyOf(MarketConfig memory config) internal pure returns (bytes32) {
        return keccak256(abi.encode(config.sourceChainKey, config.emitter, config.eventSignature, config.subjectFilter));
    }
}
