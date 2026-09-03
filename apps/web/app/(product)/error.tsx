"use client";

// Segment error state (AD-23): persistent layout, plain words, a real retry in place.
// No red alarm styling; refusal is ink, border and copy (REFERENCE-DESIGN §2).
export default function SegmentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16">
      <p className="max-w-xl border-l-2 border-ink pl-4 font-body text-sm text-ink-muted">
        This view could not load. Nothing was lost; the chain record is unaffected.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 border border-rule px-4 py-1.5 font-display text-sm font-semibold hover:border-ink"
      >
        Try again
      </button>
    </div>
  );
}
