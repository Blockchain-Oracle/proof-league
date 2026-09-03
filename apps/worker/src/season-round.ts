import { getAbiItem, zeroAddress } from "viem";
import type { AbiEvent, Address } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import { sendAlert } from "./alerts.js";
import type { Cc3Clients } from "./cc3.js";
import type { StateStore } from "./state.js";

// Story 2.10's worker half (AD-17 hardening 5): after seasonEnd the worker watches
// candidate submissions, auto-submits the superior candidate inside the window, sends the
// expiry call itself, and webhooks the operator on any revert. The CONTRACT is the only
// comparator authority — every send is simulate-first, so a CandidateNotSuperior answer
// means the standing candidate is already right and this round is honestly done.
// verify:payout drives THIS function against a minutes-long test season on the same bytecode.

// Player enumeration is a class-2 observation over PickScored logs (the chain never lists
// players — that unbounded loop is what AD-17 forbids on-chain). The lookback covers a
// full season of CC3 blocks with margin at any plausible block time; verify:payout passes
// its deploy block instead, and a too-short scan can only yield an inferior candidate,
// which the permissionless fallback (anyone, including Abu on a phone) can displace.
const SEASON_SCAN_LOOKBACK_BLOCKS = 400_000;
const SCAN_CHUNK_BLOCKS = 20_000;

export type SeasonRoundReport = {
  readonly status: "idle" | "waiting" | "submitted" | "finalized" | "reverted";
  readonly detail?: string;
};

type PlayerKeys = {
  readonly player: Address;
  readonly points: bigint;
  readonly streak: number;
  readonly ordinal: bigint;
};

export const runSeasonRound = async (
  core: Address,
  clients: Cc3Clients,
  store: StateStore,
  webhookUrl: string | undefined,
  scanFromBlockOverride?: number,
): Promise<SeasonRoundReport> => {
  const { publicClient, walletClient } = clients;
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const season = store.seasonOf(core);
  if (season.stage === "finalized") return { status: "idle", detail: "season already paid" };
  if (season.seasonEndSec === undefined) {
    season.seasonEndSec = Number(await publicClient.readContract({ ...contract, functionName: "seasonEnd" }));
  }
  const chainNowSec = Number((await publicClient.getBlock()).timestamp);
  // At the second itself the season still lives (the house clock law) — strict.
  if (chainNowSec <= season.seasonEndSec) return { status: "idle", detail: "season live" };
  if (await publicClient.readContract({ ...contract, functionName: "seasonPaid" })) {
    season.stage = "finalized";
    return { status: "finalized", detail: "payout already on-chain" };
  }
  const created = await publicClient.readContract({ ...contract, functionName: "seasonMarketsCreated" });
  const terminal = await publicClient.readContract({ ...contract, functionName: "seasonMarketsTerminal" });
  if (created !== terminal) {
    // Honest wait: the all-terminal gate holds until every season market resolves or
    // voids — and the void round is the permissionless unblocker (AD-19), so this state
    // always drains.
    return { status: "waiting", detail: `${created - terminal} season market(s) not yet terminal` };
  }
  const [standing, windowEndsAt] = await publicClient.readContract({
    ...contract,
    functionName: "seasonCandidate",
  });
  if (windowEndsAt !== 0n && chainNowSec >= Number(windowEndsAt)) {
    return finalize(contract, clients, store, season, webhookUrl);
  }
  const best = await bestCandidate(core, clients, store, season, scanFromBlockOverride);
  if (windowEndsAt !== 0n && best.every((c, i) => c === standing[i])) {
    return { status: "waiting", detail: `standing candidate already ours; window ends ${windowEndsAt}` };
  }
  try {
    await publicClient.simulateContract({
      ...contract,
      functionName: "submitSeasonCandidate",
      args: [best],
      account: walletClient.account,
    });
  } catch (error) {
    const why = String(error);
    if (why.includes("CandidateNotSuperior")) {
      return { status: "waiting", detail: "standing candidate is superior or equal — nothing to displace" };
    }
    await sendAlert(store, webhookUrl, `season-submit:${core}`, "season-revert", `submitSeasonCandidate refused: ${why}`);
    return { status: "reverted", detail: why };
  }
  const hash = await walletClient.writeContract({ ...contract, functionName: "submitSeasonCandidate", args: [best] });
  await publicClient.waitForTransactionReceipt({ hash });
  const [, windowNow] = await publicClient.readContract({ ...contract, functionName: "seasonCandidate" });
  season.stage = "candidate-submitted";
  season.windowEndsAtSec = Number(windowNow);
  return { status: "submitted", detail: `candidate [${best.join(", ")}] in ${hash}; window ends ${windowNow}` };
};

const finalize = async (
  contract: { address: Address; abi: typeof leagueCoreAbi },
  clients: Cc3Clients,
  store: StateStore,
  season: ReturnType<StateStore["seasonOf"]>,
  webhookUrl: string | undefined,
): Promise<SeasonRoundReport> => {
  try {
    await clients.publicClient.simulateContract({
      ...contract,
      functionName: "finalizeSeasonPayout",
      account: clients.walletClient.account,
    });
    const hash = await clients.walletClient.writeContract({ ...contract, functionName: "finalizeSeasonPayout" });
    await clients.publicClient.waitForTransactionReceipt({ hash });
    season.stage = "finalized";
    return { status: "finalized", detail: `finalizeSeasonPayout landed: ${hash}` };
  } catch (error) {
    const why = String(error);
    if (why.includes("SeasonAlreadyPaid")) {
      season.stage = "finalized"; // a rival expiry caller won the permissionless race — done is done
      return { status: "finalized", detail: "paid by another caller" };
    }
    await sendAlert(store, webhookUrl, "season-finalize", "season-revert", `finalizeSeasonPayout refused: ${why}`);
    return { status: "reverted", detail: why };
  }
};

/// Top-3 by the FR-19 total order, zero-tailed. The sort mirrors the contract's _beats
/// only to CHOOSE what to submit — superiority is still judged on-chain (simulate-first).
const bestCandidate = async (
  core: Address,
  clients: Cc3Clients,
  store: StateStore,
  season: ReturnType<StateStore["seasonOf"]>,
  scanFromBlockOverride: number | undefined,
): Promise<[Address, Address, Address]> => {
  const { publicClient } = clients;
  const head = Number(await publicClient.getBlockNumber());
  let from =
    season.playerScanFromBlock ?? scanFromBlockOverride ?? Math.max(0, head - SEASON_SCAN_LOOKBACK_BLOCKS);
  const pickScored = getAbiItem({ abi: leagueCoreAbi, name: "PickScored" }) as AbiEvent;
  const players = new Set<string>(season.players);
  while (from <= head) {
    const to = Math.min(from + SCAN_CHUNK_BLOCKS - 1, head);
    const logs = await publicClient.getLogs({
      address: core,
      event: pickScored,
      fromBlock: BigInt(from),
      toBlock: BigInt(to),
    });
    for (const log of logs) {
      const player = (log.args as { player?: Address }).player;
      if (player !== undefined) players.add(player);
    }
    from = to + 1;
  }
  season.players = [...players];
  season.playerScanFromBlock = head + 1; // resume scanning where this sweep ended (AD-13)
  const contract = { address: core, abi: leagueCoreAbi } as const;
  const keyed: PlayerKeys[] = [];
  for (const player of season.players as Address[]) {
    const points = await publicClient.readContract({ ...contract, functionName: "seasonPointsOf", args: [player] });
    if (points === 0n) continue; // FR-20: only pointed players are eligible winners
    keyed.push({
      player,
      points,
      streak: await publicClient.readContract({ ...contract, functionName: "streakOf", args: [player] }),
      ordinal: await publicClient.readContract({
        ...contract,
        functionName: "earliestCommitOrdinalOf",
        args: [player],
      }),
    });
  }
  keyed.sort((a, b) => {
    if (a.points !== b.points) return a.points > b.points ? -1 : 1;
    if (a.streak !== b.streak) return b.streak - a.streak;
    if (a.ordinal !== b.ordinal) return a.ordinal < b.ordinal ? -1 : 1;
    return BigInt(a.player) < BigInt(b.player) ? -1 : 1; // address asc — the no-tie final key
  });
  return [keyed[0]?.player ?? zeroAddress, keyed[1]?.player ?? zeroAddress, keyed[2]?.player ?? zeroAddress];
};
