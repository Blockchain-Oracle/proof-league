import { SectionHead } from "../../../components/shell/section-head.js";

// Story 3.1 ships the shell and this route's honest pre-story state; the full surface
// lands with its own story. Server Component by default (AD-23).
export default function Page() {
  return (
    <div className="py-10">
      <SectionHead number="06" title="Transparency" accent="observed, then proven" />
      <p className="max-w-xl font-body text-sm text-ink-muted">The transparency log shows the worker's phase timestamps for every settlement. Rows are labelled observed until the row that carries the on-chain transaction, which is proven.</p>
    </div>
  );
}
