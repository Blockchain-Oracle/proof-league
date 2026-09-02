// Secret-scan (CONVENTIONS §8, ≤20 lines): keys live in platform stores only; a committed key ends the trust story.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const PATTERNS = [
  // Raw EVM private keys are regex-identical to tx hashes, so this pattern skips docs/ (evidence
  // docs cite tx hashes); code and config must never contain either as a 32-byte literal.
  { rx: /0x[0-9a-fA-F]{64}(?![0-9a-fA-F])/, skipDocs: true },
  { rx: /sb_secret_[A-Za-z0-9_-]{10,}/ },      // Supabase new-format secret key
  { rx: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { rx: /gh[pos]_[A-Za-z0-9]{30,}/ },           // GitHub tokens
];
const files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
const hits = [];
for (const f of files) {
  let text = ""; try { text = readFileSync(f, "utf8"); } catch { continue; }
  for (const { rx, skipDocs } of PATTERNS) {
    if (skipDocs && /^docs\//.test(f)) continue;
    if (rx.test(text)) hits.push(`${f}: matches ${rx}`);
  }
}
for (const h of hits) console.error(`secret-scan: ${h}`);
process.exit(hits.length ? 1 : 0);
