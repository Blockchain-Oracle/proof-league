// Overclaim-scan (CONVENTIONS §8, mechanically specified): two steps.
// (a) docs: judge-facing prose may not use casino/certainty vocabulary; "provably fair" needs its mechanism sentence.
// (b) UI: apps/web string literals may not carry banned words, emoji, or em/en dashes (ADDENDUM §10).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const list = (glob) => execSync(`git ls-files -- ${glob}`, { encoding: "utf8" }).split("\n").filter(Boolean);
const read = (f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } };
const BANNED = /\b(guaranteed|risk-free|jackpot|casino|instant)\b/i;
const errors = [];
// (a) Judge-facing docs. docs/planning and docs/research are archival corpus copies (they QUOTE
// banned vocabulary while banning it), so only authored top-level docs and the README are scanned.
const judgeFacing = list("README.md 'docs/*.md'").filter((f) => !/^docs\/(planning|research)\//.test(f));
for (const f of judgeFacing) {
  const t = read(f);
  if (BANNED.test(t)) errors.push(`${f}: banned vocabulary (${t.match(BANNED)?.[0]})`);
  if (/provably fair/i.test(t) && !/blockhash|pre-committed block/i.test(t)) errors.push(`${f}: "provably fair" without its mechanism sentence`);
}
// (b) UI string literals. Allowlist: the Hosted Round label file carries the sanctioned "provably fair" chip.
const ALLOW = [/hosted-round-label\.tsx?$/];
for (const f of list("'apps/web/**/*.ts' 'apps/web/**/*.tsx'")) {
  if (ALLOW.some((rx) => rx.test(f))) continue;
  const strings = (read(f).match(/(["'`])(?:(?!\1)[^\\\n]|\\.)*\1/g) ?? []).join(" ");
  if (BANNED.test(strings)) errors.push(`${f}: banned word in UI string (${strings.match(BANNED)?.[0]})`);
  if (/[—–]/.test(strings)) errors.push(`${f}: em/en dash in UI string`);
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(strings)) errors.push(`${f}: emoji in UI string`);
}
for (const e of errors) console.error(`overclaim-scan: ${e}`);
process.exit(errors.length ? 1 : 0);
