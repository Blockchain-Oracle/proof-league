import { SectionHead } from "../../../components/shell/section-head.js";

// Story 3.1 ships the shell and this route's honest pre-story state; the full surface
// lands with its own story. Server Component by default (AD-23).
export default function Page() {
  return (
    <div className="py-10">
      <SectionHead number="05" title="Record" accent="the settled truth" />
      <p className="max-w-xl font-body text-sm text-ink-muted">Your Record lists every settled Pick with its proof. Correct and incorrect results get equal information density; nothing is hidden and nothing is staged.</p>
    </div>
  );
}
