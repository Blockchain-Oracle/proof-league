import { ImageResponse } from "next/og";
import { z } from "zod";
import { formatUtc } from "@proof-league/shared";
import { callTextOf, shortHash } from "../../../../components/card/bands.js";
import { familyOfEmitter } from "../../../../components/event/family.js";
import { chainClock } from "../../../../lib/chain-clock.js";
import { cardsFor } from "../../../../lib/cards-data.js";
import { shareFonts } from "../../../../lib/share-fonts.js";

// The slab as a picture (design: THE SHELF slab, 4:5 at 1200x1500; 1200x630 with ?og=1).
// Rendered by satori from the same canonical facts the shelf reads, so the PNG can never
// say something the table would not. Only committed and settled Calls are public data;
// a draft still at the door is refused, because sharing it would publish the door's file.

export const dynamic = "force-dynamic";

const query = z.object({
  m: z.string().regex(/^[0-9]+$/),
  p: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  n: z.coerce.number().int().min(0),
  og: z.string().optional(),
});

const STOCK = "#F7F1E3";
const INK = "#14161B";
const GREEN_INK = "#14201A";
const FELT = "#1E4633";
const GOLD = "#E8B84B";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "bad-query" }, { status: 400 });
  const { m, p, n, og } = parsed.data;
  const clock = await chainClock();
  const card = (await cardsFor(p, clock.chainNowSec)).find((held) => held.marketId === m && held.nonce === n);
  if (card === undefined) return Response.json({ error: "no-card" }, { status: 404 });
  if (!card.committed && card.view.settlement === undefined) return Response.json({ error: "private-until-committed" }, { status: 403 });
  const family = familyOfEmitter(card.view.emitter);
  if (family === undefined) return Response.json({ error: "no-family" }, { status: 404 });

  const settled = card.view.settlement;
  const won = card.stage.kind === "correct";
  const decided = card.stage.kind === "correct" || card.stage.kind === "incorrect";
  const voided = card.view.voided;
  const call = callTextOf(card.view, family, card.optionIndex) ?? `OPTION ${card.optionIndex + 1}`;
  const line1 = decided && settled ? `PROVEN ${settled.valueLabel} · ${won ? "CORRECT" : "MISS"}` : voided ? "NO EVENT INSIDE THE DEADLINE" : `SEALED · LOCKS ${formatUtc(card.view.lockTime).slice(11, 16)} UTC`;
  const line2 = decided ? `${card.stake} PTS IN · ${won ? card.stake * card.view.options.length : 0} OUT` : voided ? `VOID · ${card.stake} PTS RETURNED` : `${card.stake} PTS DOWN · PAYS ${card.stake * card.view.options.length}`;
  const foilText = decided ? "PROVEN ON CREDITCOIN" : voided ? "VOID · POINTS RETURNED" : "SEALED";
  const foilBg = won ? "linear-gradient(100deg,#8E6F22 0%,#B8912F 22%,#F5D283 46%,#FFF3D2 52%,#E8B84B 62%,#8E6F22 100%)" : decided ? "linear-gradient(100deg,#8E938A,#C6CBC1 45%,#9AA096)" : voided ? "#C7C2B4" : GREEN_INK;
  const tx = decided && settled?.proofTxHash ? `TX ${shortHash(settled.proofTxHash)}` : `SERIAL ${m}-${n}`;
  const wide = og !== undefined;
  const width = 1200;
  const height = wide ? 630 : 1500;
  const scale = wide ? 1.6 : 3.2;
  const fonts = await shareFonts();

  return new ImageResponse(
    (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center", background: FELT, backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.13) 0 6px, transparent 6px 15px)", fontFamily: "Bricolage Grotesque" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 262 * scale, padding: 14 * scale, borderRadius: 20 * scale, border: `${2 * scale}px solid rgba(255,255,255,.42)`, background: "linear-gradient(160deg, rgba(255,255,255,.22), rgba(255,255,255,.05) 45%, rgba(255,255,255,.16))" }}>
          <div style={{ display: "flex", flexDirection: "column", background: STOCK, border: `${3 * scale}px solid ${INK}`, borderRadius: 13 * scale, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: family.color, padding: `${8 * scale}px ${11 * scale}px`, borderBottom: `${3 * scale}px solid ${INK}` }}>
              <span style={{ color: STOCK, fontSize: 11 * scale, fontWeight: 800 }}>{family.name}</span>
              <span style={{ color: "rgba(247,241,227,.8)", fontSize: 8 * scale, fontFamily: "JetBrains Mono" }}>{formatUtc(card.view.lockTime).slice(0, 10)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: 12 * scale }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 8.5 * scale, letterSpacing: 2, color: "#5C6660" }}>MY CALL</span>
              <span style={{ marginTop: 5 * scale, fontSize: 21 * scale, fontWeight: 800, color: INK, letterSpacing: -1 }}>{call}</span>
              <div style={{ height: 2 * scale, background: INK, margin: `${11 * scale}px 0` }} />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9.5 * scale, color: "#4A544D" }}>{line1}</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9.5 * scale, color: "#4A544D", marginTop: 4 * scale }}>{line2}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11 * scale, padding: `${8 * scale}px ${11 * scale}px`, borderRadius: 9 * scale, border: `${2 * scale}px solid ${INK}`, background: foilBg }}>
            <span style={{ fontSize: 12 * scale, fontWeight: 800, whiteSpace: "nowrap", color: decided || voided ? GREEN_INK : GOLD }}>{foilText}</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 8.5 * scale, whiteSpace: "nowrap", marginLeft: 8 * scale, color: decided || voided ? GREEN_INK : "#8FA79A" }}>{tx}</span>
          </div>
          <span style={{ marginTop: 10 * scale, fontFamily: "JetBrains Mono", fontSize: 8 * scale, letterSpacing: 2, color: "#A9C0B4" }}>PROOF LEAGUE · TABLE ONE</span>
        </div>
      </div>
    ),
    { width, height, fonts },
  );
}
