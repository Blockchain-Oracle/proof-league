// Machine-writes packages/chain/src/abis/*.ts from the forge artifacts, so the worker's
// viem call surface can never drift from the compiled contracts: CI regenerates them
// right after forge build and diffs them against the committed copies (the shared-vectors
// freshness pattern, review 2026-09-02). Regenerate locally:
//   cd contracts && forge build && cd .. && node scripts/abi-export.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const EXPORTS = [
  { artifact: "LeagueCore", file: "league-core.ts", name: "leagueCoreAbi" },
  { artifact: "ContestSource", file: "contest-source.ts", name: "contestSourceAbi" },
  { artifact: "ProofGateway", file: "proof-gateway.ts", name: "proofGatewayAbi" },
];

mkdirSync("packages/chain/src/abis", { recursive: true });
for (const { artifact, file, name } of EXPORTS) {
  const json = JSON.parse(readFileSync(`contracts/out/${artifact}.sol/${artifact}.json`, "utf8"));
  const header =
    `// Machine-written by scripts/abi-export.mjs from the forge ${artifact} artifact - do not edit.\n` +
    "// Freshness-gated in CI next to forge build (regenerate: node scripts/abi-export.mjs).\n";
  writeFileSync(
    `packages/chain/src/abis/${file}`,
    `${header}export const ${name} = ${JSON.stringify(json.abi, null, 2)} as const;\n`,
  );
  console.log(`abi-export: ${name} written (${json.abi.length} entries)`);
}
