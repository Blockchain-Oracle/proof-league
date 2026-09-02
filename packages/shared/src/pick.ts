import { hashTypedData, type Address, type Hex } from "viem";

// EIP-712 Pick schema (AD-5). The domain is part of the security boundary, not UI configuration:
// chainId and verifyingContract come from packages/chain at call sites so a Pick signed for one
// deployment can never verify against another.
export const PICK_DOMAIN_NAME = "ProofLeague";
export const PICK_DOMAIN_VERSION = "1";

// Field order is part of the canonical encoding — it must match LeagueCore's abi.encode leaf
// layout exactly; the CI conformance fixture (armed with Solidity vectors in Story 2.2) holds it.
export const PICK_TYPES = {
  Pick: [
    { name: "player", type: "address" },
    { name: "marketId", type: "uint256" },
    { name: "optionIndex", type: "uint8" },
    { name: "stake", type: "uint16" },
    { name: "nonce", type: "uint32" },
    { name: "utcDay", type: "uint32" },
    { name: "stakedSoFarInDay", type: "uint16" },
  ],
} as const;

export type PickMessage = {
  readonly player: Address;
  readonly marketId: bigint;
  readonly optionIndex: number;
  readonly stake: number;
  readonly nonce: number;
  readonly utcDay: number;
  readonly stakedSoFarInDay: number;
};

export type PickDomain = {
  readonly chainId: number;
  readonly verifyingContract: Address;
};

// The one hashing implementation both planes share (AD-2): web signing and worker verification
// call this exact function, so a second divergent encoding cannot exist.
export const hashPick = (domain: PickDomain, pick: PickMessage): Hex =>
  hashTypedData({
    domain: {
      name: PICK_DOMAIN_NAME,
      version: PICK_DOMAIN_VERSION,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: PICK_TYPES,
    primaryType: "Pick",
    message: {
      player: pick.player,
      marketId: pick.marketId,
      optionIndex: pick.optionIndex,
      stake: pick.stake,
      nonce: pick.nonce,
      utcDay: pick.utcDay,
      stakedSoFarInDay: pick.stakedSoFarInDay,
    },
  });
