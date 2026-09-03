import { logger } from "./logger.js";
// Self-rescheduling loop with a re-entrancy guard (CONVENTIONS §2, the zk-freighter indexer
// pattern): a failed round logs and reschedules, never kills the loop. Story 2.8 adds the
// AD-7 watchdog: if a round outlives every per-phase timeout combined, the guard is force-
// released and the round abandoned to epoch arithmetic — a hung RPC can never wedge the
// loop permanently, and /health exposes the release count so the drill can see it fire.
const LOOP_INTERVAL_MS = 15_000; // frequent enough to catch a 12:00:11 UTC event well inside the attestation wait
// Longer than the worst honest round (every phase timeout in sequence across a handful of
// keys); anything still running past this is a wedge, not work.
const ROUND_WATCHDOG_MS = 10 * 60_000;

let running = false;
let roundEpoch = 0;
let roundStartedMs = 0;
let lastTickMs = 0;
let wedgeReleases = 0;
let lastRoundDurationMs = 0;

export const lastLoopTickAgeMs = (): number => (lastTickMs === 0 ? -1 : Date.now() - lastTickMs);

export const loopHealth = (): { lastLoopTickAgeMs: number; wedgeReleases: number; lastRoundDurationMs: number } => ({
  lastLoopTickAgeMs: lastLoopTickAgeMs(),
  wedgeReleases,
  lastRoundDurationMs,
});

export type LoopRound = () => Promise<void>;

export const startLoop = (round: LoopRound): void => {
  const tick = async (): Promise<void> => {
    lastTickMs = Date.now();
    if (running && Date.now() - roundStartedMs > ROUND_WATCHDOG_MS) {
      // Watchdog release: bump the epoch so the abandoned round's finally block can
      // neither clear the guard under its replacement nor fork the timer chain.
      wedgeReleases++;
      roundEpoch++;
      running = false;
      logger.error(`[worker] watchdog released a wedged round after ${ROUND_WATCHDOG_MS}ms`);
    }
    // Re-entrancy guard: a slow round must delay the next round, not overlap it — overlapping
    // rounds double-submit transactions.
    if (running) return schedule();
    running = true;
    roundStartedMs = Date.now();
    const epoch = ++roundEpoch;
    try {
      await round();
    } catch (error) {
      // The loop survives every round failure; the failure itself is the alert's job, not the
      // scheduler's death.
      logger.error({ err: error }, "[worker] round failed");
    } finally {
      if (epoch === roundEpoch) {
        running = false;
        lastRoundDurationMs = Date.now() - roundStartedMs;
        schedule();
      }
      // A zombie round (epoch moved on) does nothing: the live tick chain is its
      // replacement's, and the next round re-reads truth from chain and cursors.
    }
  };
  const schedule = (): void => {
    setTimeout(() => void tick(), LOOP_INTERVAL_MS);
  };
  void tick();
};
