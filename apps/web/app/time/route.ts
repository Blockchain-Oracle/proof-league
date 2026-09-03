import { chainClock } from "../../lib/chain-clock.js";

// The clock endpoint (AD-10): countdowns tick against Creditcoin chain-head time, not the
// visitor's device clock, because a device two minutes fast would say a Pick is still in
// time when the chain is about to refuse it. The clock itself lives in lib/chain-clock so
// that intake admits against exactly the same number this serves.

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(await chainClock(), { headers: { "cache-control": "no-store" } });
}
