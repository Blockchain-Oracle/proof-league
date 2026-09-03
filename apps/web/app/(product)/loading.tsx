// Real waiting is the one sanctioned ambient state (REFERENCE-DESIGN §6).
export default function Loading() {
  return (
    <div className="py-16">
      <p className="animate-pulse font-data text-xs uppercase tracking-widest text-ink-muted motion-reduce:animate-none">
        Loading
      </p>
    </div>
  );
}
