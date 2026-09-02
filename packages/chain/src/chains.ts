// The single legal home of chain identity (AD-6). Everywhere else, chain ids and chainKeys are
// data imported from here; literals fail eslint. Pre-split from contracts.ts/endpoints.ts so no
// file grows toward the 300-line ceiling (CONVENTIONS §1, the zk-freighter networks.ts lesson).
import { creditCoin3Testnet, sepolia, mainnet } from "viem/chains";

export { creditCoin3Testnet, sepolia, mainnet };

export const CC3_CHAIN_ID = creditCoin3Testnet.id;
export const SEPOLIA_CHAIN_ID = sepolia.id;

// ChainInfo precompile: chainKeys are read from here at worker boot, never hardcoded from docs —
// the day-1 spike (gate 3) probes getSupportedChains() live to answer the Mainnet-Read Gate.
export const CHAIN_INFO_PRECOMPILE = "0x0000000000000000000000000000000000000fd3" as const;
// Attestcoin verifier precompile per the architecture spine.
export const VERIFIER_PRECOMPILE = "0x0000000000000000000000000000000000000fd2" as const;
