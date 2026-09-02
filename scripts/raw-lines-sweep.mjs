// Raw-source cap 400 (CONVENTIONS §1): catches CSS/SQL/config/Solidity that eslint's 300-line TS law cannot see.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const ROOTS = ["apps", "packages", "contracts/src", "scripts"];
const EXTS = [".css", ".sql", ".sol", ".mjs", ".json", ".yml", ".yaml", ".ts", ".tsx"];
const SKIP = ["node_modules", ".next", "dist", "out", "cache"];
// pnpm-lock and generated ABI artifacts are machine-written; capping them punishes nobody's craft.
const EXEMPT = [/pnpm-lock\.yaml$/, /package-lock\.json$/, /\/abis\//];
const CAP = 400;
const walk = (d) => readdirSync(d).flatMap((n) => {
  if (SKIP.includes(n)) return [];
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const offenders = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } })
  .filter((p) => EXTS.some((e) => p.endsWith(e)) && !EXEMPT.some((rx) => rx.test(p)))
  .map((p) => [p, readFileSync(p, "utf8").split("\n").length])
  .filter(([, n]) => n > CAP);
for (const [p, n] of offenders) console.error(`raw-lines: ${p} has ${n} lines (cap ${CAP})`);
process.exit(offenders.length ? 1 : 0);
