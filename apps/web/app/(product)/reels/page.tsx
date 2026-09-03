import { SectionHead } from "../../../components/shell/section-head.js";

// Story 3.1 ships the shell and this route's honest pre-story state; the full surface
// lands with its own story. Server Component by default (AD-23).
export default function Page() {
  return (
    <div className="py-10">
      <SectionHead number="02" title="Reels" accent="one market at a time" />
      <p className="max-w-xl font-body text-sm text-ink-muted">Reels arrive with their story: one Market filling the viewport, real distribution facts and the canonical composer within reach.</p>
    </div>
  );
}
