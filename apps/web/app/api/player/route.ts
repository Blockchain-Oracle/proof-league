import { z } from "zod";
import { chainClock } from "../../../lib/chain-clock.js";
import { standingFor } from "../../../lib/cards-data.js";

// The rail's facts about one seat: what is left in today's rack, the season row. Read
// against chain time so "today" is the contract's UTC day, not the browser's.

export const dynamic = "force-dynamic";

const query = z.object({ player: z.string().regex(/^0x[0-9a-fA-F]{40}$/) });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = query.safeParse({ player: url.searchParams.get("player") });
  if (!parsed.success) return Response.json({ error: "bad-player" }, { status: 400 });
  const clock = await chainClock();
  const standing = await standingFor(parsed.data.player, clock.chainNowSec);
  return Response.json(standing, { headers: { "cache-control": "no-store" } });
}
