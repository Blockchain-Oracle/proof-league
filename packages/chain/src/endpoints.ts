import { z } from "zod";
import { creditCoin3Testnet, sepolia } from "viem/chains";

// Endpoint config is zod-validated at boot and readers take `env` as a parameter so they are
// checkable without mocks (CONVENTIONS §9, the zk-freighter pattern).
const endpointsSchema = z.object({
  CC3_RPC_URL: z.url().default(creditCoin3Testnet.rpcUrls.default.http[0]),
  SEPOLIA_RPC_URL: z.url().default(sepolia.rpcUrls.default.http[0]),
  ETH_MAINNET_RPC_URL: z.url().optional(),
  // Hosted Proof Builder is the primary prover (AD-7); the default is the SDK's documented
  // CC3 testnet service. RawProofBuilder remains the same-interface local fallback.
  PROVER_URL: z.url().default("https://prover.cc3-testnet.creditcoin.network"),
  EXPLORER_BASE_CC3: z.url().default(creditCoin3Testnet.blockExplorers.default.url),
  EXPLORER_BASE_SEPOLIA: z.url().default(sepolia.blockExplorers?.default.url ?? "https://sepolia.etherscan.io"),
});

export type Endpoints = z.infer<typeof endpointsSchema>;

export const readEndpoints = (env: Record<string, string | undefined>): Endpoints =>
  endpointsSchema.parse(env);
