import type { Address } from "viem";

// Deployed contract addresses. Empty until the first deployment; filled by the deploy step and
// never hardcoded anywhere else. A missing address is a typed absence, not a zero-address lie.
export type DeployedContracts = {
  // The CC3 entry point [decision 2026-09-03]: the gateway deploys its own LeagueCore, so
  // off-chain config records ONLY the gateway and derives the core via gateway.leagueCore() —
  // an independently-configured core could have any deployer as its resolver, which no
  // constructor check can refuse.
  readonly proofGateway?: Address;
  // The gateway's deployment block: every log scan (projector, rebuild, season watcher)
  // starts here instead of genesis, so a fresh consumer never pages the whole chain.
  readonly deployBlock?: number;
  readonly contestSource?: Address;
  // Registry ids on the deployed gateway, recorded at registration (Story 5.4) so the worker
  // and verify scripts never guess which append-only id maps to which decoder shape.
  readonly contestRoundDecoderId?: number;
  readonly lidoRateRatioDecoderId?: number;
};

export const DEPLOYED: DeployedContracts = {
  // Creditcoin 3 testnet, 2026-09-03: deployed by scripts in apps/worker/src/deploy.ts.
  // The gateway deployed its own LeagueCore (0xFe8C5438..) — derive it via
  // gateway.leagueCore(), never configure it here. Season: end 1789603200, escrow
  // is the segregated fourth account, pool 0 until the manual pre-window funding step.
  proofGateway: "0x4549fbd1acf45cf46f29b3adb6b052880c8040ec",
  deployBlock: 5423291,
  contestSource: "0x8334889B9c068e57078Da3376087ee2b7A7fd42B",
  lidoRateRatioDecoderId: 1,
  contestRoundDecoderId: 2,
};
