import { createPublicClient, http } from "viem";
import { creditCoin3Testnet, readEndpoints } from "@proof-league/chain";

// The deciding clock (AD-10). Creditcoin chain-head time is what the contracts compare
// against and what the worker snapshots on, so it is the clock intake admits against and
// the clock countdowns run on. The server's own clock is a convenience, not an authority:
// if it runs slow, a Pick admitted "just in time" by it can arrive after the worker has
// already taken the set, and the player would never learn their Pick did not count.
//
// Cached briefly and shared by every caller in the process: the value moves about once a
// block, and one head read per few seconds is the right cost for a number this load
// bearing. The reply says which clock answered so a caller can degrade honestly.

const TTL_MS = 5_000;

export type Clock = {
  readonly chainNowSec: number;
  readonly serverNowSec: number;
  readonly source: "chain" | "server";
};

const globalRef = globalThis as { __plClock?: { at: number; value: Promise<Clock> } };

const read = async (): Promise<Clock> => {
  const serverNowSec = Math.floor(Date.now() / 1000);
  try {
    const client = createPublicClient({
      chain: creditCoin3Testnet,
      transport: http(readEndpoints(process.env).CC3_RPC_URL),
    });
    const block = await client.getBlock();
    return { chainNowSec: Number(block.timestamp), serverNowSec, source: "chain" };
  } catch {
    // An unreachable RPC falls back to server time rather than refusing every Pick. It is
    // marked, and it is the safe direction: server time on this deployment runs at or
    // ahead of chain time, so intake closes no later than it should.
    return { chainNowSec: serverNowSec, serverNowSec, source: "server" };
  }
};

export const chainClock = async (): Promise<Clock> => {
  const cached = globalRef.__plClock;
  if (cached === undefined || Date.now() - cached.at > TTL_MS) {
    globalRef.__plClock = { at: Date.now(), value: read() };
  }
  return (globalRef.__plClock ?? { value: read() }).value;
};
