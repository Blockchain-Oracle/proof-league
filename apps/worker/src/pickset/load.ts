import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Hex } from "viem";
import {
  buildPickSetTree,
  EMPTY_PICKSET_ROOT,
  parsePickSetDocument,
  pickSetFileName,
  pickSetLeavesOf,
  pickSetSha256,
  signedPickOf,
  type PickDomain,
  type PickSetDocument,
  type PickSetTree,
  type SignedPick,
} from "@proof-league/shared";

// The one way back from an on-chain PickCommitment to verified leaves (Story 2.9, AD-5):
// fetch the pinned bytes (public URL first, the docs/pick-sets mirror as the offline
// fallback), require sha256(bytes) == the on-chain sha, require the parsed document to
// re-derive EXACTLY the committed root. Scoring, the projector and `pnpm rebuild` all
// load through here, so none of them can ever act on bytes the chain didn't pin.

export type OnChainCommitment = {
  readonly root: Hex;
  readonly sha256Hash: Hex;
  readonly uri: string;
};

export type LoadedPickSet = {
  readonly doc: PickSetDocument;
  readonly picks: readonly SignedPick[];
  // undefined exactly for the canonical empty set (no tree exists for zero leaves).
  readonly tree: PickSetTree | undefined;
  readonly serialized: string;
};

const fetchUri = async (uri: string): Promise<string | undefined> => {
  if (!/^https?:\/\//.test(uri)) return undefined;
  try {
    const response = await fetch(uri, { signal: AbortSignal.timeout(15_000) });
    return response.ok ? await response.text() : undefined;
  } catch {
    return undefined; // the mirror fallback answers instead
  }
};

export const loadPickSet = async (
  domain: PickDomain,
  marketId: bigint,
  commitment: OnChainCommitment,
  mirrorDir: string,
): Promise<LoadedPickSet> => {
  const fileName = pickSetFileName(marketId, commitment.sha256Hash);
  let serialized = await fetchUri(commitment.uri);
  if (serialized === undefined) {
    const mirrorPath = join(mirrorDir, fileName);
    if (!existsSync(mirrorPath)) {
      throw new Error(`pickset ${fileName}: unreachable at ${commitment.uri} and absent from the mirror`);
    }
    serialized = readFileSync(mirrorPath, "utf8");
  }
  if (pickSetSha256(serialized) !== commitment.sha256Hash) {
    throw new Error(`pickset ${fileName}: bytes do not hash to the on-chain sha256`);
  }
  const doc = parsePickSetDocument(serialized);
  if (BigInt(doc.marketId) !== marketId) {
    throw new Error(`pickset ${fileName}: document is for market ${doc.marketId}`);
  }
  const picks = doc.picks.map(signedPickOf);
  if (picks.length === 0) {
    if (commitment.root !== EMPTY_PICKSET_ROOT) {
      throw new Error(`pickset ${fileName}: empty document but a non-empty committed root`);
    }
    return { doc, picks, tree: undefined, serialized };
  }
  const tree = buildPickSetTree(pickSetLeavesOf(domain, picks));
  if (tree.commitmentRoot !== commitment.root) {
    throw new Error(`pickset ${fileName}: document does not re-derive the committed root`);
  }
  return { doc, picks, tree, serialized };
};
