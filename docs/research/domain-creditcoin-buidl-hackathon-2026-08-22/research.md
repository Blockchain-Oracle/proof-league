---
title: 'domain research: Creditcoin BUIDL hackathon'
type: 'domain'
topic: 'Creditcoin BUIDL hackathon'
decision: 'Scope the hackathon entry to the actual brief, judging criteria, deadlines, prizes'
source: 'native run (web fan-out, 1 dimension × 2 rounds incl. official AMA transcript)'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-08-22'
updated: '2026-08-22'
---

# domain research: Creditcoin BUIDL hackathon

**Decision this research serves:** Scope the hackathon entry to the actual brief, judging criteria, deadlines, prizes.

## Executive summary

**The event is BUIDL CTC 2026 Fall — "BUIDL For The Real World" (DoraHacks), submissions open now, deadline September 6, 2026, 11:59 PM ET — 15 days from the access date.** Three findings drive scoping:

1. **Attestcoin integration is a hard gate AND the scoring edge.** Every submission "must leverage the Attestcoin Protocol" — working integration code plus technical documentation, with "depth of Attestcoin Protocol utilization … one of the core scoring criteria" [1][3]. Last edition, only ~1 of 24 sampled projects used USC at all, and a USC-based project (HashCredit) won a prize [6][7]. The sponsor re-centered this edition on exactly the stack the field avoided — deep, correct usage is scarce and rewarded.
2. **Judges score like VCs, not like a demo derby.** The five CEIP pillars govern: user base expansion, technical alignment, product vision, execution capability, market & technical relevance — stated verbatim in the official AMA as the hackathon's criteria; top-3 winners fast-track into CEIP due diligence ($25k–$250k range investments) [2][4]. All three Spring winners were credit/finance-shaped products with a fundable story [7]. A "product, not demo" posture is not taste here — it is the rubric.
3. **The rules constrain the build in four concrete ways:** open source required, with *incremental transparent commits* (no end-window code dump) [5]; original work built during the window; deployed on testnet; readability only — writability is explicitly out of scope, outbound actions must use conventional RPC [2][8].

**Biggest caveat:** no numeric weights for the five pillars and no named judge roster exist anywhere official; and the Fall gallery shows zero public submissions as of 2026-08-22 (115 registered hackers), so competitor concentration is unknowable until entries appear [9].

## The event

**BUIDL CTC 2026 Fall — "BUIDL For The Real World"**, hosted on DoraHacks, sponsored by Creditcoin & Credit Labs [1]. Timeline: submissions open 2026-08-13; kickoff AMA 2026-08-18 (recording: youtu.be/HPL6LjTqQm4); **submission deadline 2026-09-06 23:59 ET** (stated twice in the AMA; the DoraHacks widget's "00:59" render is a timezone artifact) [2]; winners announced 2026-09-18 [1]. Registration on DoraHacks is not entry — "your final project upload is your official entry" [2]. The organizer has extended deadlines before (Spring edition, announced on X) — plan for Sep 6, treat any extension as a gift [10].

**Prizes:** one shared $15,000 pool — $10k / $3k / $2k — plus CertiK perks for all winners (8k audit credits, 3 months Skynet Boost) and CEIP fast-track (straight to due diligence) for the top three; the grand-prize winner outside South Korea gets flights + hotel to CTC Ignition 2026 [1][2][11].

**Tracks** (theme is the gate; tracks are framing): DeFi, RWA, DePIN, Gaming, and new-this-season AI — "AI apps on Creditcoin that process cryptographically verified cross-chain data to autonomously inform decisions … without centralized oracle operators" [3]. Sponsor's per-track head starts named in the AMA: Gaming = launchpad and shared gaming tokens; AI = verified cross-chain data with decentralized oracle [2]. A prediction league straddles Gaming and AI; track choice is positioning, not eligibility.

## Rules of the game

- **Attestcoin gate:** "meaningful and functional integration … as a core feature"; submission must include working integration code, an Attestcoin Integration Summary, and technical documentation of how the build uses it; "depth of Attestcoin Protocol utilization will be evaluated as one of the core scoring criteria" [1][3].
- **Judging = the five CEIP pillars**, per Sung (Credit Labs, runs CEIP): user base expansion, technical alignment, product vision, execution capability / team track record, market & technical relevance — "not only the core criteria for CEIP, but also this hackathon." No numeric weights published [2][4].
- **Open source, built in the open:** "Yes, it needs to be open source" + explicit request for incremental commits over one final dump. No specific license named [5].
- **Original work created during the hackathon; deployed on a testnet; min team size 1** (no stated max) [1].
- **Submission package:** public GitHub repo with README, project deck/whitepaper PDF, prototype demo video URL, Attestcoin Integration Summary, sector, team bios [1].
- **Technical scope per the AMA:** readability only (writability "not in scope … you would be doing readability mostly"); build on the ordinary Creditcoin testnet (no separate USC testnet); CTC test tokens via the Discord faucet; reads carry no ATC fee (ATC covers stake/writability economics; CTC covers gas) [2][8].

## Sponsor expectations & vocabulary

Sponsor framing: "trustless cross-chain DeFi, tokenized real-world assets, gaming economies, or verifiable governance" [1]. The flagship narrative is "Universal Credit" — portable cross-chain reputation built from verified financial behavior [12]. The protocol was rebranded mid-season: **USC → Attestcoin (ASC)** — the AMA says expect "ASC instead of USC"; use "Attestcoin Protocol" in all judge-facing material while expecting `usc-*` repo/package names [2]. Named people: Minko (host), DS Choi (product), Dave (Attestcoin protocol lead), Sung (Credit Labs / CEIP — answered the judging question) [2]. Support: Discord #buidl-ctc-qna, team@creditcoin.org [1]. Ecosystem surfaces that can feature a dApp: PenguinSwap (native DEX), PenguinBase (campaign hub), Credit Wallet [2].

## The competitive field

Spring 2026 edition: 76 BUIDLs from 189 hackers; winners CrediKye (gamified ROSCA savings circles — ranks/badges/XP), HashCredit (BTC mining payouts → USDT credit lines **via USC** — the reference implementation to study: github.com/inchyangv/ctc-hashcredit), SnowBall (RWA DeFi rails); organizer summary: all three credit/finance-shaped, none gaming [6][7]. USC adoption was ~1 in 24 sampled projects; one project even shipped on the wrong (legacy) testnet [6]. Fall edition as of 2026-08-22: 115 hackers registered, **zero public submissions**, empty announcements tab [9]. One competitor signal: a builder self-identifying as an AI agent preparing a Fall entry filed a detailed infrastructure issue on Gluwa's repos in July [13].

## Cross-dimension insights

- The five CEIP pillars + the Attestcoin-depth criterion + the finance-shaped winner history say the winning formula is **a fundable product story wrapped around genuinely deep protocol usage** — not the flashiest demo. "User base expansion" and "market relevance" must be answered explicitly in the deck, even for a game.
- The incremental-commit rule converts process into evidence: a clean public commit history from day one *is* scoring material for "execution capability."
- Zero submissions + mandatory Attestcoin + last season's 4% adoption = most Fall entries will bolt Attestcoin on shallowly (the tutorials will spawn bridge clones). An entry whose *core loop is impossible without* Attestcoin occupies the exact center of the rubric.

## Recommendations (downstream bindings)

1. **Brief:** scope to one end-to-end loop that cannot exist without Attestcoin; write the deck against the five pillars explicitly. Confidence: high [2][4].
2. **Plan/schedule:** work back from Sep 6 23:59 ET — demo video + deck + integration summary are deliverables, not afterthoughts; budget the final 3 days for them. Start public commits immediately. Confidence: high [1][2][5].
3. **PRD:** include a "user base expansion" answer (who plays this after the hackathon, and how it grows) — it is a named pillar. Confidence: high [2].
4. **Open items to ask in #buidl-ctc-qna:** max team size; license preference. Confidence: the gaps are confirmed; the channel is the sponsor-designated route [1][5].

## Open questions

- Numeric pillar weights and judge roster — unpublished; treat all five pillars as equal.
- Whether a deadline extension will occur (precedent exists) — never plan on it.
- Competitor concentration by track — poll the Fall gallery weekly as submissions land.

## Source appendix

| [n] | Supports | Publisher | Pub | Accessed | Conf |
|---|---|---|---|---|---|
| [1] | Event page: dates, prizes, rules, submission package | [DoraHacks — BUIDL CTC 2026 Fall detail](https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail) | — | 2026-08-22 | high |
| [2] | AMA: deadline 23:59 ET, pillars, readability-only, faucet, rebrand, people | [Creditcoin — Kickoff AMA recording](https://youtu.be/HPL6LjTqQm4) | 2026-08-18 | 2026-08-22 | high |
| [3] | Tracks incl. new AI track; Attestcoin tagging | [DoraHacks — tracks page](https://dorahacks.io/hackathon/buidl-ctc-2026-fall/tracks) | — | 2026-08-22 | high |
| [4] | CEIP $10M program, $25k–$250k range | [Creditcoin blog — BUIDL CTC hackathon](https://creditcoin.org/blog/buidl-ctc-hackathon/) | 2025-12-16 | 2026-08-22 | med |
| [5] | Open source + incremental commits | [Creditcoin — Kickoff AMA recording](https://youtu.be/HPL6LjTqQm4) | 2026-08-18 | 2026-08-22 | high |
| [6] | Spring gallery: 76 BUIDLs; ~1/24 used USC | [DoraHacks — buidl-ctc gallery](https://dorahacks.io/hackathon/buidl-ctc/buidl) | — | 2026-08-22 | high |
| [7] | Spring winners incl. USC-based HashCredit | [DoraHacks — winners page](https://dorahacks.io/hackathon/buidl-ctc/winner) + [HashCredit BUIDL](https://dorahacks.io/buidl/40363) | — | 2026-08-22 | high |
| [8] | Supported chains, testnet infra addresses | [Creditcoin docs — chains & environments](https://docs.creditcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments.md) | — | 2026-08-22 | high |
| [9] | 115 hackers, zero public submissions | [DoraHacks — Fall gallery/announcements](https://dorahacks.io/hackathon/buidl-ctc-2026-fall/buidl) | 2026-08-22 | 2026-08-22 | med |
| [10] | Spring deadline extension precedent | [Creditcoin on X](https://x.com/Creditcoin/status/2021265644373626953) | — | 2026-08-22 | med |
| [11] | Eventbrite cross-check; Ignition trip | [Eventbrite — BUIDL CTC 2026 Fall](https://www.eventbrite.com/e/buidl-ctc-2026-fall-buidl-for-the-real-world-tickets-1996434483282) | — | 2026-08-22 | med |
| [12] | Universal Credit narrative; reference dApps | [Creditcoin blog — universal-smart-contracts](https://creditcoin.org/blog/universal-smart-contracts/) | 2025-09-09 | 2026-08-22 | high |
| [13] | AI-agent competitor signal; faucet issue | [Gluwa — USC-Builder-Examples issue #36](https://github.com/gluwa/USC-Builder-Examples/issues/36) | 2026-07-28 | 2026-08-22 | med |

## Staleness map

Domain pack bar says regulatory/rules claims get re-verified whenever load-bearing regardless of date. Fastest-aging: **submission count / competitor field** (re-check the Fall gallery weekly, and daily in the final week); **deadline** (extension precedent — re-check the DoraHacks page and @Creditcoin before planning the final 72 h); **announcements tab** (currently empty — new rules can land there; check twice weekly). Earliest re-check: gallery + announcements, ~2026-08-29.
