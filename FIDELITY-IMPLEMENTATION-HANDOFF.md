# Proof League Fidelity Implementation Handoff

Status: paused; no implementation until owner approves a new design direction

Decision date: 2026-09-04

Target repository: `/Users/abu/dev/hackathon/proof-league`

Do not give this prompt to an implementation agent yet. The first visual implementation of the
rebaseline was rejected and reverted. The required next artifact is the independent designer handoff
at `.agents/ao/handoff/2026-09-04-proof-league-designer.md`; Abu must approve one design territory
before this implementation contract becomes active again.

After that approval, this is the directly pasteable prompt for the agent implementing the selected design.
For coordinated planning, implementation, read-only UX/architecture audits, continuation and final
acceptance prompts, use `AI-AGENT-PROMPT-PACK.md`. This file remains the master implementation
contract referenced by that pack.

```text
PRECONDITION: Abu has explicitly approved a named design territory produced from
.agents/ao/handoff/2026-09-04-proof-league-designer.md. If that approval is absent, stop without
editing UI and return to the design gate.

You are the implementation owner for the approved Proof League live-event experience rebaseline.
Work in /Users/abu/dev/hackathon/proof-league. The product direction is settled. Do not restart
product ideation, run a pivot workflow or reduce this correction to a cosmetic reskin.

STOP THE CURRENT GENERIC VISUAL DIRECTION BEFORE WRITING MORE UI.

The present dark crypto-dashboard treatment, generic question/percentage rows, proof ticker,
universal Market Card and generic 4:5 receipt are rejected presentation. The existing palette and
component silhouettes are not product fidelity and are not protected. Keep useful underlying state,
route, composer, data and lifecycle work only after classifying it. Do not reset or blindly delete
dirty work; separate salvageable infrastructure from presentation that must be reshaped or retired.

Use the reference-product-fidelity skill for this task. Read its SKILL.md and linked fidelity
contract completely before acting. If that skill is unavailable in your environment, follow the
authority record, parity classifications and completion gates embedded in the documents below.

Important repository preference:
- Do not create AGENTS.md, AGENT.md, CLAUDE.md or CLOUD.md anywhere in this repository.
- Do not recreate the removed root AGENTS.md or any spelling/case variant of it.
- Dependency-owned copies under node_modules are outside this instruction and should not be edited.

Task boundary:
- Implement the product rebaseline in the local repository and verify it proportionately.
- Do not deploy, publish, submit, create external accounts/credentials, provision paid services or
  send live transactions without a separate explicit instruction from Abu.
- Preserve unrelated/user-owned dirty changes. Inspect status before editing.

Read these files completely in this authority order:
1. /Users/abu/dev/hackathon/proof-league/project-context.md
2. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md
3. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md
4. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md
5. /Users/abu/dev/hackathon/proof-league/docs/planning/architecture/ARCHITECTURE-SPINE.md
6. /Users/abu/dev/hackathon/proof-league/docs/planning/architecture/FIDELITY-ARCHITECTURE-REVISION.md
7. /Users/abu/dev/hackathon/proof-league/docs/planning/architecture/CONVENTIONS.md
8. /Users/abu/dev/hackathon/proof-league/docs/planning/prd/prd.md
9. /Users/abu/dev/hackathon/proof-league/docs/planning/prd/fidelity-revision-2026-09-02.md
10. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/REFERENCE-DESIGN.md
11. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/PRODUCT-FLOWS.md
12. /Users/abu/dev/hackathon/proof-league/docs/planning/epics.md
13. /Users/abu/dev/hackathon/proof-league/docs/research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md
14. /Users/abu/dev/hackathon/proof-league/docs/research/reference-fidelity-2026-09-02/SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md

The 2026-09-04 live-event rebaseline wins on product objects, hierarchy, event-family interaction,
Cards, ways to play, Streak visibility, navigation, visual direction, result ritual and proof
disclosure. The 2026-09-03 document and older documents remain authoritative only for compatible
requirements, chain truth, signing, settlement, scoring, projections and state semantics. Old
visual tokens are not protected.

Completeness law:
- FULL-REFERENCE-UX-INVENTORY-2026-09-03.md is an implementation acceptance contract, not optional
  inspiration. Every row must remain Exact, Adapted, Additive, Blocked or Excluded with evidence.
- Do not silently omit a feature or state because it is small, difficult, not in the first slice or
  absent from the current implementation.
- Sequencing does not reduce scope. A deferred row keeps its exact dependency and intended behavior.
- Reconcile new reference behavior into the ledger before using it. Do not let a reference silently
  change Proof League's authority, free-points boundary or proof-settled truth.

Re-verify repository truth before planning:
- branch, HEAD, remotes and working tree;
- all production routes and whether each is real, partial, placeholder or blocked;
- current Market/Pick/Card/score/Streak data contracts;
- current registered Series and live source-chain support;
- currently available credentials/services without printing secrets;
- recent commits, so you do not redo completed work.

The reviewed pre-documentation target snapshot was main at
1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89. Treat that as dated evidence, not an instruction to
reset. Never discard later or dirty user work.

Reference contract:
- Yosuku: /Users/abu/dev/hackathon/buidl-ctc/reference/yosuku at
  b499afdb16a465e2c6c3cb3990218997d98346ab. It is the visible product, editorial hierarchy and
  Card/share lifecycle baseline.
- PIPS: /Users/abu/dev/hackathon/sommina-events/reference/pips at
  fe8f6963972ca18fc9db0fd9ee4db389e6293ee8. It is the dedicated play-instrument, one-primary-action,
  persistent Player/Streak, tactile feedback, onboarding and settings reference.
- Flicky: /Users/abu/dev/hackathon/sommina-events/reference/flicky at
  56054baeb0c7f8ef6e039ebb0eed2b04e4f59388. It is the deck cadence, decisive gesture, waiting ritual,
  result reveal, active-match resume and share reference.
- Somnia/Masayume: /Users/abu/dev/hackathon/sommina-events, rechecked at
  5e57877d0d89992903d77f89bba14951f7152e8b. It is the Games hierarchy, player meta-state, resume
  and truthful readiness reference. It was ahead of origin and had user-owned services/ops and
  untracked prompt/spike work at documentation handoff. Inspect current state before use; do not
  clean, reset, copy over or otherwise disturb that work.
- ZK Freighter: /Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter at
  5ddf72483e1383defcbc0a17fd9dba58c5e0f0f4. It is the first-run, returning, recovery and async
  state-machine reference.
- References are behavior/design evidence only. Do not copy their code or assets because no reuse
  license grant is recorded.

For every implemented slice, open the corresponding reference routes/components first. Record the
full flow, responsive branches, overlays, persistence, loading/empty/error/recovery and terminal
states. Do not substitute a generated mood board or generic component library for source evidence.

Approved product definition:
Proof League is a free-to-play, living on-chain prediction league. Every admitted event becomes a
recognizable prediction stage, such as a yield signal, sealed draw, pool race, milestone track,
governance chamber, weekly allocation or network pulse. A Player calls an outcome, receives a
personal collectible Card, owns the wait, experiences the proven reveal, and builds a Streak and
League record. The Card is not an NFT, token, tradable collectible or financial position. Proof is
the referee beneath the experience, not the stage or the first thing the Player must understand.

Canonical player loop:
understand question -> choose outcome -> commit free points -> receive personal Card -> wait ->
see result -> update Streak/rank -> share or play again.

Proof disclosure:
why verified -> plain source/lock explanation -> lifecycle -> technical receipt. Chain keys,
emitters, event signatures, decoder ids, source keys, hashes and raw thresholds must not precede
the question, choices and points action. Technical proof must remain reachable and link back to the
exact Market and Card.

Do not conflate these objects:
1. Event tile/poster: public discovery preview. Never call it a Card.
2. Event Stage: family-specific prediction instrument containing the canonical Pick action.
3. Your Card: one Player's artifact, created only after an accepted Pick, private by default and
   public only after explicit publication. It evolves through Open, waiting, correct, incorrect,
   voided and stuck states rather than being replaced.
4. Proof Receipt: plain-language evidence and technical detail attached to the exact Event/Card.

Ways-to-play rule:
- Play is the primary product job and the authenticated/homeward destination.
- Desktop and mobile primary jobs are Play, Events, League and Record.
- Create Challenge moves to More and contextual actions; it is not removed.
- Ways to play are presentations of the same admitted Market deck and canonical composer, never a second
  truth/scoring path.
- Initial honest modes are Daily Deck, ordinary Live Event play, the Yield Signal over the real
  Lido five-band Market, Lucky Draw only when a real Hosted Round exists, and Challenge when its real
  publication flow exists. Practice replays a short deck of already-settled admitted Markets and
  changes no points, Streak, rank or League state.
- Duel is blocked until its rules, data authority, resume/recovery and score semantics exist.
- Non-event arcade is an explicit owner-decision blocker because the reference modes are off-chain
  score games while the approved Games rule reuses verified Markets. Do not ship it or erase it
  from the ledger. Abu must choose exclusion, clear separation or a new integrity model.
- A mode entry must distinguish loading, live, chain unavailable and not implemented. Do not show a
  decorative disabled grid as if it were a working Games product.

Whole-experience requirements:
- Header and navigation: derive desktop, mobile bottom bar and complete scrollable More from one
  typed registry. Menus close on route, outside click, Escape and breakpoint change; focus returns.
- Account shell: distinguish signed out, identity loading, never recorded and real zero. Keep real
  Streak/provisional state visible without displacing the next action.
- Onboarding: versioned, skippable, keyboard-accessible primer; authenticate only at an authority
  boundary and restore the exact Market, outcome, points draft and intended action after connection.
- Overlays: only one blocking overlay may own focus/scroll. A Guide/menu/settings-to-composer
  handoff closes the origin first, preserves typed context and restores focus on cancellation.
- Canonical action: Market, Reels, Games, Calls, Challenges and Guide suggestions all use one points
  composer and the same error/idempotency contract.
- Cards: private on acceptance, stable lifecycle/public URL, explicit publication, 4:5 image and Web
  Share/file -> PNG -> copy-link -> X fallbacks with persistent failure recovery.
- Games: active resume outranks new play; mode cards report real readiness; Player, Streak, settings,
  achievements and history use real states only. Settings are local sound, haptics, system/full/
  reduced motion and accent; nothing is signed or sent.
- League Guide/AI: grounded optional help with real context, starter/follow-up states, refusal and a
  useful no-provider state. Valid action cards hand unsigned drafts to the canonical composer. AI
  never signs, submits, publishes, invents live data or blocks the core product.
- League, Record and public Player: real projection only, honest loading/empty/thin/unranked states,
  sticky own row where relevant and complete history including incorrect/voided/stuck Cards.
- Room, Takes, Calls and alerts: explicit publication/consent, real Market links, failure isolation,
  reporting/revocation and no effect on canonical truth.
- Activity, Settings and recovery: durable operation stages, confirmation-unknown ids/hashes,
  retained retry context, accurate local-versus-canonical reset copy and supported/unsupported state.
- Preserve explicit scope and gates for Player Edge, Combo, Pick from X, Playbooks/Agents, Proof
  Surface, Creator/Hosted Round and installability. Game-first hierarchy does not delete them.
- Motion, sound and haptics follow Player/system settings; semantic status remains visible without
  them. Critical status is persistent in context, never toast-only.

Streak rule:
- Streak is persistent meta-progression in the authenticated shell, Games, personal Card, Record
  and League.
- Use only canonical chain/projection truth.
- Loading, signed out and never recorded are not zero.
- A stuck Market leaves its day provisional. Animate/apply a Streak effect only on canonical day
  finalization.

Current catalogue truth to preserve:
- Ethereum mainnet and Sepolia are the two measured supported source chains.
- Creditcoin 3 testnet is the verification/scoring chain, not a third source chain.
- The current recurring registration script contains one Lido daily rate-ratio APR Series with
  five bands on Ethereum mainnet.
- Hosted Rounds are a capability sourced from Sepolia.
- Do not advertise a broad multi-chain catalogue, Pool Races, governance, milestones, Duel or
  arcade as live unless current code/chain readings prove them.

Architecture laws:
- Chain state is the only truth writer. The worker is the sole transaction submitter and sole
  class-1 projection writer. Web's one write path is EIP-712 Pick intake.
- No settled/correct result, score, Streak or rank renders before confirmed on-chain truth.
- Reuse one canonical Market truth model, composer, Card lifecycle, state copy, route model and error
  contract. Family-specific Event renderers may vary interaction and composition but must not fork
  Pick math, availability, signing, settlement or score truth.
- Apps import packages; packages do not import apps. Keep TypeScript files below 300 effective
  lines and raw CSS/config/Solidity below 400 raw lines. Split by behavior before limits.
- Use module-owned named constants with why-comments. Do not create a constants dumping ground.
- Use typed Result/error variants and compile-checked user copy. Preserve the one persistent error
  hierarchy: refusal, retry with retained context, confirmation unknown with durable id/hash, and
  terminal success.
- No fake data, optimistic settlement, fake progress, fake player, fake opponent, fake ranking,
  fake achievement, fake Card or hardcoded successful dependency state.
- UI language uses Event, Pick, Call, points and Market where technically precise. No casino vocabulary, emoji, fake urgency or
  em/en dashes in user-facing strings.
- Tailwind v4 semantic tokens and data-theme own the styles. Avoid inline style objects.

Implementation order:
1. Inventory the dirty work. Classify each change as salvageable infrastructure, needs reshaping or
   discarded presentation. Preserve the working tree and record the classification before editing.
2. Establish typed event presentation metadata and family renderers without forking Market truth,
   availability, composer, signing, settlement or scoring.
3. Prototype Yield Signal, Block Draw and Pool Race in black and white. They must be recognizably
   different without category labels. Pool Race remains a non-production prototype until admitted.
4. Complete the one real Lido Yield Signal loop first: Event tile -> Stage -> band -> points ->
   auth/sign -> accepted personal Card. Do not start with a broad Event/grid placeholder surface.
5. Complete that same Card's locked -> awaiting source -> attesting -> proof-confirmed result ->
   family-specific reveal -> score -> day finalization -> Streak state.
6. Implement private-by-default publication and stable Card URL with Web Share/file, PNG, copy-link
   and X fallbacks. Make Record and League show the same truth, including misses and provisional days.
7. Build Play/Events navigation and honest Event Board only after the Lido vertical slice works.
8. Prove the family system with a real admitted Hosted Round Block Draw. Keep future families out of
   live inventory until admission exists.
9. Connect Daily Deck, Practice and Challenge through the canonical Event/composer/Card path. Keep
   Duel blocked until its rules and authority exist.
10. Relocate proof into three progressive levels, then close onboarding, Guide, overlays, settings,
    failure/recovery, responsive and complete inventory behavior.

Visual contract:
- The existing cream/near-black/vermilion system and type/token choices are not protected. Keep only
  choices that earn their place in a fresh event-first design.
- Do not build a generic black Web3 dashboard, exchange terminal, casino lobby, neon game-card grid,
  question-plus-percentages table or universal themed rectangle.
- Start with hierarchy, object silhouette, choice, timing and reveal in black and white. Apply a
  compact palette only after Yield Signal, Draw and Race are visually distinct without labels.
- Each event family owns a silhouette, spatial choice model, motion behavior, ambient field, Card
  motif, reveal transformation and reduced-motion equivalent inside one shared grammar.
- Crowd Pick distribution is secondary, explicitly labelled and preferably revealed after the
  Player commits. Never present it as price, odds or probability.
- Personal Cards use a 4:5 social-first silhouette, 1200x1500 export and 1200x630 OG companion.
- Your Card retains the exact event-family identity through Open, waiting, reveal and result while
  preserving shared identity, Player, points, time, state and proof grammar.
- Do not turn non-price events into price charts. Recent proven outcomes may appear as clearly
  labelled history, not implied probabilities.
- Open is anticipatory but neutral; green is earned only after proof and score; incorrect is ash
  with equal information density.

Required states:
signed out, first run, returning, exact draft restoration, loading, empty, thin, stale, provider
unavailable, open, locked, committed, awaiting, proof verified, scored, voided, stuck, drafting,
signing, accepted, refused, retryable, confirmation unknown, private Card, publishing, published,
share failure, unlisted, Streak provisional/extended/broken, game live/loading/unavailable/blocked,
resumable session, Game setting supported/unsupported, Guide ready/loading/refusal/no-provider/
handoff, overlay open/closing/focus-restored and Activity recovery where applicable.

Do not hide a missing dependency behind an inert control. Either connect the real dependency in the
same slice or render a clearly named unavailable state with the required next gate. Core accepted
flows must remain usable without the Guide, social feed, notifications or future game modes.

Verification:
- Run repository checks/builds proportionate to the changed slice; tests support correctness and
  are not a separate deliverable.
- Directly inspect 1440x1000, 1024x768, 390x844 and 360x800 in both themes.
- Exercise real reachable signed-out, first-action, open, awaiting, settled, incorrect,
  voided/stuck, empty, error and confirmation-unknown states.
- Toggle theme after SVG/canvas/chart primitives mount.
- Verify no horizontal overflow, hidden primary job/action, overlay stacking, lost draft, fake data
  or toast-only critical status.
- Verify the complete mobile More drawer, menu close/focus behavior, first-run return to intent,
  Game settings persistence and Guide-to-composer one-overlay handoff.
- Record runtime-confirmed evidence separately from static inspection, inference and blockers.

You may update planning/checklist documents to reflect actual implementation status, but do not
rewrite the approved direction or silently mark blocked work complete. Do not commit or push unless
Abu's task explicitly requests it.

At handoff report:
1. Working outcome and visible routes/flows.
2. Exact files and architectural seams changed.
3. Reference behaviors preserved, adaptations made and their reasons.
4. Exact checks and manual viewports exercised.
5. Runtime-confirmed states versus inferred/unverified states.
6. Remaining blocked/excluded items and their dependencies.
7. Local URL, branch/worktree and server status.
8. The updated complete UX inventory coverage rows, including every deferred feature and why.

Do not declare the rebaseline complete merely because the landing page, Games grid or Card styling
exists. Completion means the real question-to-Pick-to-personal-Card-to-result-to-Streak-to-share
loop works and proof remains context-linked behind progressive disclosure.
```
