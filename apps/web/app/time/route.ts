import { createPublicClient, http } from "viem";
import { creditCoin3Testnet, readEndpoints } from "@proof-league/chain";

// The clock endpoint (AD-10): Creditcoin chain-head time is the only clock that decides
// anything, so it is the clock the product counts down to. A visitor's device clock can
// be minutes out, and "2 minutes left to Pick" rendered against a wrong clock is the kind
// of small lie this product cannot afford, because the chain will refuse the Pick that
// the countdown said was still in time.
//
// The answer says which clock it came from. When the RPC is unreachable the server's own
// time is served, marked as such, so a client can choose to keep showing absolute times
// rather than a countdown that quietly means something else.

export const dynamic = "force-dynamic";

type Clock = {
  readonly chainNowSec: number;
  readonly serverNowSec: number;
  readonly source: "chain" | "server";
};

// One head read per few seconds per server process, shared by every visitor: the number
// changes about once a block, and a countdown resyncs on a slow cadence anyway.
const TTL_MS = 5_000;
const globalRef = globalThis as { __plClock?: { at: number; value: Promise<Clock> } };

const readClock = async (): Promise<Clock> => {
  const serverNowSec = Math.floor(Date.now() / 1000);
  try {
    const client = createPublicClient({
      chain: creditCoin3Testnet,
      transport: http(readEndpoints(process.env).CC3_RPC_URL),
    });
    const block = await client.getBlock();
    return { chainNowSec: Number(block.timestamp), serverNowSec, source: "chain" };
  } catch {
    return { chainNowSec: serverNowSec, serverNowSec, source: "server" };
  }
};

export async function GET(): Promise<Response> {
  const cached = globalRef.__plClock;
  if (cached === undefined || Date.now() - cached.at > TTL_MS) {
    globalRef.__plClock = { at: Date.now(), value: readClock() };
  }
  const clock = await (globalRef.__plClock?.value ?? readClock());
  return Response.json(clock, { headers: { "cache-control": "no-store" } });
}
