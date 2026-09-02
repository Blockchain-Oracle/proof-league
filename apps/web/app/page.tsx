// Honest pre-launch state: the real editorial landing is Story 3.2. Until the first on-chain
// settlement exists there is nothing to exhibit, and fabricating one is forbidden (FR-2).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-5xl font-bold">Proof League</h1>
      <p className="text-lg text-ink-muted">
        A prediction league where real Ethereum events are the matches and cryptographic proof is
        the referee. Free points, public records, no money.
      </p>
      <p className="border-l-2 border-brand pl-4 font-data text-sm">
        The league has not opened yet. The first proof-backed settlement will appear here when it
        is real.
      </p>
    </main>
  );
}
