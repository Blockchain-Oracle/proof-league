import { formatUtc } from "@proof-league/shared";
import { YouBar } from "../../../components/league/you-bar.js";
import { AvatarTile } from "../../../components/shell/account.js";
import { shortAddress } from "../../../lib/format.js";
import { chainClock } from "../../../lib/chain-clock.js";
import { standings } from "../../../lib/league-data.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { nextToLockOf } from "../../../lib/market-view.js";

// LEAGUE (Masayume's leaderboard shape, on the felt): the season stamp and the next lock,
// the podium, the field, and a sticky bar for your own seat. Names show up once cards
// settle; an empty board says so instead of seating anyone.

export const dynamic = "force-dynamic";

const SEASON_END = "17 SEP";
const ORDINAL = ["1ST", "2ND", "3RD"];

export default async function LeaguePage() {
  const clock = await chainClock();
  const [rows, views] = await Promise.all([standings(), boardMarketViews(clock.chainNowSec)]);
  const next = nextToLockOf(views);
  const podium = rows.slice(0, 3);
  const field = rows.slice(3);
  return (
    <div className="flex flex-col gap-10 px-4 py-8 pb-32 md:px-10 md:py-12">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">The league</h1>
          <span className="font-serif text-[26px] italic text-gold">genesis season</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-data text-[10.5px] tracking-[.12em] text-felt-3">
          <span className="beat-plate rounded-md border-2 border-ink-green px-3 py-1 font-bold text-ink-green">SEASON 01 · ENDS {SEASON_END}</span>
          <span className="self-center">{next === undefined ? "NO CARD OPEN RIGHT NOW" : `NEXT CARD LOCKS ${formatUtc(next.lockTime).slice(11, 16)} UTC`}</span>
          <span className="self-center">{rows.length} SEAT{rows.length === 1 ? "" : "S"} RANKED</span>
        </div>
      </section>

      {rows.length === 0 ? (
        <p className="max-w-[480px] font-body text-[14px] leading-relaxed text-felt-1">
          No seat is ranked yet. The board ranks seats by points the chain has actually scored, so names show up once cards settle.
        </p>
      ) : (
        <>
          <section>
            <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">01 · THE PODIUM</div>
            <div className="grid gap-3 md:grid-cols-3">
              {podium.map((row, index) => (
                <div key={row.player} className={`rounded-[16px] border-2 p-4 ${index === 0 ? "border-gold bg-gold/10" : "border-white/20 bg-black/25"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[22px] font-extrabold tracking-[-.03em] text-gold">{ORDINAL[index]}</span>
                    <span className="font-data text-[9px] tracking-[.14em] text-felt-3">{index === 0 ? "GRAND CHAMPION" : index === 1 ? "CHALLENGER" : "CONTENDER"}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <AvatarTile address={row.player} className="h-[30px] w-[30px]" />
                    <span className="font-data text-[11px] text-stock">{shortAddress(row.player)}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="font-display text-[30px] font-extrabold leading-none tracking-[-.03em] text-stock">{row.seasonPoints}<span className="ml-1 font-data text-[9px] tracking-[.14em] text-felt-3">PTS</span></span>
                    <span className="medallion flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink-green font-display text-[14px] font-extrabold text-ink-green" title="Streak">{row.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {field.length > 0 ? (
            <section>
              <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">02 · THE FIELD · RANKS 04 TO {String(rows.length).padStart(2, "0")}</div>
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {field.map((row) => (
                  <li key={row.player} className="flex items-center gap-4 py-3">
                    <span className="w-8 font-display text-[16px] font-extrabold text-felt-2">#{row.rank}</span>
                    <AvatarTile address={row.player} className="h-6 w-6 rounded-[7px]" />
                    <span className="font-data text-[11px] text-stock">{shortAddress(row.player)}</span>
                    <span className="ml-auto font-display text-[16px] font-extrabold text-stock">{row.seasonPoints}</span>
                    <span className="w-14 text-right font-data text-[9.5px] tracking-[.1em] text-felt-3">STREAK {row.streak}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <p className="max-w-[520px] font-data text-[9px] leading-[1.8] tracking-[.08em] text-felt-4">
        RANKED BY SEASON POINTS, THEN STREAK, THEN EARLIEST COMMIT. READ FROM THE CHAIN PROJECTION; NOTHING HERE IS ESTIMATED.
      </p>
      <YouBar rows={rows} />
    </div>
  );
}
