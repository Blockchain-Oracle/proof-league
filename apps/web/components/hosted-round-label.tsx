import { DEPLOYED } from "@proof-league/chain";
import { Mark } from "./marks.js";

// The AD-11 luck-round copy law, in the one file the overclaim scan allowlists for it.
// A Hosted Round is a draw, not a contest of skill, and saying so plainly is a product
// requirement rather than a disclaimer: a player who mistakes chance for edge has been
// misled by us. The mechanism sentence travels with the claim, which is the condition
// under which that phrase is allowed to appear at all.

/// A Hosted Round is identified by chain config, never by a flag someone could set: its
/// source event is the deployed ContestSource contract.
export const isHostedRound = (emitter: string): boolean =>
  DEPLOYED.contestSource !== undefined && emitter.toLowerCase() === DEPLOYED.contestSource.toLowerCase();

export function HostedRoundLabel() {
  return (
    <aside className="border-l-2 border-waiting bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="text-waiting">
          <Mark id="proof-league" size={14} />
        </span>
        <span className="font-data text-[11px] uppercase tracking-widest text-waiting">Hosted Round</span>
      </div>
      <p className="mt-2 font-display text-sm font-bold">Zero skill, zero operator influence.</p>
      <p className="mt-1 font-body text-sm text-ink-muted">
        The skill league is the daily Markets. This round is a draw: the outcome comes from the
        hash of a block that had not been mined when the round was created, so it is provably fair
        in the only sense that means anything, and neither we nor any player can grind or choose
        it. Every option is exactly one fifth, which makes the round break even by construction.
      </p>
    </aside>
  );
}
