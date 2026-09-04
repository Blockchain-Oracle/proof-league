import { createPublicClient, http } from "viem";
import { contestSourceAbi, DEPLOYED, readEndpoints, sepolia } from "@proof-league/chain";

// Sepolia reads for a Block Draw card: the round's settle block and the live head, so the
// card can count blocks to go. Memoized per process with a short TTL because the default
// endpoint is viem's public one and a table render must not spend a request per visitor.

type RoundReading = { readonly settleBlock: number; readonly scheduledSettleTime: number };
type Cache = { head?: { at: number; block: number }; rounds: Map<string, RoundReading> };
const globalRef = globalThis as { __plSepolia?: Cache };
const cache = (): Cache => (globalRef.__plSepolia ??= { rounds: new Map() });

const HEAD_TTL_MS = 12_000;

const client = () => createPublicClient({ chain: sepolia, transport: http(readEndpoints(process.env).SEPOLIA_RPC_URL) });

export const sepoliaHead = async (): Promise<number | undefined> => {
  const held = cache().head;
  if (held !== undefined && Date.now() - held.at < HEAD_TTL_MS) return held.block;
  try {
    const block = Number(await client().getBlockNumber());
    cache().head = { at: Date.now(), block };
    return block;
  } catch {
    return held?.block;
  }
};

/// The round is the Market's subject (its id as bytes32), which is the only fact the league
/// side keeps about it; the config is read from the Sepolia contract, never assumed.
export const roundConfigFor = async (subjectFilter: string): Promise<RoundReading | undefined> => {
  const known = cache().rounds.get(subjectFilter);
  if (known !== undefined) return known;
  const source = DEPLOYED.contestSource;
  if (source === undefined || !/^0x[0-9a-fA-F]{64}$/.test(subjectFilter)) return undefined;
  try {
    const config = await client().readContract({
      address: source,
      abi: contestSourceAbi,
      functionName: "getRoundConfig",
      args: [BigInt(subjectFilter)],
    });
    const reading = { settleBlock: Number(config.settleBlock), scheduledSettleTime: Number(config.scheduledSettleTime) };
    cache().rounds.set(subjectFilter, reading);
    return reading;
  } catch {
    return undefined;
  }
};
