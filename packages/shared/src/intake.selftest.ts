import { pino } from "pino";
import { admitPick, intakeState, type IntakeDraft, type IntakeMarket } from "./intake.js";
import { INTAKE_QUIET_PERIOD_SEC, utcDayOf } from "./time.js";

// Intake selftest (Story 3.3, AD-14/AD-15). The two rules the chain cannot check for
// itself are the ones this file exists for, and the third case below is the vector Story
// 2.5 asked the intake half to pin: a client that counts a pick's own superseded
// predecessor signs a cumulative that is too high, and LeagueScoring answers by skipping
// the player's FINAL word as OverBudget. That failure is silent on-chain, so it has to be
// loud here. CI runs this in the shared selftest chain.

const log = pino({ base: null });

const fail = (message: string): never => {
  log.error(`intake.selftest: ${message}`);
  process.exit(1);
};

const NOW = 1_788_400_000;
const DAY = utcDayOf(NOW);

const market: IntakeMarket = {
  marketId: "7",
  payoutN: 5,
  lockTimeSec: NOW + 3_600,
  state: "Created",
};

const expectRefusal = (result: { ok: boolean; error?: string }, refusal: string, label: string): void => {
  if (result.ok) return void fail(`${label}: admitted where ${refusal} was required`);
  if (result.error !== refusal) return void fail(`${label}: refused as ${String(result.error)}, expected ${refusal}`);
};

const main = (): void => {
  // -- the honest first Pick -----------------------------------------------------------
  const first = admitPick(
    { marketId: "7", optionIndex: 2, stake: 40, nonce: 0, utcDay: DAY, stakedSoFarInDay: 0 },
    market,
    [],
    NOW,
  );
  if (!first.ok) return void fail(`an honest first pick was refused as ${first.error}`);

  // -- a fabricated day is a fresh allowance, so the day is bound at the door -----------
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 2, stake: 40, nonce: 0, utcDay: DAY + 1, stakedSoFarInDay: 0 },
      market,
      [],
      NOW,
    ),
    "wrong-utc-day",
    "tomorrow's day signed today",
  );

  // -- THE vector: a pick's own superseded predecessor must not be counted --------------
  // The player staked 40 on market 7, then changes their mind on the same market. The
  // replacement's cumulative is 0, not 40: the pick it replaces stops being live the
  // moment this one does. Counting it would sign 40, and the chain would skip this pick.
  const supersededOnSameMarket: readonly IntakeDraft[] = [
    { marketId: "7", nonce: 0, stake: 40, utcDay: DAY },
  ];
  const replacement = admitPick(
    { marketId: "7", optionIndex: 4, stake: 40, nonce: 1, utcDay: DAY, stakedSoFarInDay: 0 },
    market,
    supersededOnSameMarket,
    NOW,
  );
  if (!replacement.ok) return void fail(`a correct replacement was refused as ${replacement.error}`);
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 4, stake: 40, nonce: 1, utcDay: DAY, stakedSoFarInDay: 40 },
      market,
      supersededOnSameMarket,
      NOW,
    ),
    "cumulative-mismatch",
    "a replacement counting its own predecessor",
  );

  // -- live stakes on OTHER markets do count -------------------------------------------
  const acrossMarkets: readonly IntakeDraft[] = [
    { marketId: "6", nonce: 0, stake: 30, utcDay: DAY },
    { marketId: "6", nonce: 1, stake: 50, utcDay: DAY }, // supersedes the 30 on market 6
    { marketId: "5", nonce: 2, stake: 0, utcDay: DAY }, // a tombstone holds no position
    { marketId: "4", nonce: 3, stake: 10, utcDay: DAY - 1 }, // yesterday's allowance
  ];
  const third = admitPick(
    { marketId: "7", optionIndex: 1, stake: 20, nonce: 4, utcDay: DAY, stakedSoFarInDay: 50 },
    market,
    acrossMarkets,
    NOW,
  );
  if (!third.ok) return void fail(`a correct cross-market cumulative was refused as ${third.error}`);
  const state = intakeState(acrossMarkets, DAY, "7");
  if (state.nextNonce !== 4) return void fail(`nextNonce ${state.nextNonce}, expected one past the highest`);
  if (state.stakedSoFarInDay !== 50) return void fail(`composer cumulative ${state.stakedSoFarInDay}, expected 50`);
  if (state.remaining !== 50) return void fail(`remaining ${state.remaining}, expected 50`);

  // -- the allowance is a ceiling, refused before it is signed rather than after --------
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 1, stake: 51, nonce: 4, utcDay: DAY, stakedSoFarInDay: 50 },
      market,
      acrossMarkets,
      NOW,
    ),
    "over-allowance",
    "a stake past the daily allowance",
  );

  // -- the clock and the market's own state --------------------------------------------
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 1, stake: 10, nonce: 0, utcDay: DAY, stakedSoFarInDay: 0 },
      market,
      [],
      market.lockTimeSec - INTAKE_QUIET_PERIOD_SEC,
    ),
    "intake-closed",
    "a pick arriving exactly at the quiet period",
  );
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 1, stake: 10, nonce: 0, utcDay: DAY, stakedSoFarInDay: 0 },
      { ...market, state: "Committed" },
      [],
      NOW,
    ),
    "market-not-open",
    "a pick on a committed market",
  );
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 5, stake: 10, nonce: 0, utcDay: DAY, stakedSoFarInDay: 0 },
      market,
      [],
      NOW,
    ),
    "option-out-of-range",
    "an option past the market's last one",
  );
  expectRefusal(
    admitPick(
      { marketId: "7", optionIndex: 1, stake: 10, nonce: 0, utcDay: DAY, stakedSoFarInDay: 0 },
      market,
      supersededOnSameMarket,
      NOW,
    ),
    "nonce-not-higher",
    "a replayed nonce",
  );

  log.info("intake.selftest: PASS (day binding, live-prefix cumulative, allowance, quiet period, nonce order)");
};

main();
