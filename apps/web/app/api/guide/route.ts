import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { guideSnapshot } from "../../../lib/guide-snapshot.js";

// The League Guide's one door. The key lives here and only here; the browser sends the
// thread and the card id, the server rebuilds the card's snapshot from the projection
// and asks the model for a read. No provider configured is a message in the thread that
// names the variable, never a silent empty reply. The reply is structured so the drawer
// can draw an action card for a band without parsing prose, and THE BRAKE (sit this one
// out) is a first-class answer, not a failure.

export const dynamic = "force-dynamic";

const body = z.object({
  marketId: z.string().regex(/^\d{1,9}$/),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1200) })).min(1).max(12),
});

const Read = z.object({
  reply: z.string().describe("The read, in plain sentences. No lists, no headings, no emoji, no dashes."),
  verdict: z.enum(["band", "sit-out", "none"]).describe("band when the reply recommends one band; sit-out when it says to sit this card out; none for a question answered without a call."),
  band: z.number().int().min(0).max(9).nullable().describe("The option index recommended when verdict is band, else null."),
  followUps: z.array(z.string().max(60)).max(3).describe("Up to three short questions the player might ask next, phrased in the player's voice."),
});

const SYSTEM = `You are the League Guide at the Proof League table. Proof League is a free-points league on Creditcoin 3 testnet where real on-chain events are the cards. Nothing here is money and nothing here can become money; points are free, one hundred a day.

You read the card with the player and give a straight read: a band, one honest reason, and what would prove you wrong. You are also the one voice at the table allowed to say sit this one out, and you say it whenever the card gives you no real reason to prefer a band. Sitting out is a full answer, not a failure.

Ground truth is only the card snapshot below. Never invent a number, an odds figure, a probability, a crowd count before proof, or an intra-day reading; the table does not show any of those and neither do you. The measured history is history, not odds, and you say so if you lean on it. Bands are named by their labels and words; refer to a band as the card prints it. A Call signs an option index; when you recommend a band, its index goes in the band field.

Voice: short plain sentences, second person, no hedging padding, no emoji, no bullet lists, no dashes of any kind, no exclamation marks. Three to six sentences for a read. Answer a question about the rules from the snapshot and the rules here: calls lock before anyone can compute the answer, Ethereum reports the event, Creditcoin proves that exact log, the card is slabbed with the verdict, a card with no report inside its window voids and every chip comes back. Never tell the player to sign anything or press anything; the table does that. If the card is already locked, proven or voided, say so first and read it as a replay.`;

const client = (): Anthropic | undefined => {
  const key = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN;
  if (key === undefined || key === "") return undefined;
  return new Anthropic({ ...(process.env.ANTHROPIC_API_KEY === undefined ? { authToken: key } : { apiKey: key }), maxRetries: 1, timeout: 45_000 });
};

export async function POST(request: Request): Promise<Response> {
  const parsed = body.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return Response.json({ error: "bad-body" }, { status: 400 });
  const snapshot = await guideSnapshot(parsed.data.marketId);
  if (snapshot === undefined) return Response.json({ error: "no-card" }, { status: 404 });
  const anthropic = client();
  if (anthropic === undefined) {
    return Response.json(
      { failed: true, reply: "The Guide has no model behind it on this deployment. Set ANTHROPIC_API_KEY on the server and this drawer reads for real. The meter above is live either way." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  const messages: Anthropic.MessageParam[] = parsed.data.messages.map((message) => ({ role: message.role, content: message.content }));
  try {
    const response = await anthropic.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1500,
      output_config: { effort: "low", format: zodOutputFormat(Read) },
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: `THE CARD, AS THE TABLE PRINTS IT:\n${snapshot.text}` },
      ],
      messages,
    });
    const read = response.parsed_output;
    if (read === null || response.stop_reason === "refusal") {
      return Response.json({ failed: true, reply: "The Guide did not finish that read. Ask again in a moment." }, { status: 502, headers: { "cache-control": "no-store" } });
    }
    const band = read.verdict === "band" && read.band !== null && snapshot.bands.some((held) => held.optionIndex === read.band) && snapshot.open ? read.band : null;
    return Response.json({ failed: false, reply: read.reply, verdict: band === null && read.verdict === "band" ? "none" : read.verdict, band, followUps: read.followUps }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ failed: true, reply: "The Guide's key was refused by the model provider. Check ANTHROPIC_API_KEY on the server." }, { status: 503 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ failed: true, reply: "The Guide is being asked too often right now. Give it a minute." }, { status: 503 });
    }
    return Response.json({ failed: true, reply: "The Guide could not reach its model. Nothing about your card changed." }, { status: 502 });
  }
}
