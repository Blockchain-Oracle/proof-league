import { privateKeyToAccount } from "viem/accounts";
import { creditCoin3Testnet } from "@proof-league/chain";
import { PICK_DOMAIN_NAME, PICK_DOMAIN_VERSION, PICK_TYPES, utcDayOf } from "@proof-league/shared";

// Live probe of the Pick intake route (Story 3.3), against a RUNNING web app and the real
// projection. It is a probe rather than a verify:* script: it proves wiring, not a
// protocol property, and it writes nothing to any chain.
//
//   pnpm --filter @proof-league/worker exec tsx spike/intake-probe.ts [marketId]
//
// Without an argument it probes the refusal branches, which need no open Market. Given an
// OPEN Market's id it also drives the accept path: store, then the same nonce again
// (duplicate, not a second position), then a forged signature (refused). The league had
// no open Market when this was written, which is why the happy path is a command rather
// than an archived transcript.

const BASE = process.env.INTAKE_PROBE_BASE ?? "http://127.0.0.1:3210";
// The deployed LeagueCore, which is the EIP-712 verifying contract (docs/launch-lineup.md).
const CORE = "0xFe8C5438781f8c8392a49e20502920Ba41027493" as const;
// A throwaway signer: it signs drafts, holds nothing, and is not a worker key.
const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

type Pick = {
  readonly marketId: string;
  readonly optionIndex: number;
  readonly stake: number;
  readonly nonce: number;
  readonly utcDay: number;
  readonly stakedSoFarInDay: number;
};

const sign = async (pick: Pick): Promise<string> =>
  account.signTypedData({
    domain: {
      name: PICK_DOMAIN_NAME,
      version: PICK_DOMAIN_VERSION,
      chainId: creditCoin3Testnet.id,
      verifyingContract: CORE,
    },
    types: PICK_TYPES,
    primaryType: "Pick",
    message: { player: account.address, ...pick, marketId: BigInt(pick.marketId) },
  });

const post = async (body: unknown): Promise<{ status: number; body: unknown }> => {
  const response = await fetch(`${BASE}/api/picks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => "<no json>") };
};

const report = (label: string, result: { status: number; body: unknown }, expected: number): boolean => {
  const met = result.status === expected;
  console.log(`\n${met ? "PASS" : "FAIL"}  ${label}`);
  console.log(`      expected ${expected}, got ${result.status}`);
  console.log(`      ${JSON.stringify(result.body)}`);
  return met;
};

const main = async (): Promise<void> => {
  const marketId = process.argv[2];
  const utcDay = utcDayOf(Math.floor(Date.now() / 1000));
  let allMet = true;

  const state = await fetch(`${BASE}/api/picks?player=${account.address}&marketId=${marketId ?? "5"}`);
  console.log(`\nintake state: ${JSON.stringify(await state.json())}`);

  allMet = report("a body that is not a Pick", await post({ player: account.address }), 400) && allMet;
  allMet =
    report(
      "a Pick for a Market that does not exist",
      await post({
        player: account.address,
        marketId: "999999",
        optionIndex: 0,
        stake: 1,
        nonce: 0,
        utcDay,
        stakedSoFarInDay: 0,
        signature: await sign({ marketId: "999999", optionIndex: 0, stake: 1, nonce: 0, utcDay, stakedSoFarInDay: 0 }),
      }),
      404,
    ) && allMet;

  if (marketId === undefined) {
    console.log("\nNo Market id given, so the accept path was not driven. Pass an OPEN Market's id to drive it.");
    process.exit(allMet ? 0 : 1);
  }

  // -- the accept path, on a Market that is open -----------------------------------------
  const first: Pick = { marketId, optionIndex: 0, stake: 40, nonce: 0, utcDay, stakedSoFarInDay: 0 };
  const stateBody = (await (await fetch(`${BASE}/api/picks?player=${account.address}&marketId=${marketId}`)).json()) as {
    nextNonce?: number;
    stakedSoFarInDay?: number;
  };
  const pick: Pick = {
    ...first,
    nonce: stateBody.nextNonce ?? 0,
    stakedSoFarInDay: stateBody.stakedSoFarInDay ?? 0,
  };
  const stored = await post({ player: account.address, ...pick, signature: await sign(pick) });
  allMet = report("an honestly signed Pick on an open Market", stored, 201) && allMet;
  allMet =
    report("the same Pick again (one position, not two)", await post({ player: account.address, ...pick, signature: await sign(pick) }), 200) &&
    allMet;

  // A signature over a DIFFERENT payload than the one submitted: the recovered address is
  // some other account, so the claim that this player signed it is false.
  const forgedPayload: Pick = { ...pick, nonce: pick.nonce + 1, stake: 10 };
  allMet =
    report(
      "a Pick whose signature covers different values",
      await post({ player: account.address, ...forgedPayload, signature: await sign({ ...forgedPayload, stake: 99 }) }),
      401,
    ) && allMet;

  console.log(`\n${allMet ? "PROBE PASS" : "PROBE FAIL"}`);
  process.exit(allMet ? 0 : 1);
};

void main();
