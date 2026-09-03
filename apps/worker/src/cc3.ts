import { createPublicClient, createWalletClient, http } from "viem";
import type { Account, Chain, PublicClient, Transport, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { creditCoin3Testnet } from "@proof-league/chain";
import { z } from "zod";

// One place the worker builds its Creditcoin clients, shared by the loop's rounds and the
// verify:* evidence scripts, so every chain write goes through the same endpoint config.
export type Cc3Clients = {
  readonly publicClient: PublicClient<Transport, Chain>;
  readonly walletClient: WalletClient<Transport, Chain, Account>;
};

// §9: WORKER_PRIVATE_KEY_1 signs the void duty until Story 2.8's ledger assigns accounts.
// Boot-time zod validation (CONVENTIONS §9): a malformed key refuses to start, never
// half-runs; the regex-checked string is the template type by construction.
const workerKeySchema = z
  .string({ error: "WORKER_PRIVATE_KEY_1 is required once a LeagueCore deployment is configured" })
  .regex(/^0x[0-9a-fA-F]{64}$/, "WORKER_PRIVATE_KEY_1 must be a 0x-prefixed 32-byte hex key")
  .transform((key) => key as `0x${string}`);

export const readWorkerKey = (env: Record<string, string | undefined>): `0x${string}` =>
  workerKeySchema.parse(env.WORKER_PRIVATE_KEY_1);

export const cc3Clients = (rpcUrl: string, privateKey: `0x${string}`): Cc3Clients => {
  const account = privateKeyToAccount(privateKey);
  return {
    publicClient: createPublicClient({ chain: creditCoin3Testnet, transport: http(rpcUrl) }),
    walletClient: createWalletClient({ account, chain: creditCoin3Testnet, transport: http(rpcUrl) }),
  };
};
