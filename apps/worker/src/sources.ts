import { JsonRpcProvider } from "ethers";
import { createPublicClient, http } from "viem";
import type { Chain, PublicClient, Transport } from "viem";
import { chainInfo } from "@gluwa/usc-sdk";
import { mainnet, sepolia, type Endpoints } from "@proof-league/chain";

// Chain identity is data, resolved at runtime (AD-6): chainKeys come from the ChainInfo
// precompile at worker boot, never from docs or literals. A market whose sourceChainKey
// is not in this map renders stuck with the honest reason — never a guess.

export type SourceChain = {
  readonly chainKey: number;
  readonly chainId: number;
  readonly label: string;
  readonly encoding: number; // EncodingVersion the chain advertises, fed to RawProofBuilder
  readonly viem: PublicClient<Transport, Chain>;
  readonly ethersRpc: JsonRpcProvider;
};

export type Sources = {
  readonly byChainKey: ReadonlyMap<number, SourceChain>;
  readonly chainInfoProvider: chainInfo.PrecompileChainInfoProvider;
};

export const resolveSources = async (endpoints: Endpoints): Promise<Sources> => {
  const cc3Rpc = new JsonRpcProvider(endpoints.CC3_RPC_URL);
  const provider = new chainInfo.PrecompileChainInfoProvider(cc3Rpc);
  const supported = await provider.getSupportedChains();
  // The two source chains the league admits (day-1 spike gate 3: mainnet branch OPEN,
  // Sepolia the committed fallback and Hosted Round home). Other advertised chains are
  // simply not configured — a market pointing at one gets the honest stuck reason.
  const known: readonly { chain: Chain; rpcUrl: string | undefined }[] = [
    { chain: mainnet, rpcUrl: endpoints.ETH_MAINNET_RPC_URL ?? mainnet.rpcUrls.default.http[0] },
    { chain: sepolia, rpcUrl: endpoints.SEPOLIA_RPC_URL },
  ];
  const byChainKey = new Map<number, SourceChain>();
  for (const entry of supported) {
    const match = known.find((k) => k.chain.id === Number(entry.chainId));
    if (!match || match.rpcUrl === undefined) continue;
    byChainKey.set(Number(entry.chainKey), {
      chainKey: Number(entry.chainKey),
      chainId: match.chain.id,
      label: match.chain.name,
      encoding: Number(entry.chainEncoding),
      viem: createPublicClient({ chain: match.chain, transport: http(match.rpcUrl) }),
      ethersRpc: new JsonRpcProvider(match.rpcUrl),
    });
  }
  return { byChainKey, chainInfoProvider: provider };
};

/// Binary search for the first block at or after a timestamp — the watch phase's entry
/// point into a source chain, run once per cursor and then persisted, so the log scan
/// never starts from genesis and never re-runs after a restart (AD-13).
export const findBlockAtOrAfter = async (
  client: PublicClient<Transport, Chain>,
  timestampSec: number,
): Promise<number> => {
  let hi = Number(await client.getBlockNumber());
  const head = await client.getBlock({ blockNumber: BigInt(hi) });
  if (Number(head.timestamp) < timestampSec) return hi; // window opens in the future: start at head
  let lo = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const block = await client.getBlock({ blockNumber: BigInt(mid) });
    if (Number(block.timestamp) < timestampSec) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
