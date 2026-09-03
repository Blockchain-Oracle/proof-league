import type { Address } from "viem";

// Deployed contract addresses. Empty until the first deployment; filled by the deploy step and
// never hardcoded anywhere else. A missing address is a typed absence, not a zero-address lie.
export type DeployedContracts = {
  readonly leagueCore?: Address;
  readonly proofGateway?: Address;
  readonly contestSource?: Address;
};

export const DEPLOYED: DeployedContracts = {
  // Sepolia, 2026-09-03, worker1 nonce 0 (tx 0x4c664e7159794b6beb4d6e65610bf412e653ebc1cd912c9b62fa6e87eb65b3ef),
  // creators = worker1..3, source verified on eth-sepolia.blockscout.com (0.8.28, paris).
  contestSource: "0x8334889B9c068e57078Da3376087ee2b7A7fd42B",
};
