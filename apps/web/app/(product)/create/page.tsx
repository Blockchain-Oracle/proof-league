import { SectionHead } from "../../../components/shell/section-head.js";

// Story 3.1 ships the shell and this route's honest pre-story state; the full surface
// lands with its own story. Server Component by default (AD-23).
export default function Page() {
  return (
    <div className="py-10">
      <SectionHead number="03" title="Create" accent="your own market" />
      <p className="max-w-xl font-body text-sm text-ink-muted">Market creation opens here with its story. Every created market locks its boundaries on-chain before anyone can commit a Pick.</p>
    </div>
  );
}
