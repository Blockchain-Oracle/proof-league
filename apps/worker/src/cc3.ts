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

// §9: WORKER_PRIVATE_KEY_1 signs every worker duty (void, settlement, season); keys 2-3
// are the funded siblings the AD-7 ledger meters, optional until an account-role split
// earns its keep. Boot-time zod validation (CONVENTIONS §9): a malformed key refuses to
// start, never half-runs; the regex-checked string is the template type by construction.
const workerKeySchema = z
  .string({ error: "WORKER_PRIVATE_KEY_1 is required once a LeagueCore deployment is configured" })
  .regex(/^0x[0-9a-fA-F]{64}$/, "WORKER_PRIVATE_KEY_1 must be a 0x-prefixed 32-byte hex key")
  .transform((key) => key as `0x${string}`);

export const readWorkerKey = (env: Record<string, string | undefined>): `0x${string}` =>
  workerKeySchema.parse(env.WORKER_PRIVATE_KEY_1);

/// Every funded worker account address, derived from the configured keys (1 required when
/// a deployment exists, 2-3 whenever present). The escrow account is deliberately absent:
/// its key is never loaded by any service (§9), which is the NFR-3 segregation.
export const readWorkerAccounts = (env: Record<string, string | undefined>): `0x${string}`[] => {
  const accounts: `0x${string}`[] = [privateKeyToAccount(readWorkerKey(env)).address];
  for (const name of ["WORKER_PRIVATE_KEY_2", "WORKER_PRIVATE_KEY_3"]) {
    const raw = env[name];
    if (raw === undefined) continue;
    accounts.push(privateKeyToAccount(workerKeySchema.parse(raw)).address);
  }
  return accounts;
};

export const cc3Clients = (rpcUrl: string, privateKey: `0x${string}`): Cc3Clients => {
  const account = privateKeyToAccount(privateKey);
  return {
    publicClient: createPublicClient({ chain: creditCoin3Testnet, transport: http(rpcUrl) }),
    walletClient: createWalletClient({ account, chain: creditCoin3Testnet, transport: http(rpcUrl) }),
  };
};
