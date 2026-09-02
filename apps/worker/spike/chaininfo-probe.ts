// Day-1 spike gate 3: the Mainnet-Read Gate probe (Story 1.2). Resolves chainKeys at RUNTIME via
// the ChainInfo precompile because docs and the stale registry disagreed (research verdict:
// verify live before any demo depends on mainnet reads). Read-only: needs no funded account.
// Run: pnpm --filter @proof-league/worker exec tsx spike/chaininfo-probe.ts
import { JsonRpcProvider } from "ethers";
import { chainInfo } from "@gluwa/usc-sdk";
import { readEndpoints, sepolia, mainnet } from "@proof-league/chain";

const endpoints = readEndpoints(process.env);
const cc3 = new JsonRpcProvider(endpoints.CC3_RPC_URL);
const provider = new chainInfo.PrecompileChainInfoProvider(cc3);

const run = async (): Promise<void> => {
  const startedAt = new Date().toISOString();
  const chains = await provider.getSupportedChains();
  console.log(`probe started ${startedAt} against ${endpoints.CC3_RPC_URL}`);
  console.log("supported chains on CC3 testnet (live, not docs):");
  for (const c of chains) {
    console.log(`  chainKey=${c.chainKey} chainId=${c.chainId} name=${c.chainName} encoding=${c.chainEncoding}`);
  }

  // Mainnet-Read Gate verdict: is Ethereum mainnet (chainId 1) among the live source chains?
  const mainnetEntry = chains.find((c) => c.chainId === mainnet.id);
  const sepoliaEntry = chains.find((c) => c.chainId === sepolia.id);
  console.log(`\nMAINNET-READ GATE: ${mainnetEntry ? `OPEN (chainKey ${mainnetEntry.chainKey})` : "CLOSED - Sepolia branch fires"}`);
  console.log(`SEPOLIA: ${sepoliaEntry ? `supported (chainKey ${sepoliaEntry.chainKey})` : "MISSING - investigate immediately"}`);

  // Read-only first look at attestation freshness: latest attested source height vs the source
  // chain's live head. Not the FR-12 wall-clock measurement (that is hello-bridge, funded), but
  // an honest first bound on how far attestations trail the head.
  const sepoliaRpc = new JsonRpcProvider(endpoints.SEPOLIA_RPC_URL);
  const liveHead = await sepoliaRpc.getBlockNumber();
  if (sepoliaEntry) {
    const attested = await provider.getLatestAttestedHeightAndHash(sepoliaEntry.chainKey);
    if (attested.exists) {
      const lagBlocks = liveHead - attested.height;
      console.log(`\nsepolia head=${liveHead} latestAttested=${attested.height} lag=${lagBlocks} blocks (~${lagBlocks * 12}s at 12s blocks)`);
    } else {
      console.log("\nno attestation exists for the Sepolia chainKey yet");
    }
  }
  if (mainnetEntry) {
    const attestedMain = await provider.getLatestAttestedHeightAndHash(mainnetEntry.chainKey);
    console.log(
      attestedMain.exists
        ? `mainnet latestAttested=${attestedMain.height} (attestations flowing)`
        : "mainnet chainKey advertised but no attestation exists - treat gate as CLOSED in practice",
    );
  }
};

run().catch((error) => {
  console.error("probe failed:", error);
  process.exit(1);
});
