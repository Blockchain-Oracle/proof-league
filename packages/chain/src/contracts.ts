import type { Address } from "viem";

// Deployed contract addresses. Empty until the first deployment; filled by the deploy step and
// never hardcoded anywhere else. A missing address is a typed absence, not a zero-address lie.
export type DeployedContracts = {
  readonly leagueCore?: Address;
  readonly proofGateway?: Address;
  readonly contestSource?: Address;
};

export const DEPLOYED: DeployedContracts = {};
