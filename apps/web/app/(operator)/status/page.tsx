import { createPublicClient, http } from "viem";
import { creditCoin3Testnet, readEndpoints } from "@proof-league/chain";
import { formatUtc } from "@proof-league/shared";
import { chainClock } from "../../../lib/chain-clock.js";
import { boardMarketViews } from "../../../lib/market-board.js";
import { transparencyLog } from "../../../lib/market-data.js";
import { sepoliaHead } from "../../../lib/sepolia.js";

// STATUS (Masayume's status page shape): what the table can read right now, derived at
// request time and never held as a stale green. Five pipelines, a human line each, and
// the honest "not connected" for anything a deployment has not been given.

export const dynamic = "force-dynamic";

type Pipeline = { readonly name: string; readonly detail: string; readonly ok: boolean; readonly optional?: boolean };

const cc3Head = async (): Promise<number | undefined> => {
  try {
    const client = createPublicClient({ chain: creditCoin3Testnet, transport: http(readEndpoints(process.env).CC3_RPC_URL) });
    return Number(await client.getBlockNumber());
  } catch {
    return undefined;
  }
};

export default async function StatusPage() {
  const clock = await chainClock();
  const [views, log, sepolia, cc3] = await Promise.all([boardMarketViews(clock.chainNowSec), transparencyLog(1), sepoliaHead(), cc3Head()]);
  const last = log[0];
  const hasDb = process.env.DATABASE_URL !== undefined;
  const hasModel = process.env.ANTHROPIC_API_KEY !== undefined || process.env.AI_API_KEY !== undefined || process.env.AI_GATEWAY_API_KEY !== undefined;
  const pipelines: Pipeline[] = [
    { name: "Creditcoin 3 · chain head", detail: cc3 === undefined ? "not answering" : `block ${cc3.toLocaleString("en-US")} · clock ${clock.source === "chain" ? "from chain" : "from server, chain not answering"}`, ok: cc3 !== undefined },
    { name: "Projection · the table's cards", detail: hasDb ? `${views.length} card${views.length === 1 ? "" : "s"} on the deployed core` : "not connected on this deployment", ok: hasDb },
    { name: "Worker · phase log", detail: last === undefined ? "no rows yet" : `last row ${formatUtc(last.atSec)} · ${last.phase}`, ok: last !== undefined },
    { name: "Sepolia · block draws", detail: sepolia === undefined ? "not answering" : `head ${sepolia.toLocaleString("en-US")}`, ok: sepolia !== undefined },
    { name: "Guide · model", detail: hasModel ? "configured" : "no credential on the server; the Guide says so in its own voice", ok: true, optional: true },
  ];
  const degraded = pipelines.some((pipeline) => !pipeline.ok && pipeline.optional !== true);
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-4 py-8 md:px-10 md:py-12">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">Status</h1>
        <span className="font-serif text-[26px] italic text-gold">{degraded ? "degraded" : "all lamps lit"}</span>
      </div>
      <ul className="divide-y divide-white/10 border-y border-white/10">
        {pipelines.map((pipeline) => (
          <li key={pipeline.name} className="flex items-start gap-4 py-3">
            <span className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-felt-edge ${pipeline.ok ? "lamp-lit" : "bg-black/35"}`} />
            <div>
              <div className="font-display text-[15px] font-extrabold text-stock">
                {pipeline.name}
                {pipeline.optional === true ? <span className="ml-2 font-data text-[8.5px] tracking-[.14em] text-felt-3">OPTIONAL</span> : null}
              </div>
              <div className="mt-0.5 font-data text-[10.5px] text-felt-2">{pipeline.detail}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="font-data text-[9.5px] tracking-[.1em] text-felt-4">CHECKED {formatUtc(clock.serverNowSec)} · READ AT REQUEST TIME, NEVER HELD</p>
    </div>
  );
}
