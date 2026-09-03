// Per-phase timeouts (AD-7): a hung RPC call can never wedge the re-entrancy-guarded loop.
// The underlying promise cannot be cancelled — the timeout releases the ROUND, and the
// orphaned call is left to settle into the void; the next round re-reads truth from chain
// and the cursor, so an orphan that eventually succeeded is re-observed, never lost.

export class PhaseTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`phase '${label}' exceeded its ${ms}ms timeout`);
    this.name = "PhaseTimeoutError";
  }
}

export const withPhaseTimeout = async <T>(label: string, ms: number, work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PhaseTimeoutError(label, ms)), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

// Watch and attest are read bursts; prove may rebuild continuity from raw blocks (the
// fallback's honest cost); submit includes the receipt wait on CC3's ~15s blocks.
export const PHASE_TIMEOUT_MS = {
  watch: 60_000,
  attest: 30_000,
  prove: 300_000,
  submit: 180_000,
} as const;
