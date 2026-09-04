import { z } from "zod";
import { chainClock } from "../../../lib/chain-clock.js";
import { cardsFor } from "../../../lib/cards-data.js";

// A player's Cards, read against chain time (AD-10) so the stage each one reports is the
// stage the contract would agree with. Public data only: a draft is the player's own and
// a committed leaf is in the pinned set, so the read needs no session, only an address.

export const dynamic = "force-dynamic";

const query = z.object({ player: z.string().regex(/^0x[0-9a-fA-F]{40}$/) });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = query.safeParse({ player: url.searchParams.get("player") });
  if (!parsed.success) return Response.json({ error: "bad-player" }, { status: 400 });
  const clock = await chainClock();
  const cards = await cardsFor(parsed.data.player, clock.chainNowSec);
  return Response.json({ chainNowSec: clock.chainNowSec, cards }, { headers: { "cache-control": "no-store" } });
}
