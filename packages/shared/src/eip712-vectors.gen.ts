// Generates eip712-vectors.json — the shared Solidity<->TS conformance vectors (AD-5, ARCH8).
// The digests here are viem's (hashPick); the Foundry suite must reproduce every one from its
// own abi.encode leaf layout, so the two encodings can only drift by failing CI.
// Regenerate: pnpm --filter @proof-league/shared exec tsx src/eip712-vectors.gen.ts
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CC3_CHAIN_ID } from "@proof-league/chain";
import { hashPick, type PickDomain, type PickMessage } from "./pick.js";

// CC3 Testnet is the deployment target (chain id confirmed by the day-1 spike); the second
// domain binds a different chain+contract so domain separation is itself a recorded vector.
const CC3: PickDomain = {
  chainId: CC3_CHAIN_ID,
  verifyingContract: "0x8334889B9c068e57078Da3376087ee2b7A7fd42B",
};
const OTHER: PickDomain = {
  chainId: 31337,
  verifyingContract: "0x00000000000000000000000000000000DeaDBeef",
};

const representative: PickMessage = {
  player: "0xC8D9da124DCB6759da625461AA96BB74abbEF02b",
  marketId: 7n,
  optionIndex: 2,
  stake: 40,
  nonce: 3,
  utcDay: 20699,
  stakedSoFarInDay: 60,
};

const vectors = [
  { name: "representative", domain: CC3, pick: representative },
  {
    // Every field at its type ceiling: a width mismatch between the Solidity struct and the
    // EIP-712 schema shows up here, not in production.
    name: "type-ceilings",
    domain: CC3,
    pick: {
      player: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
      marketId: 2n ** 256n - 1n,
      optionIndex: 255,
      stake: 65535,
      nonce: 4294967295,
      utcDay: 4294967295,
      stakedSoFarInDay: 65535,
    } satisfies PickMessage,
  },
  {
    // Cancellation is a signed zero-stake tombstone (AD-5) — it must hash like any Pick.
    name: "zero-stake-tombstone",
    domain: CC3,
    pick: { ...representative, stake: 0, nonce: 4 },
  },
  { name: "domain-separation", domain: OTHER, pick: representative },
];

const out = {
  description:
    "EIP-712 Pick conformance vectors: digests computed by packages/shared hashPick (viem); contracts/test re-derives each via LeagueCore.hashPickLeaf. Regenerate with eip712-vectors.gen.ts.",
  domainName: "ProofLeague",
  domainVersion: "1",
  count: vectors.length,
  vectors: vectors.map(({ name, domain, pick }) => ({
    name,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
    pick: {
      player: pick.player,
      marketId: pick.marketId.toString(),
      optionIndex: pick.optionIndex,
      stake: pick.stake,
      nonce: pick.nonce,
      utcDay: pick.utcDay,
      stakedSoFarInDay: pick.stakedSoFarInDay,
    },
    digest: hashPick(domain, pick),
  })),
};

const target = fileURLToPath(new URL("./eip712-vectors.json", import.meta.url));
writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${out.count} vectors to ${target}`);
