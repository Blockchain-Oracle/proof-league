// Secret-scan (CONVENTIONS §8, ≤20 lines): keys live in platform stores only; a committed key ends the trust story.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const PATTERNS = [
  // Raw EVM private keys are regex-identical to tx hashes and EIP-712 digests, so this pattern
  // skips docs/ (evidence docs cite tx hashes) and the generated conformance fixtures (public
  // digests and merkle nodes; the selftests re-derive both files, proving they are generator
  // output, never hand-edited).
  {
    rx: /0x[0-9a-fA-F]{64}(?![0-9a-fA-F])/,
    skipDocs: true,
    skipFiles: ["packages/shared/src/eip712-vectors.json", "packages/shared/src/pickset-vectors.json"],
  },
  { rx: /sb_secret_[A-Za-z0-9_-]{10,}/ },      // Supabase new-format secret key
  { rx: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { rx: /gh[pos]_[A-Za-z0-9]{30,}/ },           // GitHub tokens
];
// --others --exclude-standard: untracked files scan too, or a new file passes locally
// and reddens CI on its first push (watched happen, Story 2.3 [review 2026-09-02]).
const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" }).split("\n").filter(Boolean);
const hits = [];
for (const f of files) {
  let text = ""; try { text = readFileSync(f, "utf8"); } catch { continue; }
  for (const { rx, skipDocs, skipFiles } of PATTERNS) {
    if ((skipDocs && /^docs\//.test(f)) || skipFiles?.includes(f)) continue;
    if (rx.test(text)) hits.push(`${f}: matches ${rx}`);
  }
}
for (const h of hits) console.error(`secret-scan: ${h}`);
process.exit(hits.length ? 1 : 0);
