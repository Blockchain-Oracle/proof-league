// Self-rescheduling loop with a re-entrancy guard (CONVENTIONS §2, the zk-freighter indexer
// pattern): a failed round logs and reschedules, never kills the loop. Pipeline phases plug in
// as pure functions returning report objects (Story 2.8 owns them).
const LOOP_INTERVAL_MS = 15_000; // frequent enough to catch a 12:00:11 UTC event well inside the attestation wait

let running = false;
let lastTickMs = 0;

export const lastLoopTickAgeMs = (): number => (lastTickMs === 0 ? -1 : Date.now() - lastTickMs);

export type LoopRound = () => Promise<void>;

export const startLoop = (round: LoopRound): void => {
  const tick = async (): Promise<void> => {
    // Re-entrancy guard: a slow round must delay the next round, not overlap it — overlapping
    // rounds double-submit transactions.
    if (running) return schedule();
    running = true;
    lastTickMs = Date.now();
    try {
      await round();
    } catch (error) {
      // The loop survives every round failure; the failure itself is the alert's job, not the
      // scheduler's death.
      console.error("[worker] round failed", error);
    } finally {
      running = false;
      schedule();
    }
  };
  const schedule = (): void => {
    setTimeout(() => void tick(), LOOP_INTERVAL_MS);
  };
  void tick();
};
