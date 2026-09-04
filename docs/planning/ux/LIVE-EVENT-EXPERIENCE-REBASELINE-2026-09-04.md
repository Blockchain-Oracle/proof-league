---
title: "Proof League Live-Event Experience Rebaseline"
status: authoritative
created: 2026-09-04
owner_decision: approved
visual_design_status: open_after_rejected_first_interpretation
implementation_status: paused_pending_owner_design_approval
task_boundary: product objects, interaction meaning, truth and completeness authority; no approved final visual composition, deployment or live action
supersedes_on_conflict:
  - "./GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md"
  - "./FULL-REFERENCE-UX-INVENTORY-2026-09-03.md"
  - "../prd/fidelity-revision-2026-09-02.md"
  - "./REFERENCE-DESIGN.md"
  - "./PRODUCT-FLOWS.md"
implementation_handoff: "../../../FIDELITY-IMPLEMENTATION-HANDOFF.md"
prompt_pack: "../../../AI-AGENT-PROMPT-PACK.md"
---

# Proof League Live-Event Experience Rebaseline

> **Owner design gate, 2026-09-04:** The first UI interpretation of this document was rejected and
> reverted. Do not reproduce that monochrome signal-chamber implementation, and do not return to the
> older dashboard. This document remains authority for product objects, interaction semantics, truth
> boundaries and completeness—not for a finished visual composition. The next phase is the independent
> designer brief at `.agents/ao/handoff/2026-09-04-proof-league-designer.md`; production UI work waits
> for Abu to approve a design territory.

## 0. The decision

The current implementation direction is rejected as a product experience. It is cleaner than the
first attempt, but it still presents Proof League as a dark crypto dashboard made from generic rows,
percentages and card-shaped containers. It does not make a prediction feel alive.

This document replaces that direction.

Proof League is a living on-chain prediction league. Real events are the matches. A Player studies
an event, calls an outcome, commits free points, receives a collectible personal Card, waits for the
chain event, experiences a reveal, and sees the effect on score, Streak and rank. Creditcoin proof is
the referee that makes the result undeniable. It is not the stage, the game piece or the opening
conversation.

The canonical loop is:

```text
discover a live event
  -> understand what can happen
  -> make a Call
  -> commit free points
  -> receive Your Card
  -> wait with a meaningful event state
  -> experience the reveal
  -> see score, Streak and rank consequences
  -> share, review proof or play the next event
```

The proof loop begins only from that exact event or personal Card:

```text
why is this result trustworthy?
  -> what happened, where and when
  -> how Proof League locked and verified it
  -> technical proof receipt and explorer evidence
```

The user has explicitly authorized a full visual reset. The current near-black, cream and
vermilion system, editorial table treatment, percentage rows and existing generic card composition
are not protected. Keep them only if a fresh event-first design earns them. Do not preserve rejected
presentation because code already exists.

This decision does not change the integrity model: free points only, no order book, no financial
position, admitted source events, one canonical Pick path, proof-confirmed settlement, canonical
score/Streak truth, explicit operator authority and honest unavailable states.

## 1. The correction in one sentence

**Do not gamify a proof dashboard. Turn each admitted on-chain event into a distinct prediction
experience, then let one personal Card carry the Player through anticipation, proof and consequence.**

## 2. Product ontology: four objects, one Card

The previous documents overloaded “Card.” That caused the implementation to make every rectangular
surface look interchangeable. The product now has four different objects.

| Object | Job | Shape and behavior | Ownership |
|---|---|---|---|
| **Event tile / Event poster** | Help a Player discover something worth predicting | A live preview with event-specific motion, timing, source and choices. It opens an Event Stage. It is not a collectible Card | Public |
| **Event Stage** | Make this event understandable and playable | A family-specific instrument: signal, race, milestone track, chamber, gauge or reveal object. It contains the canonical Pick action | Public until the Player commits |
| **Your Card** | Preserve what this Player called | A personal 4:5 collectible that emerges only after Pick acceptance and evolves through waiting and result states | One Player and one accepted Pick |
| **Proof Receipt** | Show why the exact result is trustworthy | Plain-language evidence first, then lifecycle and technical identifiers | Attached to the exact Event and Your Card |

Only the player-owned artifact is called a **Card** in user-facing language. Avoid “Market Card,”
“game card” or “settlement card” when those objects are discovery tiles, stages or proof receipts.

### 2.1 What is not a Card

- A question plus five horizontal percentages is not a Card.
- A generic black rectangle with an icon and CTA is not a game or event identity.
- A proof receipt without the Player's Call, points and consequence is not Your Card.
- A settled Market summary is not the Player's record.
- A 4:5 aspect ratio alone does not create collectibility.

### 2.2 What makes Your Card collectible

Your Card has stable identity, personal authorship, event identity, scarcity in time, state change and
social legibility. It is not an NFT, token or transferable asset.

It always contains:

- Proof League mark and a stable public-safe Card id;
- Player identity;
- the event name and question;
- the selected outcome in dominant type or imagery;
- committed points;
- creation time and absolute UTC lock time;
- source and source chain in ordinary language;
- the current lifecycle state;
- a direct path back to the exact Event Stage.

It gains, only from canonical truth:

- the observed result and winning outcome;
- correct, incorrect, voided or stuck state;
- score change;
- day status and finalized Streak effect;
- proof verification time and receipt;
- a share/export state.

## 3. Product truth: what actually exists

The interface must not pretend the catalogue is broader than the protocol.

### 3.1 Current network roles

| Role | Network | Confirmed use |
|---|---|---|
| Source | Ethereum mainnet | Lido `TokenRebased` event for the recurring daily rate-ratio APR Series |
| Source | Sepolia | Hosted Round and future-block draw source |
| Verification and scoring | Creditcoin 3 testnet | Attestcoin verification, Market resolution, scoring, Streak and League state |

User-facing copy may say **two source chains, verified and scored on Creditcoin**. Creditcoin is not
a third source chain.

### 3.2 Current on-chain inventory snapshot

The 2026-09-04 read-only snapshot reported:

- six Markets total;
- one registered recurring Series;
- two decoder registrations;
- Markets 1 to 3 voided;
- Markets 4 and 5 resolved Hosted Rounds from Sepolia;
- Market 6 created for the five-band Lido event on Ethereum mainnet.

Re-read chain state before treating these counts or ids as current. The UX must distinguish current
runtime truth, dated evidence and planned event families.

### 3.3 What the protocol shape permits

The current Market model accepts two to six outcomes by mapping a proven scalar through sorted
thresholds. That is a settlement primitive, not a visual template. Different event families can use
the same scalar/threshold machinery while presenting different questions and interactions.

The event catalogue must therefore carry presentation metadata in addition to proof metadata:

- family and archetype;
- human event title and question;
- outcome labels and semantic meaning;
- event object, actors or competing sides;
- start, lock, observation and expected resolution times;
- ordinary-language source and settlement explanation;
- stage composition and Card motif;
- historical context that is not represented as market odds;
- readiness, dependency and manipulation notes.

## 4. Event catalogue: real, next and future

This is the experience-design catalogue. “Live” is reserved for registered, queryable and playable
events. Candidate families may guide the system but may not appear as playable inventory until
their source event, decoder, timing, admission and manipulation boundaries exist.

| Family | Example question | Truth/status | Event Stage | Your Card motif |
|---|---|---|---|---|
| **Yield Signal** | Which band will Lido's next daily staking rate land in? | Current recurring Series on Ethereum mainnet | Five-zone living signal/dial with a moving pulse and clear band boundaries | Chosen band as a luminous horizon; signal resolves through it at reveal |
| **Block Draw** | Which outcome will the admitted future block select? | Existing Hosted Round capability on Sepolia; show only when a real round is admitted | Sealed block/reveal chamber with target block and countdown | A sealed ticket that opens into the proven draw |
| **Reward Harvest** | Which band will Lido's next execution-layer reward amount land in? | Low-lift candidate from the same receipt; requires a new decoder/Series | Chamber or reservoir that fills on each admitted report | Chosen fill zone with the final reward line stamped after proof |
| **Pool Race** | Which Uniswap v4 pool reaches the target first in the window? | Strong candidate; requires explicit pool set, observation rule, decoder and admission | Named lanes with live but non-price progress and a fixed finish rule | Player-backed lane, finish order and proof seal |
| **Milestone** | Will the beacon deposit index cross the target before the deadline? | Candidate; requires watcher/decoder and manipulation review | Progress track or calendar window with a real threshold | Target marker, closing window and achieved/missed stamp |
| **Governance** | Will the Aave proposal pass, and in which turnout band? | Opportunistic candidate; only when an eligible live proposal exists | Proposal chamber with For/Against/Abstain and terminal-state rules | Player's ballot side, proposal identity and final tally consequence |
| **Weekly Allocation** | Which Curve gauge leads the weekly allocation? | Candidate; requires early snapshot lock, candidate set and Snapshot Keeper | Gauge territory/map with named contenders | Chosen gauge crest and final allocation rank |
| **Network Pulse** | Will the fork activate in the window, or which base-fee band holds over the interval? | Candidate; requires a probe or accumulator | Activation sequence or pulse field, never a generic line chart | Activation/missed mark or interval band with observed value |

### 4.1 Rejected or deferred event patterns

- Do not default to spot-price prediction or price charts. The product predicts on-chain events, not
  generic token prices.
- Do not show a chart when the decision is a race, milestone, ballot, draw or categorical result.
- Do not treat crowd Pick distribution as tradable probability, implied odds or a price.
- Do not use a single transaction's gas use as a serious public Market without a manipulation model.
- Do not use deterministic unlock dates as predictions.
- Do not present absence-of-liquidation or similarly controllable actor behavior as safe until its
  manipulation surface is resolved.
- Do not fill the Event Board with fabricated “coming soon” events to create apparent breadth.

## 5. Experience archetypes

The shared system is not one shared visual template. It is a grammar with event-family instruments.

### 5.1 Yield Signal

Use for the current Lido five-band event.

The Player should encounter:

1. a short event name: **Lido Yield Signal**;
2. the actual question and next observation time;
3. one sentence explaining what changes the result;
4. a five-zone apparatus whose bands are spatially and semantically distinct;
5. recent proven outcomes as small historical marks, explicitly labelled as history, not odds;
6. a selected band that expands into the points composer;
7. a preview of the Card the Player is about to create;
8. the accepted Card emerging from the instrument after signing.

Do not lead with five identical percentage bars. Crowd Picks, if shown, belong after commitment or
behind a “League calls” reveal so they cannot be mistaken for market prices and do not dominate the
Player's independent judgment.

### 5.2 Block Draw

Use for a real admitted Hosted Round.

The draw should feel sealed but inspectable:

- target block and lock time are visible;
- the possible outcomes are visible;
- the future value is not implied to be knowable;
- acceptance produces a sealed personal Card;
- waiting turns the target block into a return ritual;
- reveal opens the sealed Card and shows the proven source;
- a failed, voided or delayed round remains explicit rather than becoming endless animation.

### 5.3 Pool Race

Use only after its settlement rules are admitted.

The stage is a race between named on-chain actors, not an exchange chart:

- each lane represents an exact pool/address and target metric;
- start, finish, window and tie behavior are stated before the Pick;
- visual progress never outruns canonical indexed data;
- choosing a lane creates a Card identified with that contender;
- final order arrives only after proof-confirmed settlement.

### 5.4 Milestone

The stage is a threshold and a deadline:

- show current verified progress, target and window;
- make “before” and “after” rules legible;
- use time and distance-to-target as context, not probability;
- preserve “not observed yet,” “source delayed,” “missed,” “achieved” and “voided.”

### 5.5 Governance

The stage is a proposal, not a token chart:

- explain the proposal in one plain sentence;
- show the exact eligible outcomes and terminal condition;
- separate current public tally from the final prediction result;
- never imply the Player is casting an on-chain governance vote;
- produce a prediction Card, not a ballot receipt.

## 6. Information architecture

The primary jobs are:

| Destination | Job |
|---|---|
| **Play** | Resume an active Call or enter the best live Event/deck now |
| **Events** | Browse the complete honest catalogue by live, locking, waiting and recently resolved |
| **League** | See rank, Streak, day state and other Players |
| **Record** | Review Your Cards across open, correct, incorrect, voided and stuck states |

`More` contains How it works, Transparency/Proof, Activity, Settings, Challenges, Guide and any
role-gated creation tools. A contextual challenge or Guide action can appear near an Event, but does
not displace the four persistent jobs.

Desktop and mobile derive from one typed registry. Mobile uses a complete scrollable drawer for
everything not in the bottom bar. There is no desktop-only route.

### 6.1 Header hierarchy

The header answers, in order:

1. Where am I?
2. What can I play or resume?
3. Who am I?
4. What is my real Streak/day state?
5. Are settings, Guide and activity available?

Do not make a proof ticker the loudest persistent object. A small network/verification state may be
available, but live event urgency, active Card and Player progression outrank infrastructure.

### 6.2 First authenticated destination

- A Player with an unresolved Card lands on its waiting/resume state.
- A Player with a newly resolved Card lands on the reveal ritual once, with a clear skip.
- A returning Player without pending state lands on Play and sees the best real live event.
- A Player with no playable event sees the next verified opening time, recent Cards and Practice;
  the app does not invent a live event.

## 7. End-to-end flows

### 7.1 First visit and onboarding

The public landing must explain the loop with one real event, not an abstract protocol diagram:

1. **Call a real on-chain event.**
2. **Get Your Card.**
3. **Come back for the reveal.**
4. **Build your Streak. Verify any result.**

The first-run primer is versioned, skippable and keyboard-accessible. It uses three concise scenes:

- Events are real and have a lock time.
- Picks use free points and become personal Cards.
- Results are proven; Streak changes only after the day is final.

Do not demand authentication to browse or understand an Event. Ask at the authority boundary after
the Player chooses an outcome and points. Restore the exact event, outcome, points and intended
action after sign-in. A cancelled sign-in returns to the prepared Pick with context intact.

### 7.2 Event Board

The Event Board is an editorial schedule of live things, not a table of pseudo-prices.

Each tile/poster must answer without opening:

- What is happening?
- What can I call?
- When does it lock and resolve?
- Is it live, locking, waiting, resolved, voided, stuck or unavailable?
- Which source chain decides it?
- Have I already called it?

The tile's visual language comes from its event family. A Yield Signal preview can show its five
zones; a race can show contenders; a milestone can show target and distance; governance can show
proposal status. All share typography, spacing, state grammar and proof seal, but not one universal
percentage-row composition.

Sorting/filtering priorities:

1. resume/reveal owed to this Player;
2. live and closing soon;
3. upcoming admitted events;
4. recently resolved;
5. unavailable family explanations outside the live inventory.

### 7.3 Event Stage and Pick

The reading order is:

1. event identity and plain-language question;
2. time state: opens, locks and expected result;
3. the family-specific prediction instrument;
4. selected outcome and free-points composer;
5. confirmation of what will be signed;
6. source and settlement explanation;
7. technical proof model on demand.

The Player should manipulate the event object itself where accessible: choose a signal zone, back a
race lane, place a marker before/after a milestone, choose a governance result, or hold a draw
ticket. The final submit still uses one canonical composer and typed error contract.

### 7.4 Acceptance and Card emergence

On accepted Pick:

- the stage visibly transfers the chosen event identity into Your Card;
- the Card receives its stable id and `Open` state;
- the selected outcome, points and lock time are unmistakable;
- the private/public publication state is explicit;
- the Player can save/share only through truthful available fallbacks;
- “View my Card” and “Back to Events” are clear terminal actions.

Do not show a generic success toast and return to the board. The creation of Your Card is the reward
for the action.

### 7.5 Waiting ritual

Waiting is part of the game, not dead infrastructure time.

The Card and Play surface use meaningful states:

- **Open:** accepted, still before Market lock;
- **Locked:** Calls closed; source event has not happened;
- **Awaiting source:** expected event/window has not been observed;
- **Attesting:** a source observation exists and verification is in progress;
- **Proved:** the observation is verified; Market resolution/scoring is pending if separate;
- **Ready to reveal:** canonical result exists and the Player has not opened the reveal;
- **Stuck:** expected progress exceeded its honest window and operator/retry context is available;
- **Voided:** the Market cannot be scored under its admitted rules.

The UI may invite notifications only after explaining what will trigger them. Denied permission
does not block the Card. The return route remains stable without notifications.

### 7.6 Result reveal and winning ritual

The reveal sequence is earned by proof-confirmed truth:

1. reopen the event object or personal Card;
2. reveal the observed scalar/event in the family's visual language;
3. show which outcome won;
4. resolve Your Card as correct, incorrect or voided;
5. apply score change;
6. show whether the day is still provisional or finalized;
7. only then animate Streak extended/broken/unchanged;
8. offer proof, share and next event.

Correct and incorrect Cards receive equal information density. A miss is part of the permanent
record, not a dimmed error shell. Voided/stuck states explain what happened and preserve points and
recovery rules.

Motion, sound and haptics heighten the reveal but never carry semantic meaning alone. Respect system
and Player reduced-motion, sound and haptic settings.

### 7.7 Record, League and share

Record is the Player's Card collection. It supports open, waiting, reveal owed, correct, incorrect,
voided and stuck groupings without hiding misses.

League shows canonical rank, score, Streak and day status. Identity loading, never recorded,
unranked and actual zero are distinct.

Share uses a social-first 4:5 Card plus a link preview. Fallback order is:

1. Web Share or file share where supported;
2. generated PNG download;
3. copy stable public link;
4. X intent with truthful text.

Share failure stays in context with retry. Publication is explicit and private by default. A public
recipient sees the exact Card, result state, plain proof explanation and path to the Event without
needing an account.

### 7.8 Proof reveal

Proof has three levels:

1. **Plain result:** “Lido's next verified report landed in 3.0% to 3.5%. Ethereum supplied the
   event; Creditcoin verified it.”
2. **Lifecycle:** source observed, proof submitted, verified, Market resolved, Card scored.
3. **Technical receipt:** chain ids/keys, contract/emitter, event signature, transaction/log,
   decoder, thresholds, proof ids and explorer links.

Opening and closing proof never loses the Event/Card context or the Player's place.

## 8. Ways to play

Modes organize the same admitted Event truth. They do not create a second settlement system.

| Mode | Experience | Truth boundary |
|---|---|---|
| **Live Event** | One complete family-specific Stage | Canonical Pick/Card path |
| **Daily Deck** | Three to five live admitted Events in a quick sequence | Each accepted Call is canonical; progress can resume |
| **Practice** | Replay already-settled Events before revealing the historical answer | No points, score, Streak, rank or public Card effects |
| **Lucky Draw** | A real admitted Hosted Round with a sealed future-block reveal | Available only when such a round exists |
| **Challenge** | Invite someone to call the same admitted Event | Same Market and independent canonical Picks; publication/consent explicit |
| **Duel** | Head-to-head result and rematch ritual | Blocked until authority, matching, scoring and recovery exist |

PIPS contributes the lesson of a dedicated play instrument, one obvious primary action, persistent
Player/Streak feedback, settings and tactile response. Flicky contributes deck rhythm, swipe/choice,
waiting as ritual, result reveal and share. Masayume contributes grouped mode hierarchy, active
resume, Player state and honest live/not-connected/not-built status. These are behavior transfers,
not instructions to copy a handheld console, pixel skin, source code or assets.

## 9. Visual direction

### 9.1 Visual thesis

Proof League should look like a contemporary live-event publication crossed with a collectible
prediction instrument. It should feel authored, kinetic and specific to what is happening on-chain.
It must not look like:

- a generic black Web3 dashboard;
- an exchange terminal without an order book;
- a casino lobby;
- a grid of dark cards with neon icons;
- a thin editorial table with decorative proof jargon;
- a template where every event becomes the same bars or chart.

### 9.2 Palette reset

No existing color is sacred. Choose a compact system after the event-stage prototypes exist:

- one grounded neutral environment with excellent text contrast;
- one core brand signal used for focus and player action;
- family colors tied to event identity, not arbitrary category chips;
- semantic success, miss, warning, voided and stuck colors that remain legible without motion;
- light and dark expressions only if both can retain event identity and contrast.

Do not begin by choosing colors. Begin with black-and-white hierarchy, object silhouette, timing,
choice and reveal. Apply color only after the Yield Signal, Draw and Race prototypes are recognizably
different without labels.

### 9.3 Event identity system

Every family defines:

- a silhouette;
- a spatial choice model;
- a motion behavior;
- an ambient texture or field;
- a sound/haptic motif when enabled;
- a Card front motif;
- a reveal transformation;
- a reduced-motion equivalent.

Shared system elements include the Proof League mark, typography roles, timing grammar, point
composer, Player identity, proof seal, Card proportions and state language.

### 9.4 Typography and density

- The event question is the visual headline.
- Outcome words are playable objects, not tiny labels in a data row.
- Timing is visible and absolute where consequence matters.
- Technical identifiers use monospace only inside proof/activity surfaces.
- Mobile preserves the question, instrument, selection and action above decorative context.
- Dense data appears only where it improves a decision; whitespace is not a substitute for state.

### 9.5 Motion and feedback

- Ambient motion communicates that an event is live, but does not fabricate real-time data.
- Choice produces immediate local feedback without implying acceptance.
- Signing has a quiet, cancellable holding state.
- Acceptance creates the Card.
- Reveal motion is family-specific and begins only after canonical result truth.
- Correctness, score and Streak are separate beats so cause and consequence remain readable.
- Reduced motion replaces travel/flip with opacity, scale or discrete state swaps.

## 10. AI Guide

The AI feature is an **Event Guide/commentator**, not a generic floating chatbot and never an
autonomous picker.

It may:

- explain this exact event in plain language;
- define an outcome band or terminal rule;
- summarize verified historical outcomes with dates;
- explain lock, source, proof and Streak consequences;
- answer “what should I look at?” using real event context;
- prepare an unsigned draft that the Player reviews in the canonical composer.

It must not:

- choose an outcome for the Player;
- claim probabilities the product does not have;
- sign, submit, publish or spend points;
- invent live data, Players, odds, events or provider availability;
- block browsing, Picking, Card access or proof review when unavailable.

The Guide opens from the current Event/Card context, preserves it on close, and uses the one-overlay
handoff contract. No-provider, loading, refusal, stale-context and retry states are visible.

## 11. State and recovery contract

Every relevant surface must distinguish:

- signed out;
- identity loading;
- first run;
- returning and resume owed;
- loading;
- empty;
- thin catalogue;
- stale source/index;
- source unavailable;
- event upcoming/open/locking/locked;
- Pick drafting/signing/accepted/refused/retryable/confirmation unknown;
- Card private/publishing/public/share failed/unlisted;
- awaiting source/attesting/proved/scoring/reveal ready;
- correct/incorrect/voided/stuck;
- day provisional/final;
- Streak extended/broken/unchanged;
- game live/loading/not connected/not implemented/blocked;
- overlay open/closing/focus restored;
- Guide ready/loading/no provider/refusal/retry.

Critical status stays next to the affected object. Toasts are supplementary. Confirmation-unknown
retains its request id or transaction hash and a safe recheck action. Refusals and retryable errors
retain the exact event, outcome and points draft.

## 12. Reference transfer ledger

| Reference | Transfer | Do not transfer |
|---|---|---|
| Yosuku | authored editorial clarity, action proximity, personal artifact, share/public recipient flow | its market presentation as a universal template; code/assets without license |
| PIPS | dedicated play object, single primary action, player/streak visibility, settings, tactile feedback, onboarding rhythm | handheld-console shell, brand, illustrations, code/assets |
| Flicky | deck cadence, decisive gesture, active-match resume, waiting ritual, reveal, rematch/share | pixel aesthetic, binary-only assumptions, real-money/stake implications, code/assets |
| Masayume | Games/mode grouping, honest readiness, Player identity/history/achievements, resume | decorative not-connected tiles as shipped functionality; code/assets |
| ZK Freighter | first-run, return to intent, async progress, failure and recovery states | its product domain or visual identity |

Reference fidelity means reconstructing complete behavior in Proof League's domain. It does not mean
sampling colors or copying components.

## 13. Implementation sequence

### Gate 0: stop and classify the current work

Before extending the current UI, classify each dirty implementation change as:

- **salvageable infrastructure:** canonical data, state model, error contract, route registry,
  composer logic, lifecycle mapping;
- **needs reshaping:** components that contain useful data but assume the rejected hierarchy;
- **discarded presentation:** generic option rows, probability-looking bars, black dashboard shell,
  proof-first ticker, generic 4:5 receipt and universal Market Card composition.

Preserve user work. Do not reset or delete blindly. Reuse behavior deliberately, not visuals by
inertia.

### Gate 1: event presentation model

Create one typed presentation grammar that derives from canonical Market/Series truth and supports
family-specific stages. It must not fork signing, availability, settlement or scoring.

Acceptance:

- no fake event data;
- family, timing, choices, source and readiness have explicit types;
- a missing family renderer fails honestly;
- crowd Pick distribution is labelled and secondary;
- an event can render without proof internals.

### Gate 2: Lido Yield Signal vertical slice

Build the one current recurring Event end to end:

```text
Event tile -> Yield Signal Stage -> select band -> points -> auth/sign -> accepted Card
-> waiting states -> proof-confirmed result -> reveal -> score/day/Streak -> share/proof
```

Do not build a broad grid before this one Event feels complete at 390x844 and 1440x1000.

### Gate 3: Your Card system

Complete stable identity, private-by-default publication, evolving lifecycle, social export,
recipient route, share failure and proof context. The Card must retain the Yield Signal's identity;
it cannot become a generic receipt at settlement.

### Gate 4: Event Board and shell

Build the honest schedule, Play resume rules, Events catalogue, League/Record shell and complete
mobile More drawer from one registry. Empty/thin/source-unavailable states must be useful.

### Gate 5: Block Draw

Prove the family system with a real admitted Hosted Round. A missing current round renders its next
gate, not a fake draw.

### Gate 6: future family design proof

Prototype Pool Race plus one Governance or Milestone Stage with labelled fixture data in a
non-production design/test environment. Do not show these in live navigation until admission and
canonical data exist. This gate proves the visual grammar can express more than bands.

### Gate 7: ways to play

Connect Daily Deck, Practice, Challenge and Lucky Draw only through the canonical Event/Pick/Card
path. Keep Duel blocked until its integrity model exists.

### Gate 8: secondary and complete fidelity

Finish Guide, Settings, Activity, alerts, social/publication, accessibility, responsive behavior,
all states and compatible Exact/Adapted/Additive rows from the full UX inventory. Reclassify any old
row whose “Market Card” wording conflicts with the ontology in this document.

## 14. Acceptance gates

The rebaseline is not accepted because routes compile or because the surface looks polished.

### Comprehension

- A first-time person can say what event they are predicting, which outcomes exist and when it
  resolves before seeing a chain key or hash.
- No Pick-distribution percentage looks like an order-book probability.
- The Lido event is recognizable as a yield signal without reading its category label.
- The Block Draw and Pool Race prototypes are visually distinct from the Yield Signal and each
  other without becoming separate products.

### Action

- One dominant action advances the current task.
- Choosing an outcome changes the actual event instrument.
- Authentication happens at the authority boundary and restores the exact draft.
- Acceptance visibly creates Your Card.

### Anticipation and consequence

- Waiting has honest, meaningful stages and a stable return route.
- A newly settled Card has a one-time reveal with skip/replay-safe behavior.
- Score, day finalization and Streak effects occur in the correct order from canonical truth.
- Correct, incorrect, voided and stuck Cards remain equally legible in Record.

### Fidelity and micro-UX

- Header, bottom navigation, complete More drawer, menus, popups, onboarding, Guide and settings have
  specified open/close/focus/return behavior.
- Only one blocking overlay owns focus and scroll.
- Sound, haptics and motion honor Player/system settings and have semantic non-motion equivalents.
- 1440x1000, 1024x768, 390x844 and 360x800 retain the question, event instrument and action without
  horizontal overflow.
- If both themes ship, every family, Card and state is verified in both themes.

### Truth

- Every live Event is registered/admitted and queryable.
- No planned family, Player, opponent, rank, achievement, probability, result or proof is fabricated.
- Proof opens from and returns to the exact Event/Card.
- Chain state remains the truth writer; the worker remains the sole transaction submitter and
  class-1 projection writer; web retains its authorized Pick-intake boundary.

## 15. Non-goals and prohibited shortcuts

- Do not repair the rejected direction with more decorative icons, gradients or animation.
- Do not create one universal “market card” with themed backgrounds.
- Do not call crowd Pick percentages odds, chance, probability or price.
- Do not make proof telemetry the persistent hero.
- Do not turn future event-family examples into fake live inventory.
- Do not copy reference code or assets.
- Do not create or recreate `AGENTS.md`, `AGENT.md`, `CLAUDE.md` or `CLOUD.md` instruction files in
  this repository.
- Do not deploy, publish, submit, provision, fund, transact, commit or push without separate explicit
  owner authority.

## 16. Primary capability evidence

These sources establish capability and event semantics; they do not make a candidate family live in
Proof League by themselves.

- [Gluwa USC SDK end-to-end proof example](https://github.com/gluwa/cc-next-query-builder/blob/main/examples/end-to-end.ts)
  for the source-query-to-Creditcoin verification path.
- [Lido contract documentation](https://docs.lido.fi/contracts/lido/) for the current Ethereum
  staking/report event domain.
- [Uniswap v4 core](https://github.com/Uniswap/v4-core/) for candidate pool-event semantics.
- [Aave Governance v3](https://github.com/aave-dao/aave-governance-v3) for candidate governance
  proposal/voting semantics.

Runtime admission still requires Proof League contract/config/decoder evidence and a fresh chain
read. An official upstream event is not automatically a safe prediction Market.

## 17. Handoff evidence required from an implementation agent

At the end of each slice report:

- branch, HEAD and dirty-state preservation;
- files changed and why;
- runtime-confirmed behavior versus static inspection and inference;
- exact real events/Markets used;
- screenshots at desktop and mobile for entry, choice, accepted Card, waiting and result states;
- error/recovery and reduced-motion behavior checked;
- any blocked dependency with owner, evidence and next gate;
- which rejected presentation was removed, reshaped or intentionally retained and why;
- no claim of catalogue breadth beyond registered truth.

The completion question is not “does it look more gamified?” It is:

> Can a Player feel what is happening, make a meaningful Call, own the anticipation, experience the
> proven consequence and immediately want to play the next real event?
