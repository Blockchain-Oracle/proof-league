import { z } from "zod";
import { creditCoin3Testnet } from "@proof-league/chain";
import {
  admitPick,
  intakeState,
  utcDayOf,
  verifySignedPick,
  type IntakeCandidate,
  type IntakeRefusal,
} from "@proof-league/shared";
import { and, eq, insertPendingPick, listPlayerDrafts, markets, pendingPicks } from "@proof-league/shared/db";
import { chainClock } from "../../../lib/chain-clock.js";
import { deployedCore, projectionDb } from "../../../lib/market-data.js";

// Pick intake (Story 3.3, AD-2/AD-5/AD-14). A Pick is a signed EIP-712 message; this
// route is the door it comes through, and the door's job is to refuse anything the chain
// would later refuse or silently skip, while it can still be fixed.
//
// Everything decided here is decided by shared code: the admission rules are
// `admitPick`, the signature check is `verifySignedPick` over the one canonical domain,
// and the write is `insertPendingPick`, which is the same function verify:commit drives.
// A second implementation of any of the three would be a second definition of what a
// Pick is.
//
// The route stores drafts. It never scores, never decides an outcome, and holds no key:
// the player's own signature is the only authority in the request, and at lock time the
// worker publishes the whole set and pins it on-chain by hash.

export const dynamic = "force-dynamic";

const HEX = /^0x[0-9a-fA-F]+$/;

const bodySchema = z.object({
  player: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  marketId: z.string().regex(/^[0-9]+$/),
  optionIndex: z.number().int().min(0).max(255),
  stake: z.number().int().min(0).max(65_535),
  nonce: z.number().int().min(0),
  utcDay: z.number().int().min(0),
  stakedSoFarInDay: z.number().int().min(0),
  signature: z.string().regex(HEX),
});

/// Every refusal states what happened, what to do next, and whether the player's points
/// moved (PRODUCT-FLOWS section 16). Nothing here ever spends points, so the reassurance
/// is simply true, which is the only reason it is allowed to be printed.
const REFUSAL: Record<IntakeRefusal, { status: number; message: string; nextAction: string }> = {
  "market-not-open": {
    status: 409,
    message: "This Market is no longer taking Picks. Its set has been committed on-chain, and nothing can be added to a set that is already pinned by hash.",
    nextAction: "Open the Markets board for one that is still open.",
  },
  "intake-closed": {
    status: 409,
    message: "Intake for this Market closed a minute before Lock Time, so that the set being published cannot race a Pick arriving.",
    nextAction: "Open the Markets board for one that is still open.",
  },
  "wrong-utc-day": {
    status: 409,
    message: "This Pick is signed for a different UTC day than the one it arrived on. The daily allowance is metered by the signed day, so the two have to agree.",
    nextAction: "Sign again. The composer will use the current UTC day.",
  },
  "option-out-of-range": {
    status: 400,
    message: "That option does not exist on this Market.",
    nextAction: "Pick one of the options shown on the Market.",
  },
  "stake-out-of-range": {
    status: 400,
    message: "That stake is outside the daily allowance of 100 points.",
    nextAction: "Choose a stake between 0 and what is left of today's allowance.",
  },
  "nonce-not-higher": {
    status: 409,
    message: "This Pick reuses a number that has already been signed. Changing your mind means signing a higher one, which is how the chain knows which word is your last.",
    nextAction: "Reload the Market and sign again from the current state.",
  },
  "cumulative-mismatch": {
    status: 409,
    message: "The running day total signed into this Pick does not match what is actually live. Left alone, the contract would skip this Pick as over budget without telling you.",
    nextAction: "Reload the Market and sign again from the current state.",
  },
  "over-allowance": {
    status: 409,
    message: "This would spend more than the 100 free points a day allows.",
    nextAction: "Lower the stake, or cancel a Pick you have already made today.",
  },
};

const problem = (
  status: number,
  error: string,
  message: string,
  nextAction: string,
): Response =>
  Response.json({ error, message, nextAction, pointsUntouched: true }, { status });

const unavailable = (): Response =>
  problem(
    503,
    "intake-unavailable",
    "Picks cannot be taken right now: this deployment cannot reach its projection or its league contract.",
    "Try again shortly. Nothing was submitted.",
  );

export async function POST(request: Request): Promise<Response> {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return unavailable();

  const parsed = bodySchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) {
    return problem(400, "malformed", "That is not a well formed Pick.", "Sign the Pick again from the Market.");
  }
  const body = parsed.data;
  const scoped = core.toLowerCase();

  const [market] = await db
    .select()
    .from(markets)
    .where(and(eq(markets.core, scoped), eq(markets.marketId, body.marketId)))
    .limit(1);
  if (market === undefined) {
    return problem(404, "market-unknown", "No such Market on this league.", "Open the Markets board.");
  }

  // A RETRY IS NOT A REFUSAL. A client whose request timed out does not know whether its
  // Pick landed, and PRODUCT-FLOWS section 16 requires confirmation-unknown to be
  // separated from refusal. Resending the identical Pick must therefore report the Pick
  // as already held, not "that number is stale" from the nonce rule below. The same
  // lookup catches the opposite case: the same nonce carrying DIFFERENT values, which is
  // two devices racing toward an ambiguous committed set and has to be refused by name.
  const [existing] = await db
    .select()
    .from(pendingPicks)
    .where(
      and(
        eq(pendingPicks.verifyingContract, scoped),
        eq(pendingPicks.marketId, body.marketId),
        eq(pendingPicks.player, body.player.toLowerCase()),
        eq(pendingPicks.nonce, body.nonce),
      ),
    )
    .limit(1);
  if (existing !== undefined) {
    const identical =
      existing.optionIndex === body.optionIndex &&
      existing.stake === body.stake &&
      existing.utcDay === body.utcDay &&
      existing.stakedSoFarInDay === body.stakedSoFarInDay &&
      existing.signature.toLowerCase() === body.signature.toLowerCase();
    if (!identical) {
      return problem(
        409,
        "nonce-taken",
        "A different Pick is already signed with this number. Two Picks sharing one number could not be told apart in the committed set, so the second is refused rather than allowed to overwrite the first.",
        "Reload the Market and sign again from the current state.",
      );
    }
    const drafts = await listPlayerDrafts(db, scoped, body.player);
    return Response.json(
      {
        status: "duplicate",
        marketId: body.marketId,
        nonce: body.nonce,
        next: intakeState(drafts, existing.utcDay, body.marketId),
      },
      { status: 200 },
    );
  }

  const drafts = await listPlayerDrafts(db, scoped, body.player);
  // AD-10: admitted against CHAIN time, which is the clock the worker snapshots the set
  // on. Judging the intake window by this server's clock would let a slow clock accept a
  // Pick after the set was already taken, and the player would never learn it did not
  // count.
  const nowSec = (await chainClock()).chainNowSec;
  const candidate: IntakeCandidate = {
    marketId: body.marketId,
    optionIndex: body.optionIndex,
    stake: body.stake,
    nonce: body.nonce,
    utcDay: body.utcDay,
    stakedSoFarInDay: body.stakedSoFarInDay,
  };
  const admitted = admitPick(
    candidate,
    {
      marketId: market.marketId,
      payoutN: market.payoutN,
      lockTimeSec: market.lockTime,
      state: market.state,
    },
    drafts,
    nowSec,
  );
  if (!admitted.ok) {
    const refusal = REFUSAL[admitted.error];
    return problem(refusal.status, admitted.error, refusal.message, refusal.nextAction);
  }

  // The signature is checked LAST of the cheap-to-check things but before any write: it
  // is the only thing in the request that proves the player asked for this, and it binds
  // every field above to this deployment's domain. Recover-and-compare, no RPC.
  const signed = {
    player: body.player as `0x${string}`,
    marketId: BigInt(body.marketId),
    optionIndex: body.optionIndex,
    stake: body.stake,
    nonce: body.nonce,
    utcDay: body.utcDay,
    stakedSoFarInDay: body.stakedSoFarInDay,
    signature: body.signature as `0x${string}`,
  };
  const domain = { chainId: creditCoin3Testnet.id, verifyingContract: core };
  if (!(await verifySignedPick(domain, signed))) {
    return problem(
      401,
      "bad-signature",
      "That signature does not belong to the account the Pick claims. Nobody can Pick on someone else's behalf.",
      "Sign the Pick again with the account you are signed in as.",
    );
  }

  const outcome = await insertPendingPick(db, { ...signed, verifyingContract: scoped, receivedAtSec: nowSec });
  return Response.json(
    {
      status: outcome,
      marketId: body.marketId,
      nonce: body.nonce,
      // What the composer needs to offer an edit without a second round trip.
      next: intakeState([...drafts, { marketId: body.marketId, nonce: body.nonce, stake: body.stake, utcDay: body.utcDay }], utcDayOf(nowSec), body.marketId),
    },
    { status: outcome === "stored" ? 201 : 200 },
  );
}

/// What a composer needs before asking for a signature: the next legal nonce, the
/// cumulative it must carry, and what is left of today. Derived by the same functions
/// that will judge the pick, so the composer cannot sign something intake would refuse.
export async function GET(request: Request): Promise<Response> {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return unavailable();
  const url = new URL(request.url);
  const player = url.searchParams.get("player") ?? "";
  const marketId = url.searchParams.get("marketId") ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(player) || !/^[0-9]+$/.test(marketId)) {
    return problem(400, "malformed", "A player address and a market id are required.", "Open the Market and try again.");
  }
  const drafts = await listPlayerDrafts(db, core.toLowerCase(), player);
  const nowSec = Math.floor(Date.now() / 1000);
  return Response.json(
    {
      utcDay: utcDayOf(nowSec),
      ...intakeState(drafts, utcDayOf(nowSec), marketId),
      onThisMarket: drafts.filter((draft) => draft.marketId === marketId),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
