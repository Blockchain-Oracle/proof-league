// UI grammar sweep (Story 3.1; CONVENTIONS §2/§7): (a) the multi-word chip strings render
// only in StateChip and shared market-state — any other appearance is a second renderer;
// (b) raw @media queries live only in the owned globals.css (Tailwind's responsive
// utilities are the one breakpoint vocabulary everywhere else).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execSync("git ls-files -co --exclude-standard -- 'apps/web/**/*.ts' 'apps/web/**/*.tsx' 'apps/web/**/*.css'", {
  encoding: "utf8",
}).split("\n").filter(Boolean);
const CHIP = /awaiting attestation|proof verified/;
const errors = [];
const read = (f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } };
for (const f of files) {
  const t = read(f);
  if (CHIP.test(t) && f !== "apps/web/components/state-chip.tsx") errors.push(`${f}: chip string outside StateChip`);
  if (/@media/.test(t) && f !== "apps/web/app/globals.css") errors.push(`${f}: ad hoc @media outside the owned theme file`);
}
for (const e of errors) console.error(`ui-grammar-sweep: ${e}`);
process.exit(errors.length ? 1 : 0);
