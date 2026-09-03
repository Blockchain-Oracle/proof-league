import { SectionHead } from "../../../components/shell/section-head.js";

// Story 3.1 ships the shell and this route's honest pre-story state; the full surface
// lands with its own story. Server Component by default (AD-23).
export default function Page() {
  return (
    <div className="py-10">
      <SectionHead number="04" title="League" accent="the standings" />
      <p className="max-w-xl font-body text-sm text-ink-muted">The League table renders the season standings from the class-1 projection: points, streaks and the tie-break keys the chain itself verifies at payout.</p>
    </div>
  );
}
