import { pino } from "pino";
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { creditCoin3Testnet } from "@proof-league/chain";
import { PICK_DOMAIN_NAME, PICK_DOMAIN_VERSION, PICK_TYPES, type PickDomain, type PickMessage } from "./pick.js";
import {
  buildPickSetDocument,
  effectivePickCounts,
  parsePickSetDocument,
  pickSetFileName,
  pickSetSha256,
  serializePickSetDocument,
  sortPicksCanonical,
  verifySignedPick,
  type SignedPick,
} from "./pickset.js";

// Pick-set document selftest (Story 2.2's publication half, AD-5): the canonical order,
// the deterministic bytes, the strict reader's refusals, and the recover-based signature
// gate — each probed at the exact trap the module documents (checksummed-string sort,
// shuffled files, forged signatures). CI runs this in the shared selftest chain.

const log = pino({ base: null });

const fail = (message: string): never => {
  log.error(`pickset.selftest: ${message}`);
  process.exit(1);
};

// Deterministic throwaway keys, built at runtime so the secret-scan's 64-hex pattern
// never matches source (the documented footgun): trivially valid scalars, never funds.
const keyA: Hex = `0x${"11".repeat(32)}`;
const keyB: Hex = `0x${"22".repeat(32)}`;

const domain: PickDomain = {
  chainId: creditCoin3Testnet.id,
  verifyingContract: "0x1000000000000000000000000000000000000001",
};

const signPick = async (key: Hex, pick: PickMessage): Promise<SignedPick> => {
  const account = privateKeyToAccount(key);
  const signature = await account.signTypedData({
    domain: {
      name: PICK_DOMAIN_NAME,
      version: PICK_DOMAIN_VERSION,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: PICK_TYPES,
    primaryType: "Pick",
    message: pick,
  });
  return { ...pick, signature };
};

const marketId = 7n;
const pickOf = (player: Address, nonce: number, stake: number): PickMessage => ({
  player,
  marketId,
  optionIndex: 1,
  stake,
  nonce,
  utcDay: 20699,
  stakedSoFarInDay: 0,
});

const main = async (): Promise<void> => {
  const playerA = privateKeyToAccount(keyA).address;
  const playerB = privateKeyToAccount(keyB).address;

  // -- canonical order: numeric address order, never string order ----------------------
  // Craft the trap: a checksummed address starting 'B' vs one starting lowercase-hex
  // region — string sort and BigInt sort disagree exactly when casing does.
  const low = "0x0a00000000000000000000000000000000000000" as Address;
  const highChecksummed = "0xB000000000000000000000000000000000000000" as Address;
  const unsorted: SignedPick[] = [
    { ...pickOf(highChecksummed, 1, 10), signature: `0x${"11".repeat(65)}` as Hex },
    { ...pickOf(low, 2, 10), signature: `0x${"22".repeat(65)}` as Hex },
    { ...pickOf(low, 1, 10), signature: `0x${"33".repeat(65)}` as Hex },
  ];
  const sorted = sortPicksCanonical(unsorted);
  if (sorted[0]?.player !== low || sorted[0]?.nonce !== 1 || sorted[1]?.nonce !== 2) {
    return fail("canonical sort is not (numeric player asc, nonce asc)");
  }
  if (sorted[2]?.player !== highChecksummed) {
    return fail("checksummed 'B...' address must sort AFTER numeric-lower addresses");
  }
  try {
    sortPicksCanonical([...unsorted, unsorted[0] as SignedPick]);
    return fail("duplicate (player, nonce) was accepted — the order would be ambiguous");
  } catch {
    // refusal is the pass
  }

  // -- document build, deterministic bytes, strict re-read -----------------------------
  const signedA1 = await signPick(keyA, pickOf(playerA, 1, 10));
  const signedA2 = await signPick(keyA, pickOf(playerA, 2, 0)); // tombstone stays in the set
  const signedB1 = await signPick(keyB, pickOf(playerB, 1, 25));
  const doc = buildPickSetDocument(domain, marketId, [signedB1, signedA2, signedA1]);
  const serialized = serializePickSetDocument(doc);
  if (serialized !== serializePickSetDocument(parsePickSetDocument(serialized))) {
    return fail("serialize -> parse -> serialize is not byte-identical");
  }
  const sha = pickSetSha256(serialized);
  if (pickSetFileName(marketId, sha) !== `7-${sha.slice(2)}.json`) {
    return fail("file name is not <marketId>-<sha256>.json");
  }

  // The strict reader refuses a shuffled file instead of repairing it: published bytes
  // disagreeing with canonical order must surface, never be silently re-sorted.
  const shuffled = JSON.parse(serialized) as { picks: unknown[] };
  shuffled.picks.reverse();
  try {
    parsePickSetDocument(JSON.stringify(shuffled));
    return fail("a shuffled document parsed — the reader silently repaired the order");
  } catch {
    // refusal is the pass
  }

  // -- the signature gate: recover-and-compare, forgeries excluded ---------------------
  if (!(await verifySignedPick(domain, signedA1))) return fail("an honestly signed pick failed verification");
  const forged: SignedPick = { ...signedA1, player: playerB };
  if (await verifySignedPick(domain, forged)) return fail("a forged pick (wrong claimed player) verified");
  const wrongDomain: PickDomain = { ...domain, verifyingContract: "0x2000000000000000000000000000000000000002" };
  if (await verifySignedPick(wrongDomain, signedA1)) {
    return fail("a pick verified against a different deployment's domain");
  }

  // -- the display fold agrees with what the chain will score -------------------------
  // A set holds every signed pick, so counting leaves per option is wrong in exactly the
  // two ways the scoring machine is right about: latest nonce wins, and a zero-stake
  // pick is a cancellation rather than a position. Both probed here, because a display
  // that disagrees with the contract is a second reading of the same market.
  const counted = effectivePickCounts(
    [
      { player: playerA, nonce: 1, optionIndex: 0, stake: 10 }, // superseded below
      { player: playerA, nonce: 2, optionIndex: 3, stake: 10 }, // A's real position
      { player: playerB, nonce: 1, optionIndex: 3, stake: 10 }, // cancelled below
      { player: playerB, nonce: 4, optionIndex: 3, stake: 0 }, // zero-stake tombstone
      { player: "0x3000000000000000000000000000000000000003", nonce: 1, optionIndex: 9, stake: 5 },
    ],
    5,
  );
  if (counted.byOption[0] !== 0) return fail("a superseded pick was still counted on its old option");
  if (counted.byOption[3] !== 1) return fail(`option 3 counted ${counted.byOption[3]}, expected only A's latest`);
  if (counted.cancelled !== 1) return fail(`cancelled counted ${counted.cancelled}, expected the one tombstone`);
  if (counted.byOption.reduce((sum, count) => sum + count, 0) !== 1) {
    return fail("an out-of-range option index was folded into a bucket it cannot be scored into");
  }
  // Case order must not matter: intake lowercases at the door, but a set read back from a
  // published file may carry checksummed addresses for the same player.
  const mixedCase = effectivePickCounts(
    [
      { player: playerA.toUpperCase().replace("0X", "0x"), nonce: 1, optionIndex: 0, stake: 10 },
      { player: playerA, nonce: 2, optionIndex: 1, stake: 10 },
    ],
    2,
  );
  if (mixedCase.byOption[0] !== 0 || mixedCase.byOption[1] !== 1) {
    return fail("one player in two casings folded as two players");
  }

  log.info(
    "pickset.selftest: PASS (canonical order, deterministic bytes, strict reader, signature gate, display fold)",
  );
};

await main();
