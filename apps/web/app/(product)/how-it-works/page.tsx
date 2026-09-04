import { MIN_STAKE, PICK_POINTS_DAILY, SEVEN_CHECKS } from "@proof-league/shared";

// HOW IT WORKS (Masayume's content-as-data page, in the table's words): four numbered
// steps, the mechanics, the seven checks. Every number here is the constant the code
// enforces, imported, so this page cannot drift from the rules it describes.

const STEPS = [
  {
    n: "01",
    title: "Hold a card",
    body: "A real on-chain event is dealt as a card: Lido's daily staking rate on Ethereum today, a sealed Sepolia block draw when a round is admitted. The card prints the question, the bands and three clocks: when Calls lock, when the event lands, when the proof is due.",
  },
  {
    n: "02",
    title: "Chips down, lock it in",
    body: `Press a band, toss chips from today's rack of ${PICK_POINTS_DAILY} free points (${MIN_STAKE} at least), and sign one message. It moves no funds and authorises nothing else. Your Call is sealed as a card and stays private until you publish it.`,
  },
  {
    n: "03",
    title: "Ethereum reports, Creditcoin proves",
    body: "Calls lock before the event can be computed by anyone, us included. At lock the whole set of Calls is published and pinned on-chain by its hash. When the event lands, a proof of that exact log is checked on Creditcoin against seven conditions.",
  },
  {
    n: "04",
    title: "Slabbed and scored",
    body: "The card flips home, the needle lands, and the foil carries the verdict. A correct Call pays your chips times the number of bands. A miss stays on your shelf at full size. A card whose event never lands voids and every chip comes back.",
  },
];

const MECHANICS = [
  ["BANDS RE-CENTRE DAILY", "Each Lido card's bands sit on the previous proven value, plus or minus 0.015 and 0.050 points, so a slow drift cannot park the answer in one bucket. The first card uses the measured quintiles."],
  ["PAYOUT", `Chips × bands. Five bands pay five to one on a correct Call, nothing on a miss. Random play is break even by construction; skill is the only edge.`],
  ["STREAK", "Consecutive days with at least one correct Call, counted only after the day is final. A day with no Call pauses it; a day of misses breaks it."],
  ["VOID", "If no matching event lands inside the card's window, anyone can void it after the deadline. Nothing scores, every chip returns, and no human decides."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-12 px-4 py-8 md:px-10 md:py-12">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-.04em] text-stock">How it works</h1>
        <span className="font-serif text-[26px] italic text-gold">four steps</span>
      </div>

      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map((step) => (
          <li key={step.n} className="rounded-[16px] border-2 border-white/15 bg-black/25 p-5">
            <div className="font-data text-[9.5px] tracking-[.18em] text-gold">{step.n}</div>
            <h2 className="mt-1 font-display text-[22px] font-extrabold tracking-[-.03em] text-stock">{step.title}</h2>
            <p className="mt-2 font-body text-[13.5px] leading-relaxed text-felt-1">{step.body}</p>
          </li>
        ))}
      </ol>

      <section>
        <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">THE RULES</div>
        <dl className="divide-y divide-white/10 border-y border-white/10">
          {MECHANICS.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 md:grid-cols-[200px_1fr]">
              <dt className="font-data text-[10px] tracking-[.14em] text-gold">{k}</dt>
              <dd className="font-body text-[13.5px] leading-relaxed text-felt-1">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-3 font-data text-[9.5px] tracking-[.18em] text-felt-2">THE SEVEN CHECKS · WHAT THE CREDITCOIN CONTRACT REFUSES</div>
        <ol className="grid gap-2">
          {SEVEN_CHECKS.map((check, index) => (
            <li key={check.id} className="flex gap-4 rounded-[12px] border border-white/15 px-4 py-3">
              <span className="font-display text-[16px] font-extrabold text-gold">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="font-display text-[15px] font-extrabold tracking-[-.01em] text-stock">{check.title}</div>
                <div className="mt-0.5 font-body text-[13px] leading-relaxed text-felt-1">{check.plain}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 font-body text-[13px] leading-relaxed text-felt-2">
          No human is part of the referee. Adding a winning Call afterwards is not something we decline to do; it is something the chain refuses.
        </p>
      </section>
    </div>
  );
}
