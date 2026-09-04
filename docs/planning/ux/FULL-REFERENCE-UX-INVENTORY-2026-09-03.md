---
title: "Proof League Full Reference UX Inventory"
status: authoritative_companion_with_2026_09_04_reclassification
created: 2026-09-03
task_boundary: documentation and implementation acceptance; no live action
parent_decision: "./LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md"
implementation_handoff: "../../../FIDELITY-IMPLEMENTATION-HANDOFF.md"
---

# Proof League Full Reference UX Inventory

> **2026-09-04 reclassification:** The complete microflows and state coverage in this inventory
> remain mandatory. `LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md` wins on product objects,
> navigation labels, event-family interaction and visual direction. Read every “Market Card” below
> as an **Event tile/poster** leading to an **Event Stage**. The only user-facing Card is the
> Player-owned artifact created after an accepted Pick. The old editorial palette and one-template
> Market composition are no longer Exact fidelity requirements.

## 0. Why this document exists

The game-first rebaseline fixes the product hierarchy. This companion prevents the implementation
from preserving only the large screens while losing the small behaviors that make the product
understandable and satisfying.

Everything in this inventory must receive one explicit disposition:

- **Exact**: preserve the reference behavior closely because it fits Proof League.
- **Adapted**: preserve the user need and interaction, but use Proof League's free-points,
  proof-settled domain.
- **Additive**: required by Proof League even when a reference does not contain it.
- **Blocked**: desired or materially relevant, but missing a product, authority or dependency
  decision. Keep the dependency visible.
- **Excluded**: incompatible with a settled Proof League boundary. Record the reason.

“Later”, “small”, “hard”, “not in the first slice” and “the reference had more time” are not
classifications. Sequencing may defer a row, but cannot erase it. When a dependency is missing,
the product must show an honest unavailable state or omit the entry until discovery is useful; it
must never present fixture success as live capability.

This document inventories behavior. It is not permission to copy reference code, illustrations,
logos, audio or other assets.

## 1. Evidence and authority

### 1.1 Evidence inspected

| Source | Reviewed snapshot | What was inspected | Authority in Proof League |
|---|---|---|---|
| Proof League | `1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89` before this documentation change | Current routes, shell, Market detail, Market receipt, registration and chain support docs | Current gap and implementation truth |
| Yosuku | `b499afdb16a465e2c6c3cb3990218997d98346ab` | Header/mobile nav, tutorial, confirmation, pending/share Cards, Markets, Room, Record/portfolio, League | Editorial product hierarchy, Card/share and compact flow behavior |
| PIPS | `fe8f6963972ca18fc9db0fd9ee4db389e6293ee8` | Games hub, Range/Lucky/Moonshot, player/streak/balance frame, onboarding, skin, settings, history and achievements | Dedicated play instrument, one primary action, persistent player feedback and tactile settings; behavior only |
| Flicky | `56054baeb0c7f8ef6e039ebb0eed2b04e4f59388` | Practice/PvP deck, queue, swipe, lockup/wait, result, share, active-match resume and profile | Deck cadence, decisive gesture, waiting ritual, result reveal and share; behavior only |
| Somnia/Masayume | `5e57877d0d89992903d77f89bba14951f7152e8b` when rechecked on 2026-09-04 | Live desktop/mobile Games, header menus, More drawer, settings sheet, Sensei, call composer, and corresponding source/architecture | Games hierarchy, truthful readiness, player meta-state, settings and assistant behavior |
| ZK Freighter | `5ddf72483e1383defcbc0a17fd9dba58c5e0f0f4` | Onboarding, Activity, Settings, recovery and long-running state models | First-run, return-to-intent, durable operations and recovery discipline |
| Existing Proof League fidelity corpus | Current repository copies | PRD revision, reference design, product flows, 52-story epic catalogue and prior parity ledgers | Compatible complete-product scope |

The Somnia/Masayume repository is active. At final documentation validation it contained
user-owned modifications under `services/ops/` and untracked prompt/spike files in addition to the
reviewed commit. The implementation owner must not clean or overwrite them, must re-check the
current commit/working tree, and must classify any newer behavior rather than treating this
snapshot as timeless.

### 1.2 Runtime observations versus source observations

Runtime-inspected on the reviewed Somnia/Masayume build:

- desktop Games hub, grouped mode cards, live/unavailable/dependency states and player/history
  sections;
- desktop Games, Build and Explore menus;
- 390 by 844 mobile header, five-item bottom bar and scrollable “Everything in Masayume” drawer;
- Game settings sheet with sound, haptics, motion and accent controls;
- Sensei entry, contextual drawer, pinned Market meter, starter prompts and no-provider failure;
- the action composer with timing, tutorial cue, inputs and explicit disabled reason;
- a stacked-dialog defect where Sensei and the action composer could coexist.

Source-inspected in the references:

- typed shared navigation registries and menu close rules;
- versioned tutorial/onboarding persistence;
- Card export/share fallbacks;
- Game hub/session/readiness architecture;
- Sensei provider, response and action-card guards;
- Activity, Settings and recovery state models.

The stacked-dialog behavior is evidence of a reference defect and is explicitly rejected below.

## 2. Product-wide experience laws

1. The next human decision is visually dominant. Infrastructure explains and confirms it.
2. Every Pick uses one canonical composer and one authority path, regardless of entry surface.
3. Every accepted Pick creates one personal Card immediately. The Card evolves; it is not replaced.
4. Streak, rank, points and result appear only from canonical chain/projection truth.
5. Games organize admitted Markets. A mode cannot invent a second outcome or scoring plane.
6. AI may explain or prepare a draft. It cannot become an alternative signer or truth source.
7. One blocking overlay is active at a time. Cross-surface handoff closes the origin first.
8. Critical status remains in context. Toasts may echo but never own refusal, pending, unknown,
   proof or recovery state.
9. Mobile exposes every production job. Desktop-only navigation is not acceptable.
10. Signed-out and dependency-unavailable states still explain the product and the exact next step.
11. No fake Player, opponent, result, score, Streak, rank, achievement, history, probability or
    provider availability.
12. Reduced motion, keyboard access, focus management and clear state copy are product behavior,
    not polish.

## 3. Global shell, header and navigation

### 3.1 Shared route registry

Use one typed route registry to derive desktop navigation, mobile bottom navigation, mobile More,
active-state logic, labels, icons and descriptions. Do not maintain separate lists that drift.

Primary product jobs after the live-event rebaseline:

```text
Play | Events | League | Record
```

Secondary jobs stay reachable through contextual actions and a complete More/account surface:

- Daily Deck/Reels and Practice entry;
- Create Challenge;
- Social/Takes and alerts;
- Combo;
- Playbooks and Agents;
- Pick from X;
- Player Edge;
- Proof Surface and Transparency;
- Activity;
- Settings;
- How proof works, system status and documentation;
- creator/operator surfaces when the viewer has the required role.

### 3.2 Desktop header

Required anatomy:

- recognizable Proof League mark and home action;
- primary job links with unmistakable current-route state;
- grouped overflow menus when the complete route set cannot fit;
- optional operational/ticker strip only when its content is real and useful;
- theme control;
- signed-out Connect action or compact signed-in Player identity;
- current Streak/provisional signal near the Player identity when loaded;
- account menu for Activity, Settings, public profile, session and sign-out.

Interaction rules:

- one click opens a menu; a second click closes it;
- selecting a route closes the menu;
- outside click, Escape and breakpoint change close it;
- focus moves into the open menu and returns to the trigger on close;
- the current route is conveyed beyond color;
- long labels and translated copy do not collide with account actions;
- loading identity reserves stable geometry; unknown Player data does not render as zero;
- no hover-only destination or action.

### 3.3 Mobile shell

Required anatomy:

- compact top bar with mark, contextual title/status and account entry;
- safe-area-aware persistent bottom navigation for the four primary jobs: Play, Events, League and
  Record;
- complete, scrollable More drawer for every production route not in the bottom bar;
- close control and visible current-route state in the drawer;
- content padding that prevents the bottom bar from covering actions or receipts.

Mobile rules:

- More must be complete, not a shortened marketing list;
- drawers scroll independently and account for device safe areas;
- opening the keyboard keeps the active input and submit state visible;
- deep links retain a usable Back destination even without browser history;
- orientation and breakpoint changes close or re-layout open menus without leaving a scrim;
- no horizontal page overflow at 360 pixels;
- the primary Pick action must not hide underneath the bottom bar.

### 3.4 Install and return affordances

- Install/PWA promotion is dismissible, does not displace the primary action and respects prior
  dismissal.
- Show install only when supported and useful; explain the benefit in product terms.
- Return-to-active-Pick, awaiting Card or resumable Game outranks a generic promotion.
- Update/offline banners use real service-worker or connectivity state and provide a safe action.

## 4. First run, authentication and return to intent

### 4.1 Entry rules

- Public browsing of Landing, Markets, Market detail, League, public Cards, public Players and
  proof explanation does not require authentication.
- Ask for authentication at the first authority-requiring action: confirm Pick, publish/post,
  create Challenge, follow/alert, or manage an account-bound feature.
- Preserve the exact originating route, Market, selected outcome, points draft and intended action.
- After authentication, return to that intent rather than a generic dashboard.

### 4.2 First-run primer

The primer is versioned and locally remembered, short, skippable and resumable. Recommended
sequence:

1. **Call real events**: show one real question and its ordinary-language choices.
2. **Use free points**: explain allowance, lock time and that there is no money or leverage.
3. **Build your Card and Streak**: show Open Call becoming a Settled Record.
4. **Proof is the referee**: explain source event and Creditcoin in one plain-language panel.
5. **Choose appearance, then play**: select theme/system behavior and continue to the preserved
   Market or Games intent.

Primer controls and states:

- progress label and dots;
- next/back, Skip and close;
- Escape and backdrop behavior that does not lose intent;
- focus trap, meaningful initial focus and trigger-focus restoration;
- reduced-motion transition;
- final Connect/continue action;
- if Connect is required, keep the primer/draft context until connection succeeds or the Player
  explicitly cancels;
- provider unavailable, rejected and retryable authentication states remain inside the flow.

Explicit exclusions from ZK Freighter adaptation:

- seed phrases, private-key import, password vault creation and funding steps;
- network selection as onboarding ceremony;
- automatic faucet or financial balance provisioning.

### 4.3 Returning Player

Priority order on return:

1. confirmation-unknown or failed operation needing recovery;
2. accepted Pick/Card whose state changed;
3. resumable active Game/session;
4. exact saved draft whose Market is still open;
5. current Daily Deck/next playable Market;
6. general Games hub.

If a draft expired while away, keep the question and previous choice visible, explain that the
lock passed, and offer the next real Market. Never silently clear it or submit it elsewhere.

## 5. Overlay, drawer and popup coordination

### 5.1 One-overlay law

Only one blocking overlay may own focus, keyboard and scroll lock. This applies to:

- navigation drawer;
- first-run primer;
- account/connect flow;
- canonical points composer/review;
- Game settings;
- League Guide/Sensei;
- share sheet;
- proof receipt;
- destructive confirmation.

The inspected Somnia/Masayume runtime could show Sensei and its action composer together. Do not
copy that defect.

### 5.2 Handoff contract

When one overlay launches another:

1. validate and save the outgoing context;
2. close the origin and complete its exit/focus cleanup;
3. open the destination with the typed context;
4. focus the destination heading or first required field;
5. Cancel/Back restores the source context and sensible trigger.

Example: Guide suggestion -> close Guide -> open canonical points composer with Market and outcome
prefilled -> Player reviews points and signs -> return to the new Card. The Guide never signs.

### 5.3 Universal overlay behavior

- labeled title and purpose;
- visible close action;
- Escape unless a non-cancelable signing handoff is actively controlled by the provider;
- backdrop close only when it cannot destroy an unrecoverable action;
- focus trap and return;
- body scroll lock without layout shift;
- state persists through rotation/breakpoint changes;
- reduced-motion open/close;
- no nested scrims, duplicate close controls or stacked dialogs;
- errors render beside the relevant control and remain after animation ends.

## 6. Landing and public comprehension

The first public screen must prove there is a real product without making proof the hero.

Required sequence:

1. one-sentence product definition;
2. a real open or recently settled Market with actual state;
3. “Choose, commit free points, receive your Card” explanation;
4. a real personal Card lifecycle example only when backed by real data;
5. Streak/League reason to return;
6. playable Games modes and exact unavailable states;
7. short “results are verified” explanation with a route to details;
8. clear entry to Games and Markets.

States:

- open inventory available;
- only locked/awaiting Markets;
- only settled evidence;
- catalogue empty;
- stale/read failure with last-confirmed timestamp and retry;
- signed-in continuation to own changed state.

Do not show fabricated activity, broad multi-chain claims or proof-terminal walls to simulate depth.

## 7. Events, Stages and canonical Pick flow

### 7.1 Event Board

Each Event tile/poster answers:

- what is being predicted;
- source event and source chain in plain language;
- available outcomes appropriate to the event family;
- absolute lock time plus a live relative countdown;
- open/locked/awaiting/settled/voided/stuck state;
- the event-family interaction preview: signal, draw, race, milestone, governance, allocation or
  network pulse;
- real Pick distribution only as clearly labelled secondary crowd context, normally after the
  Player commits; it must never resemble odds, probability or price;
- the signed-in Player's own Pick/Card state when one exists;
- the next valid action.

Board groupings may include Featured, Today, Upcoming, Awaiting and Settled when backed by real
data. Filters preserve URL state and announce result count. Empty states distinguish “no Markets
match this filter” from “the catalogue has no admitted Markets”.

An Event tile is not a collectible Card. Different event families share a design grammar but do
not collapse into one question-plus-percentage-row template.

### 7.2 Event Stage reading order

1. question, source name/chain, state and absolute lock;
2. family-specific prediction instrument and choice set;
3. selected outcome and canonical points action;
4. accepted personal Card or current own state;
5. Play/Deck/Streak context and secondary crowd Calls where appropriate;
6. plain “Why verified?” explanation;
7. proof lifecycle and technical receipt on request;
8. Room, Challenge and related real Events.

Technical identifiers never precede the question, choices and action.

### 7.3 Canonical points composer

Required content:

- Market question and trading/open state;
- selected outcome with a clear change action;
- points input, allowed range and presets where useful;
- remaining daily allowance from real data;
- deterministic possible score/points explanation;
- absolute lock and expected settlement window;
- statement that committed points are the maximum points at risk, not money;
- review summary before signing;
- exactly what the signature authorizes;
- Connect/sign button or a precise disabled reason.

States:

```text
idle -> editing -> reviewing -> authenticating -> signing -> submitting
  -> accepted | refused | retryable failure | confirmation unknown
```

Rules:

- retain the complete draft through auth, rejection, retry and unknown confirmation;
- revalidate allowance, Market state and cutoff immediately before signing/submission;
- never optimistically create a settled result or score;
- accepted state creates the Card in the action slot, not merely a toast;
- if the Market locks mid-flow, show the exact lock and preserve a readable expired draft;
- unknown confirmation exposes the durable operation id/hash and a safe Activity route;
- a duplicate/retry is idempotent.

Explicitly exclude Yosuku/Masayume financial mechanics: wallet payment source, stake currency,
leverage, tap-trading, cash-out, odds or money-return language.

## 8. Personal Cards and sharing

### 8.1 One evolving Card

The same record moves through:

```text
accepted/private
  -> optionally published Open Call
  -> locked
  -> committed
  -> awaiting attestation
  -> proof verified/scoring pending
  -> correct | incorrect | voided | stuck
  -> Streak effect after day finalization
```

The private/public URL relationship, ids and state transition must remain stable. Do not create
unrelated “pending” and “settled” records that lose identity.

### 8.2 Card front and result content

Always:

- Proof League mark and stable serial/public id;
- Player identity;
- question and event-family composition;
- chosen outcome;
- committed points;
- created time and lock;
- ordinary-language source and chain;
- current lifecycle state;
- exact Market backlink.

When canonically known:

- decoded outcome and winning option;
- correct/incorrect/voided/stuck treatment;
- points/score effect;
- finalized Streak and rank effect;
- proof transaction and receipt link.

### 8.3 Visual and export behavior

- 4:5 social-first Card, export at 1200 by 1500;
- 1200 by 630 OG companion for the same public URL;
- pending/Open state is anticipatory but never colored as a win;
- correct uses earned green after proof/scoring;
- incorrect uses ash with equal dignity and detail;
- voided/stuck remain collectible records and explain points/Streak effects;
- event-specific layout varies semantically without losing shared identity grammar;
- live pending time/progress uses real timestamps and pauses when the page is hidden;
- reduced motion removes draining/flip/celebration animation without hiding state.

### 8.4 Publication and share flow

1. accepted Card is private;
2. Player chooses Publish Open Call and previews what becomes public;
3. explicit confirmation creates/updates the stable public route;
4. share tries native file/Web Share when supported;
5. fall back to PNG download;
6. offer copy link and X intent;
7. popup blockers, export failure and share cancellation leave retryable in-context state.

Never automatically publish a Pick. Never imply a shared Call transferred signing authority. “Make
my own Pick” opens the same Market and prefilled context, then requires fresh review/signing.

## 9. Ways-to-play system

### 9.1 Play hub

Required hierarchy:

1. active/resumable session or changed result;
2. Player identity, current Streak and points/record summary;
3. the strongest real live Event plus playable modes with truthful readiness;
4. upcoming/blocked modes with named dependencies only when useful;
5. achievements and history from real records;
6. Game settings.

Every mode entry declares one of:

- loading;
- live and ready;
- live but signed out;
- temporarily unavailable because a named service/chain is unavailable;
- waiting for a real eligible Market/round;
- implementation-blocked with the missing gate;
- completed/replayable when that behavior exists.

“Coming soon” without a dependency or intended behavior is insufficient. A mode entry is not proof
of a playable experience; its family-specific Event Stage must exist and use real admitted data.

### 9.2 Shared Play frame

Every Game mode has:

- Back to Play;
- mode name and whether it changes points/Streak/rank;
- settings entry;
- Market/Card context;
- progress and current phase;
- safe leave/return behavior;
- resume when a real active session exists;
- result, share/replay/next action;
- keyboard and touch controls where interaction differs from ordinary forms.

For modes using multiple Markets, lock/settlement remains per canonical Market. A client session
may track sequence progress but cannot rewrite Market truth.

### 9.3 Practice — Adapted

Purpose: teach question, choice, timing and Card/result interpretation without using allowance or
changing records.

Use a short deck of already-settled admitted Markets. The Player chooses what they would have
called, then reveals the recorded result and proof explanation. Label it historical practice.

Practice does not:

- submit a Pick;
- use points;
- affect Streak, rank, League or achievements that imply prediction skill;
- fabricate a live opponent;
- use synthetic outcomes presented as real history.

Flow: tour -> 3 to 5 historical Cards -> choose -> reveal real archived result -> explanation ->
practice score labeled local/non-recorded -> replay or enter a live Market.

### 9.4 Daily Deck — Adapted

Daily Deck is the game framing of Reels:

- one real eligible Market at a time;
- finite cursor and visible remaining count;
- skip/previous/next without losing accepted Picks;
- canonical composer rather than inline alternate signing;
- Card appears after acceptance;
- no infinite fake feed;
- end state summarizes real Picks and points used, then routes to Record or Games;
- empty state explains when the next admitted Market is expected, if known.

### 9.5 Market Play — Exact domain surface

Market Play routes to question-first Markets. Games may provide category/deck framing, but Market
Cards, composer, Pick, outcome and score stay canonical.

### 9.6 Lucky Hosted Round — Adapted

Available only when an actual admitted future-block Hosted Round exists. It must say that the mode
is chance, identify the source network and block window, disclose the free-points effect, use the
canonical composer and resolve through the same proof/Card pipeline. If there is no live round,
show the exact dependency rather than a simulated draw.

### 9.7 Challenge — Adapted, dependency-gated

Challenge is a social wrapper around one existing admitted Market:

- choose a real Market;
- set presentation/invite context, never outcome rules;
- preview and explicitly publish the invitation;
- recipient sees challenger, question, lock and public Call where permitted;
- recipient reviews and signs an independent Pick;
- both Cards settle from the same canonical outcome;
- comparison appears only when both records are available;
- expired, declined, one-sided, voided and stuck states remain legible.

### 9.8 Duel — Blocked

A real head-to-head mode needs decisions for session authority, matchmaking, simultaneous/hidden
choice expectations, scoring, no-show, cancellation, reconnect, partial completion, rematch and
history. Independent Picks plus presentation-only comparison may not be mislabeled as real-time
Duel. Do not advertise it as live until these rules and the required data authority are approved.

### 9.9 Non-event arcade — Blocked owner decision

Masayume's arcade modes are score-only, off-chain games. That conflicts with the currently approved
rule that Proof League Games reuse admitted, verified event Markets. Inventory them; do not silently
ship or delete the concept.

Before inclusion, Abu must choose whether arcade is:

- outside Proof League;
- a clearly separated local practice/brand surface with no points, Streak, rank or League effect;
- or part of a broader Games definition with a newly documented authority and integrity model.

Until then, no arcade route, nav promise, fake leaderboard or off-chain score may affect the
prediction record.

### 9.10 Every named Masayume game mapped

| Masayume mode | Reference meaning | Proof League mapping | Classification and gate |
|---|---|---|---|
| Practice | no-stake swipe tutorial | short historical deck of settled admitted Markets | Adapted; no points, Streak, rank or canonical Pick |
| Duel | matched swipe/pick session | true head-to-head over the same admitted Market set | Blocked on authority, matchmaking, reveal/no-show, scoring and recovery decisions |
| Lucky | seeded eligible market draw followed by a real order | clearly labeled chance call on an admitted future-block Hosted Round | Adapted; live only when a real Hosted Round exists; no order-book semantics |
| Range | house-priced band position | ordered band call using the existing Lido five-band Market and canonical composer | Adapted presentation; no reserve, house quote, leverage, payout or second contract path |
| Moonshot | house-priced direction/reach | milestone/threshold event Card and mode | Blocked until a real milestone Series is admitted and decoder-compatible; no “moonshot return” promise |
| Line Rider | off-chain score arcade | unresolved non-event arcade concept | Blocked owner decision; no League effect |
| Candle Hop | off-chain score arcade | unresolved non-event arcade concept | Blocked owner decision; no League effect |

The reference's current catalogue distinguishes “code exists” from “playable against a deployed
dependency”. Preserve that honesty. Its current `Range` implementation is not authority to copy
financial reserve mechanics, and a newer reference commit does not automatically make a Proof
League mapping approved.

### 9.11 Game settings — Adapted

Settings apply immediately, persist on the device and require no signature or server write:

- **Sound**: on/off with a statement of what produces sound; default conservative/off until the
  Player opts in.
- **Haptics**: on/off only when browser/device support exists; unsupported is explained.
- **Motion**: Follow system, Full, Reduced. An explicit Player choice overrides system preference.
- **Accent**: Address-derived default plus approved restrained alternatives; never alters semantic
  state colors.

The sheet includes Done/Close, Escape, focus management and “nothing here is signed or sent” copy.
All Game components consume one settings model so motion/sound do not drift between modes.

### 9.12 Achievements, history and resume — Adapted

- Achievement definitions are deterministic, versioned and computed from real records.
- Loading/unrecorded is not an empty achievement case.
- History distinguishes practice, accepted Picks, Challenges and future approved sessions.
- An active session or interrupted canonical Pick can be resumed from Games and the account shell.
- Resume restores exact progress but revalidates every Market before a new signature.
- Never mint a fake first achievement to fill the page.

## 10. League Guide / AI experience

### 10.1 Role and boundary

The League Guide is optional, grounded assistance beside real product context. It may:

- explain a Market, source, outcomes, lock and proof in ordinary language;
- summarize the Player's own canonical record;
- compare eligible real Markets;
- prepare an unsigned draft for the canonical composer;
- refuse requests outside known data or authority.

It may not:

- invent live data, probabilities, results or a personal edge;
- sign, submit or publish;
- create a second action composer;
- imply financial advice or guaranteed outcomes;
- block core Markets, Games, Cards or proof use when no AI provider exists.

### 10.2 Entry and invitation

- A restrained dock/mark shows the nearest relevant real Market timing when available.
- Teaser invitations are capped, suppressed when the Guide is open, and disabled/reduced under the
  appropriate motion setting.
- The mark and copy identify it as the Guide, not an unlabeled decorative mascot.
- Entry may accept typed route context such as current Market/Card/Game, then consume that trigger
  without polluting future navigation.

### 10.3 Guide drawer

Required content:

- title, close and clear assistant identity;
- pinned context meter showing real Market, timing and lifecycle;
- short explanation of what the Guide can and cannot do;
- first-turn starter prompts relevant to the current context;
- conversation history, loading state and persistent failures;
- grounded follow-up prompts only after a valid response;
- input, submit and keyboard behavior;
- action cards only when a genuine, non-failure response maps to a real eligible Market/action.

An action card closes the Guide and hands a typed unsigned draft to the canonical composer. The
Player sees Market, choice and points and must review/sign normally.

### 10.4 AI states and failure copy

- loading context;
- context ready;
- server/provider not configured;
- rate limited;
- invalid prompt/input;
- upstream unavailable;
- stale context;
- response grounded but no valid action;
- valid action handoff;
- refusal for unsupported or authority-seeking request.

No-provider is a useful read-only shell with a direct explanation, not a dead sparkle button.
Errors persist in the conversation with retry or normal-product exits; a toast is insufficient.
Credentials remain server-side and are never exposed in client output or docs.

### 10.5 Accessibility and responsive behavior

- desktop side drawer and mobile bottom/full-height sheet use the same conversation state;
- screen readers receive response/loading updates without reading animated text character by
  character;
- typewriter effects have an instant reduced-motion path;
- Escape/backdrop/close obey the overlay law;
- focus does not jump to the composer until the Guide has closed;
- the mobile keyboard does not cover input or action cards.

## 11. League, Record, profile and progression

### 11.1 Record

Record is the complete personal history, not only wins.

- summary: points/score, current and best Streak, rank and provisional state;
- segmented or filtered open/awaiting/settled/voided/stuck operations;
- every accepted personal Card, including incorrect results;
- pending/unknown operations with Activity linkage;
- day-by-day Streak contribution;
- empty signed-in state routes to a real Market/Game;
- signed-out state explains the value before Connect;
- stale/failed reads preserve last-confirmed data and timestamp.

### 11.2 League

- real ranking only;
- clear season/ranking basis and deterministic tie-break explanation;
- loading, empty, fewer-than-podium and full-table states;
- top treatment never fabricates three players;
- sticky/visible connected-Player row or explicit unranked state;
- address-derived identicon or approved Player image;
- link to public Player record;
- updated/provisional markers when relevant.

### 11.3 Public Player

- chain-derived identity, rank, Streak and published Card history;
- incorrect and voided published Cards remain visible;
- privacy boundary is explicit for unpublished Cards;
- own-profile shortcuts appear only for the owner;
- Challenge/copy context does not bypass fresh signing.

### 11.4 Streak feedback

- compact shell signal;
- Games next-action context;
- Card result effect after canonical day finalization;
- Record day-by-day explanation;
- League comparison.

Feedback may use restrained count-up, border/accent transition, sound or haptic only after canonical
truth and only under the Player's settings. Stuck Markets make the day provisional. Voids follow
the approved pause semantics. Never celebrate on proof verification while scoring/day finalization
is still pending.

## 12. Social, Room, Takes and alerts

### 12.1 Market Room

- public reading attached to the exact Market;
- loading, empty, error and locally unavailable states;
- Room failure is isolated so the Market and composer still work;
- signed-in eligibility is explicit before posting;
- only a Player with the required signed Pick may post when that rule applies;
- posts are structured/validated, rate-limited and reportable;
- visible disclaimer: Room content is off-chain and cannot change the result;
- lock/settlement transitions update Room actions without losing readable history.

### 12.2 Takes and Calls feed

- every Take/Open Call links to a real Market and real public author;
- distinguish opinion, Pick-backed Call and settled result;
- filters retain URL state;
- signed publication and explicit privacy;
- feed failure does not affect Market truth;
- no engagement counts unless real;
- recipient action always returns to canonical Market review/signing.

### 12.3 Alerts

- opt-in per lifecycle event or followed Market/Player;
- state what channel, trigger and frequency the Player authorized;
- provide unsubscribe/revoke where the alert is shown;
- deduplicate retries and do not alert a final result before canonical scoring state;
- notification permission denial leaves an in-product alternative;
- no dark-pattern urgency.

## 13. Activity, Settings and recovery

### 13.1 Activity

Activity is a durable operation timeline, not a transient notification list.

- filters: All, Pending, Confirmed and Failed/Blocked;
- operation type, affected Market/Card, created/updated time and durable id/hash;
- states: drafting, signing, submitted, confirmation unknown, accepted, committed, proof pending,
  verified, scored, failed, blocked and recovered as applicable;
- last known stage remains visible when later reads fail;
- each error maps to the stage actually reached;
- exact retry/inspect/return action;
- empty state per filter;
- syncing/stale/offline indicators without replacing confirmed history.

### 13.2 Settings

- theme: system/light/dark with flash-free startup and immediate mounted-primitive updates;
- Game sound, haptics, motion and accent settings;
- session/account state and safe sign-out;
- public profile/publication defaults where approved;
- alert permissions and revocation;
- provider/support state;
- local cache reset that clearly names what is removed and preserves canonical history;
- install status and supported recovery actions.

Do not expose seed/private-key controls owned by Privy. Do not claim that clearing a local cache
deletes chain or published history.

### 13.3 Recovery

- authentication refusal returns to the preserved intent;
- provider/network mismatch says what is wrong and what action is safe;
- retryable API failure retains the draft and idempotency key;
- confirmation unknown routes to durable Activity rather than encouraging a duplicate;
- stale projections show last-confirmed time and allow refresh;
- Card/publication/share failures are separable: an accepted Pick remains accepted even if image
  export or publication fails;
- offline mode never presents cached Market state as newly actionable.

## 14. Extended product surfaces that remain in scope

The game-first decision changes hierarchy; it does not delete the complete product backlog.

### 14.1 Player Edge — Adapted

Explain the Player's complete canonical record with sample size, event-family splits, misses, voids,
time range and data provenance. No AI-generated confidence or “edge” claim may outrun the sample.
Every insight links back to underlying Cards.

### 14.2 Combo Picks — Adapted, architecture-gated

Use immutable admitted-Market legs, earliest-lock rule, capped deterministic score/return and an
explicit void policy. The slip must show every leg, combined consequence, cutoff and signature
scope. It requires canonical contract/architecture support; do not fake it as a client bundle.

### 14.3 Pick from X — Adapted, grant-gated

Without authority, parse a link/instruction into an unsigned draft only. Execution requires a
bounded, expiring, revocable Action Grant, the canonical validation/signing path and durable
receipt history. X content never becomes Market truth.

### 14.4 Playbooks and Agents — Adapted, grant-gated

- readable, immutable/versioned strategy rules;
- simulation clearly labeled and separated from live results;
- compare real live performance only when sufficient data exists;
- read-only alerts/drafts before automation;
- automation only under bounded grants, allowance/Market rules, single-writer execution and
  receipts;
- pause/revoke, failure and expired-grant states;
- no fake autonomous activity.

### 14.5 Proof Surface — Adapted

Aggregate real source/Series/pipeline coverage, distribution, latency and reliability. Every chart
declares provenance, completeness, time range and stale state, and drills into real Markets/proofs.
It complements plain Market/Card proof; it cannot become the default action surface.

### 14.6 Creator and Hosted Round surfaces — Adapted, role-gated

- creator proposes a Series/source configuration;
- compatibility/admission report shows all five Market rules and decoder/source dependencies;
- operator review remains distinct from creator proposal;
- registration writes only through approved authority;
- public creator record and Challenge collections use admitted Markets;
- Hosted Round creation cannot let a participant choose an outcome or bypass the referee path.

## 15. Proof and transparency experience

### 15.1 Three levels

1. **Source identity**: ordinary-language event, chain and lock.
2. **Why verified**: fixed rules, exact event, Creditcoin verification and when score updates.
3. **Technical receipt**: chain key, emitter, signature, subject, decoder, source key, boundaries,
   Pick-set hash, transactions and explorer links.

### 15.2 Context preservation

- receipt repeats the Market question/id;
- personal entry repeats Player choice/Card id;
- closing returns to the exact Market/Card;
- Transparency/Surface rows deep-link back to affected product context;
- “How proof works” may explain the system globally, but never substitutes for contextual proof.

### 15.3 Lifecycle and failures

- event expected;
- commitment recorded;
- attestation requested/received;
- proof built/submitted;
- confirmation unknown with hash;
- verified;
- scoring pending/completed;
- voided;
- stuck with reason/elapsed/next safe action.

Use measured timestamps and expected ranges. Do not animate a fabricated pipeline or collapse void
and stuck into generic failure.

## 16. Feedback, motion, sound, haptics and copy

### 16.1 Feedback hierarchy

- field validation lives at the field;
- action status lives in the action slot;
- operation status lives on the Card and Activity;
- route/service status uses a persistent banner or surface state;
- toast is a supplementary acknowledgement only.

### 16.2 Motion

Allowed purposeful motion:

- menu/sheet entrance and focus transition;
- pending Card time/progress;
- proof lifecycle reveal;
- accepted Card materialization;
- canonically finalized Streak/rank effect;
- finite Deck navigation.

Rules:

- follow motion setting and `prefers-reduced-motion`;
- explicit reduced setting wins;
- no perpetual decorative motion around the main decision;
- pause timers/animation when hidden while preserving real elapsed time;
- never use motion to imply successful settlement early;
- touch targets remain stable during animation.

### 16.3 Sound and haptics

- opt-in and device-local;
- only for meaningful accepted/finalized feedback, not every hover/tap;
- semantic state remains visible without them;
- no sound on initial page load;
- unsupported haptics are hidden or explained;
- errors do not rely on a vibration pattern.

### 16.4 Copy

Use Pick, Call, points, Market, Card, result, Streak and League. Explain chain/source terms once in
ordinary language. Avoid casino language, money-return promises, fake urgency, “magic” AI claims,
emoji as status and unexplained hashes. Absolute UTC time accompanies relative countdowns where a
cutoff or settlement matters.

### 16.5 Marks and small interaction states

- Use approved BTC, ETH, Creditcoin, Attestcoin and X marks only in their real contexts. A logo is
  not a substitute for a written source/network label.
- Player identity uses a stable address-derived identicon or approved image, with a shortened
  address and accessible full value. Do not use random emoji or fake portraits.
- Every button has default, hover, focus-visible, pressed, disabled, busy, success and failure
  behavior where applicable. Disabled controls state why or pair with explanatory text.
- Copy-to-clipboard confirms what was copied and exposes manual selection when the API fails.
- Countdown changes do not cause layout shift. At zero, re-read canonical Market state instead of
  locally declaring it locked or settled.
- Skeletons match final geometry and never contain fake names/numbers. Use a spinner only when the
  wait is indeterminate and its label is announced.
- Filters, tabs and segmented controls preserve URL or local return state and expose selected state
  without color alone.
- Card flip/reveal has a non-motion alternative and never hides result/proof from keyboard users.
- Back restores the meaningful prior scroll/Deck position when safe; a deep link has a deterministic
  product fallback.
- External/explorer links are labeled, open deliberately and never replace the current product
  context without warning.
- Success language names the actual completed stage: “Pick accepted” is not “Result confirmed”.
- Error language names effect and next action; it does not blame the Player or collapse every
  failure into “Something went wrong”.

## 17. Responsive, theme and accessibility acceptance matrix

| Viewport | Shell and navigation | Content/overlay acceptance |
|---|---|---|
| 1440 by 1000 | full header, grouped overflow, account/Streak stable | Market action and supporting context visible; drawers do not exceed readable width |
| 1024 by 768 | no nav collision; overflow activates before labels compress | composer/Card/proof order retained; overlays fit height and scroll internally |
| 390 by 844 | compact header, five-job bottom bar, complete More | keyboard-safe forms; bottom bar never covers CTA; drawers respect safe area |
| 360 by 800 | labels/icons remain legible; no hidden job | no horizontal overflow; Card/share and errors remain operable |

At every viewport, inspect light and dark after interactive primitives mount. Verify:

- no theme flash;
- SVG/canvas/chart colors react to theme change;
- 200 percent zoom/reflow where applicable;
- keyboard path, visible focus, Escape and focus restoration;
- heading/dialog semantics and accessible names;
- live regions for async status without repeated noise;
- sufficient contrast beyond color-only status;
- reduced motion;
- long address, Market question, error and translated-like stress text;
- signed-out, first-run, returning, loading, empty, thin, stale and failure states.

## 18. Complete parity ledger

| Surface/behavior | Reference lesson | Classification | Proof League disposition | Acceptance evidence |
|---|---|---|---|---|
| Live-event visual system | Yosuku + PIPS + Flicky + Proof League correction | Adapted/additive | New event-first system; no old palette is protected; family stages remain distinct inside one grammar | black-and-white hierarchy review plus four viewports and shipped themes |
| Shared desktop/mobile route registry | Yosuku + Masayume | Adapted | One registry; Play, Events, League, Record; complete More | route inventory and nav walkthrough |
| Header menus and close behavior | Both | Exact behavior | route/outside/Escape/resize/focus rules | keyboard/pointer inspection |
| Account identity and state | Both | Adapted | address identity, Connect/session, real Streak | signed-out/loading/unrecorded/signed-in |
| Financial balance/faucet header | Yosuku | Excluded | free points allowance only; no automatic funding | copy/data inspection |
| Versioned onboarding | Yosuku + ZK Freighter | Adapted | five-step product primer and return to intent | first/skip/return/auth-failure paths |
| Seed/import/funding onboarding | ZK Freighter | Excluded | Privy owns account security; no seed ceremony | route/source inspection |
| One-overlay handoff | Prior corpus + reference defect | Additive correction | coordinator closes origin before destination | Guide-to-composer and mobile More tests |
| Event Board | Yosuku corrected by live-event rebaseline | Adapted | real question/state/own Pick, family-specific Event tiles and Stages | live/locked/settled/empty/stale |
| Financial trade ticket | Yosuku + Masayume | Excluded semantics | no money, leverage, odds, payment source or cash-out | copy/control inspection |
| Points composer | Proof League | Additive/adapted | one action path across Market, Reels, Games, Guide | draft/auth/sign/refusal/retry/unknown |
| Pending 4:5 Card | Yosuku | Adapted | private accepted Prediction Card | real accepted Pick and export |
| Settled share Card | Yosuku | Adapted | same Card gains result/score/Streak/proof | correct/incorrect/voided/stuck |
| Share fallback ladder | Yosuku | Exact behavior | Web Share/file -> PNG -> copy -> X | capability and failure matrix |
| Play as primary surface | PIPS + Flicky + Masayume | Adapted | real admitted-Event stages, deck modes and resume | Play hub at all viewports |
| Family-specific event instrument | PIPS + Proof League | Additive | Yield Signal, Draw, Race/Milestone/Governance grammar; no universal option-row template | recognizable stages without category labels |
| Waiting and result ritual | Flicky + Proof League | Adapted/additive | meaningful lock/attest/reveal states and family-specific Card transformation | accepted-to-reveal walkthrough |
| Practice | Masayume | Adapted | historical settled Market tutorial, no record effects | full deck/reveal/exit path |
| Daily Deck | Reels + Masayume | Adapted | finite real Market deck and canonical composer | empty/end/return/accepted Card |
| Lucky | Masayume + Hosted Round | Adapted/gated | only over real future-block Hosted Round | live round or named unavailable state |
| Challenge | Existing Proof League | Adapted/gated | social wrapper; independent fresh Picks | invite/expiry/one-sided/result |
| Duel | Masayume | Blocked | needs authority, matchmaking, scoring and recovery | approved design plus real dependency |
| Non-event arcade | Masayume | Blocked | owner must resolve conflict with verified-event rule | explicit owner decision |
| Game settings | Masayume | Adapted | local sound/haptic/motion/accent controls | persist/support/reduced-motion checks |
| Player game profile | Masayume | Adapted | real record/Streak/rank; unrecorded is not zero | state matrix |
| Achievements/history/resume | Masayume | Adapted/gated | real deterministic records only | interruption and empty/loading checks |
| Sensei/Guide dock and drawer | Masayume | Adapted | grounded contextual assistant, optional provider | context/starter/no-provider/errors |
| AI action cards | Masayume corrected by Proof League | Adapted | unsigned typed handoff to canonical composer | valid/non-valid/close-focus flows |
| Market Room | Yosuku | Adapted | isolated off-chain discussion, Pick-gated posting | public/empty/join/post/error |
| League | Yosuku + Masayume | Adapted | real ranking, own row, thin/unranked states | real projection walkthrough |
| Record/portfolio | Yosuku | Adapted | all Cards and operations, no hidden misses | open/settled/filter/empty/error |
| Activity | ZK Freighter | Adapted | durable operation stages and recovery | filter/stale/unknown/failure |
| Settings/recovery | ZK Freighter + Masayume | Adapted | session/theme/game/alerts/cache truth | supported/unsupported/reset wording |
| Takes/Calls/alerts | Existing corpus | Adapted/gated | social data isolated from truth; explicit consent | failure-local and revoke checks |
| Player Edge | Existing corpus | Adapted/gated | sample-aware canonical record analysis | provenance/sample/underlying Cards |
| Combo | Existing corpus | Blocked until architecture | canonical multi-Market commitment only | contract/void/lock acceptance |
| Pick from X | Existing corpus | Blocked until grants | unsigned draft first; bounded grant execution | expiry/revoke/receipt/refusal |
| Playbooks/Agents | Existing corpus | Blocked until grants/runner | simulate, then bounded automation | version/results/revoke/failure |
| Creator/Hosted Round | Existing corpus | Adapted/role-gated | proposal, admission, operator registration | permission and report paths |
| Plain proof | Proof League diagnosis | Adapted | source/lock/referee after action context | comprehension walkthrough |
| Technical receipt | Current Proof League | Exact but relocated | full evidence, exact backlinks | explorer and context checks |
| Proof Surface | Existing corpus | Adapted | real aggregate provenance/completeness | drilldown/stale/empty states |
| Theme/motion/accessibility | All | Exact behavior + additive rigor | equal themes and support-aware feedback | acceptance matrix |

No row classified Exact, Adapted or Additive may be removed because another row is blocked.

## 19. Implementation coverage record

For every route or feature slice, the implementation agent must append or maintain a coverage row
with:

| Field | Required content |
|---|---|
| Surface | route/component and user job |
| Reference evidence | exact source path/route and reviewed commit |
| Classification | Exact, Adapted, Additive, Blocked or Excluded |
| Data authority | chain, projection, local device, operational store or AI provider |
| States exercised | normal plus loading/empty/stale/failure/recovery |
| Responsive evidence | viewport and theme |
| Runtime status | confirmed, static-only, inferred or blocked |
| Deviation | what changed and why |

A feature is not fidelity-complete when only the default desktop screenshot looks correct. It is
complete when its intent, entry, action, feedback, interruption, return, terminal state, failure,
responsive branch and accessibility behavior are accounted for with real data authority.

## 20. Final acceptance checklist

### Global

- [ ] One typed route registry drives desktop, mobile and More.
- [ ] Every production route is reachable on mobile.
- [ ] Header account/Streak states distinguish loading, unrecorded and real zero.
- [ ] First run is versioned, skippable and returns to exact intent.
- [ ] Only one blocking overlay is active; focus and scroll restore correctly.
- [ ] Theme, reduced motion, sound/haptics support and safe areas are honored.

### Core loop

- [ ] A real question leads every technical identifier.
- [ ] One composer owns every Pick entry surface.
- [ ] Auth/rejection/retry/unknown confirmation retain the exact draft.
- [ ] Accepted Pick creates a private personal Card immediately.
- [ ] The same Card reaches every canonical result state.
- [ ] Streak/rank feedback waits for canonical finalization.
- [ ] Publication is explicit and share fallbacks/recovery work.

### Games

- [ ] Games shows Player, Streak, active resume, real availability, settings, achievements/history.
- [ ] Practice uses settled real Markets and changes no canonical record.
- [ ] Daily Deck, Market Play, real Lucky and Challenge reuse canonical Market/Card truth.
- [ ] Duel and arcade remain explicitly blocked until their named decisions are made.
- [ ] No fake opponent, score, achievement, history, session or successful dependency.

### AI and secondary loops

- [ ] Guide remains useful/readable when the model provider is unavailable.
- [ ] Guide action closes the drawer and hands an unsigned draft to the canonical composer.
- [ ] Room/social/alerts fail locally and cannot alter Market truth.
- [ ] Record includes misses; League uses real data and honest thin/unranked states.
- [ ] Activity exposes durable recovery; Settings accurately describe local versus canonical data.
- [ ] Extended surfaces retain explicit classifications and gates rather than disappearing.

### Evidence

- [ ] 1440x1000, 1024x768, 390x844 and 360x800 checked in both themes.
- [ ] Signed-out, first-run, returning, loading, empty, thin, stale and provider failure checked.
- [ ] Open, locked, awaiting, correct, incorrect, voided and stuck checked where real data exists.
- [ ] Drafting, signing, refused, retryable and confirmation-unknown checked.
- [ ] Runtime-confirmed, static-only, inferred and blocked claims are labeled separately.

## 21. Source index

Proof League:

- `apps/web/app/(product)/markets/[marketId]/page.tsx`
- `apps/web/components/settled-record.tsx`
- `apps/web/components/shell/nav.tsx`
- `apps/worker/src/register-series.ts`
- `docs/spike-day1.md`
- `docs/planning/prd/fidelity-revision-2026-09-02.md`
- `docs/planning/ux/REFERENCE-DESIGN.md`
- `docs/planning/ux/PRODUCT-FLOWS.md`
- `docs/planning/epics.md`

Yosuku:

- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/Header.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/Tutorial.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/TradeConfirmationModal.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/BetPlacedCard.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/ShareBetButton.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/components/ShareTradeButton.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/lib/openBetShareCard.ts`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku/lib/shareCard.ts`

Somnia/Masayume:

- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GamesHub.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GamesShell.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GamesRail.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GameCard.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GameProfileCard.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/GameSettingsSheet.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/games/settings.ts`
- `/Users/abu/dev/hackathon/sommina-events/web/src/components/shell/header/`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/sensei/SenseiDock.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/sensei/SenseiDrawer.tsx`
- `/Users/abu/dev/hackathon/sommina-events/web/src/features/sensei/SenseiTradeCards.tsx`
- `/Users/abu/dev/hackathon/sommina-events/docs/architecture/`

ZK Freighter:

- `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter/apps/web/src/OnboardingFlow.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter/apps/web/src/wallet/ActivityScreen.tsx`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter/apps/web/src/wallet/webActivityStore.ts`
- `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter/apps/web/src/wallet/SettingsScreen.tsx`
