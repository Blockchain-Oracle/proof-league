# Proof League AI Agent Prompt Pack

Status: implementation prompts paused pending owner approval of a new design direction

Updated: 2026-09-04

Repository: `/Users/abu/dev/hackathon/proof-league`

## 0. Purpose

This file gives Abu copy-ready prompts for AI agents working on Proof League. It prevents a new
agent from skimming one document, restarting product ideation, treating proof as the user-facing
product, omitting small UX behavior, or confusing planned scope with currently implemented truth.

This pack does not launch agents or grant permission for deployment, live transactions, publishing,
submission, account creation, paid services, destructive Git operations, commits or pushes. Abu
chooses which prompt to use and grants any external authority separately.

Use one writing agent in the Proof League checkout at a time. The fidelity and architecture
auditors below are read-only unless Abu later gives them a specific implementation task. Multiple
agents must not edit the same checkout concurrently.

### 0.1 Current owner gate — read before using any prompt

The first UI implementation produced from the 2026-09-04 rebaseline was rejected and reverted. The
older dashboard direction remains rejected as well. No visual direction is currently approved.

Do not give Prompt 0, Prompt 2 or Prompt 5 to an implementation agent yet. Give the next designer
`.agents/ao/handoff/2026-09-04-proof-league-designer.md`. That agent must present multiple creative
territories and stop for Abu's selection. These implementation prompts become eligible only after
Abu records explicit approval of a design direction.

## 1. How to use the prompts

Recommended sequence after the 2026-09-04 design reset:

1. Give `.agents/ao/handoff/2026-09-04-proof-league-designer.md` to a senior product/interaction
   designer. Do not authorize production code.
2. Review the designer's materially different territories and record Abu's selection or rejection.
3. Only after explicit approval, give **Prompt 1** to a fresh primary agent when a read-only reconciliation is needed. It reads and reconciles the complete corpus, inspects the
   actual repository, and produces a plan without editing.
4. Optionally give **Prompt 3** and **Prompt 4** to separate read-only reviewers. Return their
   findings to the primary agent.
5. Once the approved design and plan are aligned, give **Prompt 2** to the one implementation agent.
6. When context changes or another agent takes over, use **Prompt 5**.
7. Before calling the rebaseline complete, use **Prompt 6** for an independent read-only acceptance
   audit.

Prompt 1 followed by Prompt 2 is sufficient when only one agent is available. Prompts 3, 4 and 6
increase scrutiny without creating competing writers.

## 2. Shared authority and document-reading protocol

Every agent must obey this protocol before relying on the corpus.

### 2.1 Current authority order

1. Abu's latest explicit instruction in the active task.
2. `/Users/abu/dev/hackathon/proof-league/project-context.md`.
3. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md`.
4. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md` for compatible requirements only.
5. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md` with its 2026-09-04 reclassification.
6. Architecture and contract truth for data authority, signing, settlement, scoring and operations.
7. Revised PRD, UX and parity documents for compatible requirements not changed above.
8. Original planning documents for compatible domain detail.
9. Reference products as behavior evidence only.

The live-event rebaseline wins when older material makes proof the product, calls public discovery
a Market Card, preserves the old palette, uses one generic composition for every event, makes Pick
distribution look like probability/price, keeps the old five-job navigation or treats reveal/waiting
as secondary.

The full UX inventory is not optional inspiration. Every Exact, Adapted and Additive row remains in
scope. Every Blocked or Excluded row remains explicit. “Later”, “small” and “difficult” do not mean
deleted.

### 2.2 Mandatory first-pass reading

Read these files completely, in order. Do not read only headings or summaries.

1. `/Users/abu/dev/hackathon/proof-league/project-context.md`
2. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md`
3. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/GAME-FIRST-FIDELITY-REBASELINE-2026-09-03.md`
4. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md`
5. `/Users/abu/dev/hackathon/proof-league/FIDELITY-IMPLEMENTATION-HANDOFF.md`
6. `/Users/abu/dev/hackathon/proof-league/docs/planning/architecture/ARCHITECTURE-SPINE.md`
7. `/Users/abu/dev/hackathon/proof-league/docs/planning/architecture/FIDELITY-ARCHITECTURE-REVISION.md`
8. `/Users/abu/dev/hackathon/proof-league/docs/planning/architecture/CONVENTIONS.md`
9. `/Users/abu/dev/hackathon/proof-league/docs/planning/prd/prd.md`
10. `/Users/abu/dev/hackathon/proof-league/docs/planning/prd/addendum.md`
11. `/Users/abu/dev/hackathon/proof-league/docs/planning/prd/fidelity-revision-2026-09-02.md`
12. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/REFERENCE-DESIGN.md`
13. `/Users/abu/dev/hackathon/proof-league/docs/planning/ux/PRODUCT-FLOWS.md`
14. `/Users/abu/dev/hackathon/proof-league/docs/planning/epics.md`
15. `/Users/abu/dev/hackathon/proof-league/docs/research/reference-fidelity-2026-09-02/AUTHORITY-AND-PARITY.md`
16. `/Users/abu/dev/hackathon/proof-league/docs/research/reference-fidelity-2026-09-02/SOMNIA-MASAYUME-SUPPLEMENTAL-AUDIT.md`

After reading, write a reconciliation table with these columns before proposing work:

| Document | Authority for | Must preserve | Changed by newer authority | Blocked/unknown | Relevant implementation seams |
|---|---|---|---|---|---|

Do not ask Abu to repeat an answer already settled in those files.

### 2.3 Mandatory implementation-truth reading

Planning says what the product must become. These files and the current source say what exists:

1. `/Users/abu/dev/hackathon/proof-league/README.md`
2. `/Users/abu/dev/hackathon/proof-league/package.json`
3. `/Users/abu/dev/hackathon/proof-league/docs/spike-day1.md`
4. `/Users/abu/dev/hackathon/proof-league/docs/launch-lineup.md`
5. `/Users/abu/dev/hackathon/proof-league/docs/verify-evidence.md`
6. `/Users/abu/dev/hackathon/proof-league/docs/failover-drill.md`
7. `/Users/abu/dev/hackathon/proof-league/docs/operations-handoff.md`
8. all current routes, shared packages, contracts, worker and database migrations relevant to the
   proposed slice.

Treat operational files as dated evidence. Re-check repository and chain/service state before
calling any fact current. Reading `docs/operations-handoff.md` does not authorize executing its
deployment, funding or provisioning commands.

The 2026-09-02 plan at
`/Users/abu/.claude/plans/temporal-fluttering-firefly.md` is useful delivery history, but it predates
the 2026-09-03 game-first and 2026-09-04 live-event rebaselines. It cannot override the current
authority order.

The older planning-workspace prompt at
`/Users/abu/dev/hackathon/buidl-ctc/AGENT-IMPLEMENTATION-PROMPTS.md` is historical. This prompt pack
and the target repository's current documents supersede it on conflict. In particular, do not
expect, recreate or require a root `AGENTS.md` or `CLAUDE.md` in Proof League.

### 2.4 Complete corpus sweep

The Prompt 1 planning agent and Prompt 6 final auditor must inventory and read every first-party
Markdown/YAML document under `/Users/abu/dev/hackathon/proof-league/docs`, including research
digests, pick-set documentation and operational records. Use `rg --files docs` or equivalent and
record every file in the reconciliation/coverage manifest so no document disappears because it was
not named in a short prompt.

Classify each document before relying on it:

- **current authority**: live-event rebaseline, compatible game-first requirements, reclassified full
  UX inventory, revised PRD/architecture/UX and conventions;
- **current or dated implementation evidence**: README, spike, lineup, verification, failover,
  operation and pick-set records;
- **requirements catalogue**: epics/stories, not a workflow or completion claim;
- **background research**: domain, competitive, Creditcoin/Attestcoin and Ethereum event-catalogue
  research; useful evidence but lower than newer product/architecture decisions;
- **generated/history metadata**: supporting provenance, never product authority by itself.

The main implementation agent reads the complete corpus during initial planning, then re-reads the
slice-specific authority and evidence before each implementation slice. A continuation agent may
rely on a verified complete-corpus manifest from the current plan, but must re-read any file changed
since that manifest.

Do not treat old phrases such as planned Pool Races, the original five-job navigation or a broad
multi-chain catalogue as current just because they appear in background research. Record the
conflict and apply the latest authority/current registration truth.

### 2.5 Reference reading

Use the `reference-product-fidelity` skill and read its `SKILL.md` plus fidelity contract completely
when available.

Reference trees:

- Yosuku: `/Users/abu/dev/hackathon/buidl-ctc/reference/yosuku`, reviewed pin
  `b499afdb16a465e2c6c3cb3990218997d98346ab`.
- ZK Freighter: `/Users/abu/dev/hackathon/buidl-ctc/reference/zk-freighter`, reviewed pin
  `5ddf72483e1383defcbc0a17fd9dba58c5e0f0f4`.
- PIPS: `/Users/abu/dev/hackathon/sommina-events/reference/pips`, reviewed commit
  `fe8f6963972ca18fc9db0fd9ee4db389e6293ee8`.
- Flicky: `/Users/abu/dev/hackathon/sommina-events/reference/flicky`, reviewed commit
  `56054baeb0c7f8ef6e039ebb0eed2b04e4f59388`.
- Somnia/Masayume: `/Users/abu/dev/hackathon/sommina-events`, rechecked commit
  `5e57877d0d89992903d77f89bba14951f7152e8b`, but the working tree was active and user-owned at
  documentation handoff.

Before using a reference behavior, verify its current commit and dirty state. Never clean, reset or
edit a reference repository. Inspect the corresponding route and source for the current slice,
including entry, transitions, overlays, persistence, mobile behavior, loading, empty, failure,
recovery and terminal states.

No reuse license grant is recorded for the pinned references. Study behavior and design; do not copy
source or assets.

### 2.6 Settled product center

Proof League is a free-to-play, living on-chain prediction league where each admitted event becomes
a family-specific prediction stage. People call outcomes, receive a permanent personal Card, own the
wait and reveal, build a Streak and League record, and can inspect the Creditcoin/Attestcoin proof
behind every result.

Human loop:

```text
understand the question
  -> choose an outcome
  -> commit free points
  -> receive a personal Card
  -> wait with honest status
  -> see the result
  -> update Streak and rank
  -> share or play again
```

Proof loop:

```text
why is this trustworthy?
  -> plain source and lock explanation
  -> proof lifecycle
  -> technical receipt and explorer evidence
```

Proof is the referee, not the first product surface. The Card is not an NFT, token, financial
position or tradable collectible.

Four distinct objects must remain separate:

1. Event tile/poster: public discovery preview, never called a Card.
2. Event Stage: family-specific prediction instrument and canonical Pick action.
3. Your Card: the one Player-owned artifact created after acceptance and evolved through settlement.
4. Proof Receipt: plain evidence and technical detail attached to the exact Event/Card.

Play modes reuse admitted proof-settleable Markets and the canonical points composer. Practice may
replay settled Markets without record effects. Yield Signal presents the real Lido five-band Market.
Lucky Draw requires a real Hosted Round. Challenge wraps an admitted Market. Pool Race, Governance,
Milestone and Weekly Allocation guide the family system but remain out of live inventory until their
admission dependencies exist. Duel and non-event arcade retain their documented blockers.

The existing dark dashboard, cream/vermilion palette, proof ticker, generic option/percentage rows,
universal Market Card and generic receipt are rejected presentation. No old palette or visual token
is protected. Pick distribution is secondary crowd context, never odds, probability or price.

### 2.7 Repository preference and current dated state

- Do not create `AGENTS.md`, `AGENT.md`, `CLAUDE.md` or `CLOUD.md` in Proof League.
- Do not edit dependency-owned instruction files under `node_modules`.
- Preserve all user-owned and unrelated dirty/untracked work.
- Never use destructive reset/checkout/clean commands.
- Do not commit or push unless Abu explicitly requests it.

At this prompt pack's creation, the target was `main` at
`1cba3ee4e4f4b5fb310d4d30f1c45d6ff48b5c89`, with the requested root `AGENTS.md` deletion and
uncommitted documentation/implementation from the game-first attempt. Its visible presentation was
rejected by the 2026-09-04 live-event rebaseline. Treat the commit and dirty state as dated evidence;
inspect the real current state before acting. Never reset to this commit.

### 2.8 Prompt 0 — Immediate correction for an agent already implementing

Use this prompt now when the current implementation is following the rejected visual direction.

```text
Pause further visual expansion in /Users/abu/dev/hackathon/proof-league. Do not discard the working
tree, reset files, clean untracked work, commit, push or deploy.

Abu has rejected the current presentation direction. The generic dark crypto dashboard, question
plus percentage rows, proof ticker, universal Market Card, generic 4:5 receipt and inherited
cream/near-black/vermilion constraints are not fidelity. Do not keep polishing them.

Read these files completely before changing another product file:
1. /Users/abu/dev/hackathon/proof-league/project-context.md
2. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/LIVE-EVENT-EXPERIENCE-REBASELINE-2026-09-04.md
3. /Users/abu/dev/hackathon/proof-league/FIDELITY-IMPLEMENTATION-HANDOFF.md
4. /Users/abu/dev/hackathon/proof-league/docs/planning/ux/FULL-REFERENCE-UX-INVENTORY-2026-09-03.md

Use the reference-product-fidelity skill. Inspect the current PIPS, Flicky, Masayume, Yosuku and ZK
Freighter reference behavior named in the authority documents. Study behavior only; do not copy
code or assets.

First classify every current dirty product change as:
- salvageable infrastructure: real data/state, canonical composer, error contract, route registry,
  lifecycle or architecture work;
- needs reshaping: useful behavior coupled to the rejected hierarchy;
- discarded presentation: generic percentage rows, price/probability implication, universal card
  composition, proof-led hierarchy or inherited visual styling.

Then replace the product model in your plan:
- public discovery is an Event tile/poster, never a Card;
- prediction happens in a family-specific Event Stage;
- the only user-facing Card is Your Card, created after an accepted Pick and evolved through waiting,
  reveal, score and Streak;
- proof is a context-linked receipt beneath that exact Event/Card.

The first implementation slice is the real Lido Yield Signal, not a broad grid:
Event tile -> five-zone Yield Signal Stage -> choose band -> points -> auth/sign -> accepted Card ->
locked/awaiting/attesting -> proven reveal -> score/day/Streak -> share/proof.

Before applying palette, prototype Yield Signal, Block Draw and Pool Race in black and white. They
must be recognizable as different interactions without their labels. Only Lido is the current
recurring public Series; Hosted Draw is shown only when admitted; Pool Race remains a non-production
prototype until its decoder/admission exists.

Primary navigation is Play, Events, League and Record, with complete More for the remaining jobs.
Pick distribution is secondary crowd context, preferably shown after commitment, and must never be
called or styled as odds, price or probability. Do not use a price chart for a non-price event.

After reading and classification, continue with the approved dependency order in
FIDELITY-IMPLEMENTATION-HANDOFF.md. Preserve all user work and architecture truth. Do not create
AGENT/AGENTS/CLAUDE/CLOUD instruction files. Report exactly what presentation you retired, reshaped
or retained and why.
```

## 3. Prompt 1 — Primary agent: read, reconcile and plan

```text
Work in /Users/abu/dev/hackathon/proof-league.

This is a read-only planning turn for the approved Proof League live-event experience rebaseline. Do
not edit files, implement, install/update dependencies, commit, push, deploy, publish, submit, create
accounts/credentials, provision services, fund anything or send live transactions.

First read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md completely. Follow its
Shared authority and document-reading protocol. Then read every mandatory first-pass and
implementation-truth file completely in the stated order. Use the reference-product-fidelity skill
and inspect the pinned reference evidence relevant to the first proposed slice.

Do not restart ideation or recommend a different product. Do not use a hackathon-idea, collision,
saturation, pivot or BMad development workflow. The product direction is settled. The 52 stories
are a requirements catalogue, not permission to build disconnected story shells.

Inspect current repository truth without exposing secrets:
- branch, HEAD, remotes, status and recent commits;
- every current route and whether it is working, partial, placeholder, blocked or absent;
- Market, Pick, personal Card, score, Streak, Game and proof models;
- worker/projection/database and web authority boundaries;
- actual registered Series and measured supported source chains;
- current scripts/checks and dated operational evidence;
- user-owned dirty/untracked files that must be preserved.

Do not confuse these categories:
- desired product behavior from canonical documentation;
- behavior currently implemented in source;
- runtime behavior directly verified now;
- dated evidence from archived runs;
- inference;
- blocked/unknown state.

Your response must contain:
1. Repository truth and dirty-state preservation record.
2. The completed document reconciliation table from the prompt pack.
3. Settled decisions and exact conflicts resolved by the 2026-09-04 rebaseline, including which
   current presentation must be retired, reshaped or may be retained.
4. Complete route/feature inventory, including header, account, onboarding, overlays, AI Guide,
   Games, Cards/share, Streak, League, Record, social, Activity, Settings, proof and advanced gates.
5. Current-versus-target gap map. Label every item working, partial, placeholder, absent, blocked or
   excluded and identify its data authority.
6. A dependency-aware implementation plan made of vertical user loops, not page-count milestones.
   The first loop must be one real question -> choice -> free points -> accepted personal Card ->
   waiting -> canonical result -> score/Streak -> explicit share, with proof context-linked beneath.
7. Module/folder and shared-state plan showing the one Market truth model, event-family presentation
   metadata/renderers, composer, Card lifecycle, route registry, overlay coordinator, error contract
   and server/client boundaries.
8. Reference behavior map for the first slice: Exact, Adapted, Additive, Blocked or Excluded, with
   source paths and reasons.
9. State, responsive, theme, accessibility and failure/recovery acceptance plan.
10. Focused correctness/build/browser checks. Tests support implementation; do not create a separate
    testing deliverable or broad snapshot project.
11. External actions that remain owner-gated.
12. The exact first dependency-complete slice you recommend after approval.

Do not ask Abu questions already answered by the corpus. Stop after the plan. Ask only for approval
to implement, or for a genuinely unresolved decision that would materially change the result.
```

## 4. Prompt 2 — Primary agent: implement the approved plan

```text
Work in /Users/abu/dev/hackathon/proof-league as the only writing agent.

The live-event direction and the approved implementation plan are settled. Implement the next
dependency-complete vertical slice. Do not restart product ideation, reduce the scope to a visual
reskin, continue polishing the rejected dashboard, or begin with a decorative Games/Event grid.

Before editing, read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md and
/Users/abu/dev/hackathon/proof-league/FIDELITY-IMPLEMENTATION-HANDOFF.md completely. Re-read the
canonical files governing this slice. Inspect git status/recent commits and preserve every
user-owned change. Re-open the corresponding PIPS, Flicky, Yosuku, Somnia/Masayume and/or ZK
Freighter behavior at the documented pins/current safe working tree. Do not copy reference code or
assets.

Implement by user loop and real data authority:
- the Event question, timing and family-specific prediction instrument lead;
- public discovery uses Event tiles/posters and Event Stages, never “Market Card”;
- one points composer owns Market, Reels, Games, Guide and shared-Call entry;
- authentication returns to the exact draft;
- accepted Pick visibly creates the private personal Card immediately;
- the same Card retains event-family identity through waiting, family-specific reveal, scoring,
  Streak and share states;
- Games reuse canonical Markets/Picks/Cards;
- proof remains complete but progressively disclosed and linked back to the exact Market/Card;
- chain/projection truth is the only source for result, score, Streak and rank.

The existing palette, generic dark containers, proof ticker, universal question/percentage rows and
generic 4:5 receipt are rejected. Start from interaction and black-and-white hierarchy. Yield Signal,
Block Draw and Pool Race must be recognizable as different event instruments without labels before
palette is applied. Pick distribution is secondary crowd context and never odds, price or probability.

Micro-fidelity is acceptance behavior. Implement every applicable item from
FULL-REFERENCE-UX-INVENTORY-2026-09-03.md, including header/menu closure, complete mobile More,
first-run/return intent, focus restoration, one-overlay handoff, loading/empty/thin/stale/error/
unknown states, Game settings, Guide no-provider/refusal behavior, share fallbacks, reduced motion,
theme switching and safe-area behavior. Do not postpone a state merely because the default desktop
screen looks correct.

Architecture constraints:
- preserve chain, worker, projection and web write boundaries;
- no alternate truth/scoring/signing path;
- keep route handlers thin and secret-bearing modules server-only;
- reuse typed domain models, Result/error variants and named feature-owned constants;
- obey documented import and file-size laws;
- no fake data, optimistic settlement, fake progress or fixture-success UI;
- a missing dependency gets an honest named unavailable state;
- retain draft/idempotency through refusal, retry and confirmation unknown;
- critical status is persistent in context, never toast-only.

Do not create AGENT.md/AGENTS.md/CLAUDE.md/CLOUD.md. Do not deploy, provision, publish, submit, send live
transactions, commit or push without a separate explicit instruction from Abu.

Verification must match the changed risk:
- run the repository's relevant check/build commands;
- use the smallest focused contract/signing/security check needed;
- inspect the real browser flow at 1440x1000, 1024x768, 390x844 and 360x800 in both themes where the
  slice is visible;
- exercise normal, loading, empty, stale, refusal, retry, confirmation-unknown and terminal states
  that can be reached honestly;
- separate runtime-confirmed evidence from static inspection, inference and blockers.

Continue while a safe in-scope implementation step remains. At handoff report:
1. Working user outcome and routes.
2. Exact files and architecture seams changed.
3. Reference behaviors preserved/adapted and why.
4. States and viewports actually exercised.
5. Commands/checks actually run and results.
6. Runtime-confirmed versus static/inferred claims.
7. Remaining dependencies/blockers without silently dropping scope.
8. Branch/worktree, local URL and server status.

Do not call the rebaseline complete until the real question-to-Card-to-result-to-Streak-to-share
loop works and the complete UX inventory has an explicit evidence-backed disposition.
```

## 5. Prompt 3 — Read-only UX and reference-fidelity auditor

```text
Audit Proof League's product fidelity in /Users/abu/dev/hackathon/proof-league. This task is
read-only. Do not edit files, implement fixes, alter dependencies, commit, push, deploy or perform
live transactions.

Read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md, the live-event rebaseline, the
compatible game-first rebaseline and the full reference UX inventory completely. Then inspect the
target source/runtime and the relevant
PIPS, Flicky, Yosuku, Somnia/Masayume and ZK Freighter reference routes/components. Use behavior evidence, not
memory or visual mood alone. Do not copy or recommend copying unlicensed source/assets.

Audit the complete experience:
- product comprehension and live-event hierarchy;
- desktop header, account state, menus and complete mobile bottom-nav/More;
- first-run, authentication boundary, exact return-to-intent and returning priority;
- one-overlay law, focus, Escape/backdrop, handoff and mobile keyboard/safe area;
- Event Board, family-specific Event Stages, canonical points composer and all action/error states;
- Event tile/Stage versus the one evolving Player-owned Card versus Proof Receipt;
- explicit publication, stable URL, 4:5/OG export and share fallback failures;
- Play hub, resume, Practice, Daily Deck, Yield Signal, real Hosted Draw, Challenge,
  Game settings, achievements/history and explicit Duel/Milestone/arcade blockers;
- Streak/League/Record/public Player truth and non-fabricated thin/unrecorded states;
- League Guide dock/drawer, grounded answers, provider failures and unsigned composer handoff;
- Room, Takes, Calls, alerts, Activity, Settings and recovery isolation;
- progressive proof and exact Market/Card backlinks;
- family-specific silhouette/motion/reveal, shipped themes, reduced motion, sound/haptic support,
  marks/identicons and small interaction states;
- 1440x1000, 1024x768, 390x844 and 360x800 behavior.

For every finding, include severity, exact route/component/path, observed evidence, violated
authority row, user impact and smallest acceptable correction. Distinguish:
- runtime-confirmed defect;
- static-code risk;
- missing implementation;
- honest dependency blocker;
- reference defect that Proof League must not copy;
- approved deviation.

Lead with findings ordered by user-flow impact. Then provide the complete parity scorecard with one
of Exact, Adapted, Additive, Blocked or Excluded for every inventory row. Do not declare fidelity
from a landing-page screenshot or default desktop state. Do not implement fixes in this task.
```

## 6. Prompt 4 — Read-only architecture and data-authority auditor

```text
Audit the architecture and truth boundaries of the Proof League rebaseline in
/Users/abu/dev/hackathon/proof-league. This task is read-only. Do not modify files, dependencies,
contracts, database state, Git state or external services.

Read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md and every mandatory architecture,
PRD, operational-evidence and implementation-truth file listed there. Inspect current contracts,
packages, worker, web routes, database migrations and relevant recent changes. Treat secrets as
opaque; never print them.

Verify these boundaries:
- chain state is the truth writer;
- worker is the sole transaction submitter and class-1 projection writer;
- web only collects authorized signed Picks through the approved intake path;
- projection is rebuildable from chain events and published Pick sets;
- Market state/options/cutoff are canonical across Markets, Reels, Games, Calls and Guide;
- one EIP-712 schema/composer/intake path owns all Pick entry;
- result, score, Streak and rank never render optimistically;
- personal Card identity survives every lifecycle state;
- social, AI, alerts, Game session state and local settings cannot contaminate truth;
- confirmation unknown is durable/idempotent and cannot invite a duplicate write;
- proof receipts retain exact Market/Card context;
- server-only credentials, Privy authorization and provider boundaries are correct;
- Blocked Game/Combo/X/Agent features have named authority/dependency gates rather than client-only
  imitations.

Reconcile current registered Series and measured supported chains. Explicitly flag broad
multi-chain, Pool Race, governance, milestone, Duel or arcade claims not proven by current
registration/code/chain readings.

Return findings first, ordered by correctness/security/user-state impact. Each finding needs exact
file/line evidence, violated AD/FR/inventory rule, failure scenario and required invariant. Then
provide:
1. data-authority table;
2. write-path diagram in compact text;
3. current-versus-required contract/model gaps;
4. safe dependency order for fixes;
5. claims verified at runtime versus static/datestamped/inferred;
6. external owner gates.

Do not implement fixes or expand product scope in this task.
```

## 7. Prompt 5 — Resume after context loss or agent handover

```text
Resume the approved Proof League work in /Users/abu/dev/hackathon/proof-league. Do not restart,
reinterpret or re-ideate the product.

First read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md completely. Then read the
latest previous-agent handoff/plan, project-context.md, the live-event rebaseline, compatible
game-first rebaseline, full UX inventory,
FIDELITY-IMPLEMENTATION-HANDOFF.md, git status, recent commits and every currently changed file.
Re-read the slice-specific architecture/PRD/reference documents before touching code.

Treat existing dirty and untracked work as user-owned. Do not reset, clean, replace or discard it.
Do not recreate AGENTS.md or CLAUDE.md. Do not assume a prior “done” claim is true unless its source
path and runtime evidence still exist.

Reconstruct and report:
1. current branch/HEAD/worktree and server state;
2. latest settled authority;
3. what is runtime-confirmed complete;
4. what is partial, placeholder, absent, blocked, excluded or unverified;
5. changed files and the intent you can prove from diff/context;
6. last completed dependency-complete user loop;
7. next safe in-scope slice from the approved plan;
8. reference evidence and focused verification needed for that slice.

If the next step is already authorized implementation and does not require external action or a new
product/architecture decision, continue with it as the sole writing agent. Stop for Abu only when a
genuine unresolved decision or new authority is required. Deployment, live transactions,
publishing, provisioning, commits and pushes remain separately gated.

At handoff, use the exact evidence/report format in Prompt 2. Never report unchanged work as newly
completed.
```

## 8. Prompt 6 — Independent final acceptance audit

```text
Perform an independent final acceptance audit of the Proof League live-event fidelity rebaseline in
/Users/abu/dev/hackathon/proof-league. This task is read-only unless Abu separately asks you to fix
findings. Do not edit, commit, push, deploy or perform live transactions.

Read /Users/abu/dev/hackathon/proof-league/AI-AGENT-PROMPT-PACK.md, project-context.md, the live-event
rebaseline, compatible game-first rebaseline, the complete UX inventory, architecture/PRD revisions,
Product Flows, Reference Design, epics, current README/operations/evidence and the implementation
handoff. Inspect current repository
truth and re-open the matching reference source. Do not trust prior completion labels without
evidence.

The release claim under review is:
“A person can recognize and understand a real on-chain Event, use its family-specific Stage to make
a Call, commit free points, receive a private personal Card, own its honest wait and reveal, see
canonical score/Streak/rank effects, publish/share deliberately, and inspect the exact proof without
proof obscuring the experience.”

Exercise real reachable behavior at 1440x1000, 1024x768, 390x844 and 360x800 in light and dark.
Inspect signed-out, first-run, return-to-intent, loading, empty, thin, stale, provider-unavailable,
open, locked, awaiting, correct, incorrect, voided, stuck, refusal, retry, confirmation-unknown,
private, publishing, published and share-failure states where honest data or controlled failure
paths permit. Verify keyboard/focus, reduced motion, mobile safe areas, no horizontal overflow,
one-overlay handoffs and live theme changes after primitives mount.

Audit every row in FULL-REFERENCE-UX-INVENTORY-2026-09-03.md. A Blocked row passes only when the
dependency and user-facing promise are honest. An absent Exact/Adapted/Additive row fails. A build,
test suite, attractive landing page or populated fixture is not substitute evidence.

Return:
1. findings first, ordered by severity, with exact path/route/state evidence;
2. end-to-end core-loop verdict;
3. complete parity-ledger verdict;
4. architecture/truth-boundary verdict;
5. responsive/theme/accessibility verdict;
6. real catalogue/network claim audit;
7. runtime-confirmed versus static/inferred/blocked matrix;
8. remaining external gates;
9. final verdict: accepted, accepted with named blockers, or not accepted.

Do not implement corrections in this audit.
```

## 9. Current unresolved decisions agents must not invent

- Whether non-event arcade is outside Proof League, a clearly separated local practice/brand
  surface, or part of a broader Games definition with a new integrity model.
- Whether a true Duel has new session/matchmaking/commit-reveal authority or remains an independent
  Pick comparison under another name.
- Which additional Series/event families are admitted after the current Lido Series and Hosted
  Round capability.
- Final reference asset/license permission beyond behavior study.
- Any external deployment, production credential, funding, publishing or submission action not
  explicitly authorized in the active task.

Agents must preserve these as blockers. They may investigate and present evidence, but may not pick
an answer by silently changing scope.

## 10. What a good agent handoff contains

Every implementation handoff must be end-state evidence, not a diary:

- caller-supplied goal and exact approved slice;
- current repository/worktree identity and dirty-state preservation;
- working visible outcome and routes;
- exact changed files and architecture seams;
- reference behavior preserved/adapted with reasons;
- commands, browser states, viewports and themes actually checked;
- runtime-confirmed facts separated from static inspection, inference and blocked dependencies;
- remaining risks and the next dependency-complete slice from the approved plan;
- local URL and server status;
- explicit statement that no external action, commit or push occurred unless it truly did.

Never write “done” when the evidence path or working runtime flow does not exist.
