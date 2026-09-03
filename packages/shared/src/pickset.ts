import { recoverTypedDataAddress, sha256, stringToHex, type Address, type Hex } from "viem";
import { z } from "zod";
import {
  hashPick,
  PICK_DOMAIN_NAME,
  PICK_DOMAIN_VERSION,
  PICK_TYPES,
  type PickDomain,
  type PickMessage,
} from "./pick.js";

// The published pick-set document (Story 2.2's publication half, AD-5/AD-18): every signed
// Pick — superseded nonces and zero-stake tombstones included, because LeagueScoring
// resolves latest-nonce-wins on-chain — sorted (player asc, nonce asc), signatures
// attached, content-addressed by sha256 over the exact serialized bytes. The chain never
// checks signatures (the leaf is the bare EIP-712 digest), so signature verification here
// and in `pnpm rebuild` IS the guarantee that the operator cannot invent a Pick.

export type SignedPick = PickMessage & { readonly signature: Hex };

export const PICKSET_DOCUMENT_VERSION = 1;

// The wire form: lowercase addresses and decimal-string marketId so the bytes are
// canonical and JSON-safe; the object literal order in serialize() is the one key order.
export type PickSetDocumentPick = {
  readonly player: string;
  readonly marketId: string;
  readonly optionIndex: number;
  readonly stake: number;
  readonly nonce: number;
  readonly utcDay: number;
  readonly stakedSoFarInDay: number;
  readonly signature: string;
};

export type PickSetDocument = {
  readonly version: typeof PICKSET_DOCUMENT_VERSION;
  readonly chainId: number;
  readonly verifyingContract: string;
  readonly marketId: string;
  readonly count: number;
  readonly picks: readonly PickSetDocumentPick[];
};

// "player asc" is NUMERIC address order (pickset-merkle.ts's warning made literal):
// comparing checksummed strings puts 'B' before 'a' and the chain would skip honest
// picks as OutOfOrder — so the comparator goes through BigInt, never the string.
export const comparePicksCanonical = (
  a: Pick<PickMessage, "player" | "nonce">,
  b: Pick<PickMessage, "player" | "nonce">,
): number => {
  const pa = BigInt(a.player);
  const pb = BigInt(b.player);
  if (pa !== pb) return pa < pb ? -1 : 1;
  return a.nonce - b.nonce;
};

/// Total canonical order or refusal: a duplicate (player, nonce) has no defined position,
/// so canonicalization throws rather than pick a winner the commitment can't express.
export const sortPicksCanonical = <T extends SignedPick>(picks: readonly T[]): T[] => {
  const sorted = [...picks].sort(comparePicksCanonical);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1] as T;
    const cur = sorted[i] as T;
    if (BigInt(prev.player) === BigInt(cur.player) && prev.nonce === cur.nonce) {
      throw new Error(`pickset: duplicate (player, nonce) = (${cur.player}, ${cur.nonce})`);
    }
  }
  return sorted;
};

/// Built documents are validated with the SAME schema the reader enforces. The writer
/// bounded nothing, so a field wider than its EIP-712 type could in principle be written
/// and then be permanently unparseable by every reader — an unrecoverable market. The
/// signing path makes that unreachable today; this makes it unrepresentable.
export const buildPickSetDocument = (
  domain: PickDomain,
  marketId: bigint,
  picks: readonly SignedPick[],
): PickSetDocument => {
  for (const pick of picks) {
    if (pick.marketId !== marketId) {
      throw new Error(`pickset: pick for market ${pick.marketId} in the set for ${marketId}`);
    }
  }
  const doc = {
    version: PICKSET_DOCUMENT_VERSION,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract.toLowerCase(),
    marketId: marketId.toString(),
    count: picks.length,
    picks: sortPicksCanonical(picks).map((pick) => ({
      player: pick.player.toLowerCase(),
      marketId: pick.marketId.toString(),
      optionIndex: pick.optionIndex,
      stake: pick.stake,
      nonce: pick.nonce,
      utcDay: pick.utcDay,
      stakedSoFarInDay: pick.stakedSoFarInDay,
      signature: pick.signature.toLowerCase(),
    })),
  };
  return documentSchema.parse(doc) as PickSetDocument;
};

/// Deterministic bytes: the literal below fixes the key order regardless of what object
/// the caller holds, so sha256(serialize(doc)) is stable across processes and re-derivable
/// by `pnpm rebuild` from the published file alone.
export const serializePickSetDocument = (doc: PickSetDocument): string =>
  JSON.stringify({
    version: doc.version,
    chainId: doc.chainId,
    verifyingContract: doc.verifyingContract,
    marketId: doc.marketId,
    count: doc.count,
    picks: doc.picks.map((p) => ({
      player: p.player,
      marketId: p.marketId,
      optionIndex: p.optionIndex,
      stake: p.stake,
      nonce: p.nonce,
      utcDay: p.utcDay,
      stakedSoFarInDay: p.stakedSoFarInDay,
      signature: p.signature,
    })),
  });

export const pickSetSha256 = (serialized: string): Hex => sha256(stringToHex(serialized));

// AD-5's content-addressed name, shared by both homes: picksets/<marketId>-<sha256>.json
// in Supabase Storage and docs/pick-sets/<marketId>-<sha256>.json on the data branch.
export const pickSetFileName = (marketId: bigint, shaHex: Hex): string =>
  `${marketId}-${shaHex.slice(2)}.json`;

const hexString = (bytes: number) => z.string().regex(new RegExp(`^0x[0-9a-f]{${bytes * 2}}$`));

const documentPickSchema = z.object({
  player: hexString(20),
  marketId: z.string().regex(/^[0-9]+$/),
  optionIndex: z.number().int().min(0).max(255),
  stake: z.number().int().min(0).max(65535),
  nonce: z.number().int().min(0).max(4294967295),
  utcDay: z.number().int().min(0).max(4294967295),
  stakedSoFarInDay: z.number().int().min(0).max(65535),
  signature: hexString(65),
});

const documentSchema = z.object({
  version: z.literal(PICKSET_DOCUMENT_VERSION),
  chainId: z.number().int().positive(),
  verifyingContract: hexString(20),
  marketId: z.string().regex(/^[0-9]+$/),
  count: z.number().int().min(0),
  picks: z.array(documentPickSchema),
});

/// The strict reader `pnpm rebuild` and verify:commit share. It never re-sorts: a file
/// whose picks are out of canonical order (or whose count lies) is refused, because
/// silently repairing it would mask published bytes disagreeing with the commitment.
export const parsePickSetDocument = (serialized: string): PickSetDocument => {
  const doc = documentSchema.parse(JSON.parse(serialized));
  if (doc.count !== doc.picks.length) {
    throw new Error(`pickset: count ${doc.count} but ${doc.picks.length} picks`);
  }
  for (const pick of doc.picks) {
    if (pick.marketId !== doc.marketId) {
      throw new Error(`pickset: pick for market ${pick.marketId} in the set for ${doc.marketId}`);
    }
  }
  for (let i = 1; i < doc.picks.length; i += 1) {
    const prev = doc.picks[i - 1] as PickSetDocumentPick;
    const cur = doc.picks[i] as PickSetDocumentPick;
    const order = comparePicksCanonical(
      { player: prev.player as Address, nonce: prev.nonce },
      { player: cur.player as Address, nonce: cur.nonce },
    );
    if (order >= 0) throw new Error(`pickset: picks out of canonical order at index ${i}`);
  }
  return doc;
};

export const signedPickOf = (pick: PickSetDocumentPick): SignedPick => ({
  player: pick.player as Address,
  marketId: BigInt(pick.marketId),
  optionIndex: pick.optionIndex,
  stake: pick.stake,
  nonce: pick.nonce,
  utcDay: pick.utcDay,
  stakedSoFarInDay: pick.stakedSoFarInDay,
  signature: pick.signature as Hex,
});

// The committed tree's leaves, in document order — document order IS leaf order (AD-5).
export const pickSetLeavesOf = (domain: PickDomain, picks: readonly SignedPick[]): Hex[] =>
  picks.map((pick) => hashPick(domain, pick));

/// Off-chain signature truth (AD-5): recover-and-compare, no RPC. Returns false rather
/// than throwing on malformed signatures — an intake row must never crash set-building.
export const verifySignedPick = async (domain: PickDomain, pick: SignedPick): Promise<boolean> => {
  try {
    const recovered = await recoverTypedDataAddress({
      // The one canonical domain and type set (pick.ts, AD-2) — re-declaring them here
      // would be the second divergent encoding the conformance fixture exists to prevent.
      domain: {
        name: PICK_DOMAIN_NAME,
        version: PICK_DOMAIN_VERSION,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: PICK_TYPES,
      primaryType: "Pick",
      message: {
        player: pick.player,
        marketId: pick.marketId,
        optionIndex: pick.optionIndex,
        stake: pick.stake,
        nonce: pick.nonce,
        utcDay: pick.utcDay,
        stakedSoFarInDay: pick.stakedSoFarInDay,
      },
      signature: pick.signature,
    });
    return recovered.toLowerCase() === pick.player.toLowerCase();
  } catch {
    return false;
  }
};
