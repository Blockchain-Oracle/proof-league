---
name: 'Proof League — Product Flows and State Matrix'
status: final
created: 2026-09-02
supersedes_on_conflict:
  - './EXPERIENCE.md'
  - './EXPERIENCE-ADDENDUM.md'
design: './REFERENCE-DESIGN.md'
---

# Proof League — Product Flows and State Matrix

## 1. Navigation and route intent

| Surface | Public | Signed-in addition | Primary exit |
|---|---|---|---|
| Landing `/` | Featured/live/settled evidence, proof explanation | Continue to relevant own state | Markets / shared intent |
| Markets `/markets` | Featured, Today, Upcoming, Settled | own Pick state, allowance | Market / Reels |
| Reels `/reels` | read/browse real Markets | canonical Pick action | Market / next Reel |
| Social `/social` | real Takes/Open Calls attached to Markets | publish Take, follow/alert controls | Market / Call / Reels |
| Market `/market/[id]` | full question/source/distribution/proof/Room read | Pick, Room post, share, Challenge | Call / Record / next Market |
| Create `/create` | benefit + examples | Challenge builder | Challenge route |
| League `/league` | full real ranking | sticky current-user row | Player / Market |
| Record `/record` | sign-in value state | complete Cards/points/operations | Call / proof / activity |
| Player Edge `/record/edge` | sign-in value state | complete sample-aware performance report | Record / Market |
| Combo `/combo` | explainer and real eligible legs | build, confirm and track multi-Pick Combo | Market / Record |
| Playbooks `/playbooks` | discover published rules and labeled results | draft/simulate/subscribe within grant | Agent / Market |
| Agents `/agents` | complete live-performance comparison | create/activate/revoke runner | Playbook / Activity |
| Pick from X `/trade-from-x` | capability and safety explanation | link, review/revoke grant, receipt history | Market / Activity |
| Proof Surface `/surface` | real source/Series/pipeline analytics | own-context shortcuts | Market / proof / status |
| Player `/player/[address]` | uncurated public history/challenges | own shortcuts if same address | Call / Challenge |
| Call `/call/[shareId]` | Open Call or Settled Record | Make my own Pick / share | Market / Record |
| Challenge `/challenge/[id]` | challenge context + Market | join with fresh Pick | Market / Room |
| Activity `/activity` | sign-in value state | operation timeline | affected Market/Card |
| Settings `/settings` | sign-in value state | theme/session/profile/recovery status | previous route |
| Proof `/proof/[id]` | decoded result/checks/links | own Card context | Market / Record |
| How proof works | full public explanation/log | none required | Markets / proof |

## 2. First-run state machine

```text
PUBLIC_READING
  -> PLAY_INTENT
     -> tutorial version already seen? AUTH
     -> PRIMER_PRODUCT -> PRIMER_LIFECYCLE -> PRIMER_AUTHORITY -> PRIMER_RECORD
        -> PRESENTATION_CHOICE -> AUTH
AUTH
  -> cancelled: return to exact intent with draft retained
  -> provisioning: real status + elapsed copy
  -> failed-before-account: persistent refusal + Retry
  -> unknown: amber confirmation-unknown + Check account
  -> success: return to exact route/draft
FIRST_COMPOSER
  -> inline allowance/return/wait teaching
  -> signed Pick report
  -> OPEN_CALL_CARD
RETURNING
  -> draft in progress
  -> else own awaiting Pick
  -> else newest unseen settled result
  -> else Markets
```

Primer screens are not a forced landing interstitial. They appear at first action intent, are skippable, and never repeat until `TUTORIAL_VERSION` changes. The five jobs are: what Proof League is; how an admitted Market becomes a proof-backed result; what the embedded wallet/user signs; what is public/permanent/recoverable; and a plain/full presentation preference. The final screen ends on Privy sign-in and the exact initiating intent.

## 3. Canonical Pick and public-call flow

1. Select option.
2. Select points (preset or accessible input).
3. Composer displays remaining allowance, gross return if correct, intake cutoff and expected settlement.
4. Submit produces a report:
   - `not_started`: persistent error; draft retained; retry.
   - `submit_reached_unknown`: amber context; check Record before retry; request id shown.
   - `accepted`: Card/Open Call appears with pending state.
5. Publishing is separate and explicit. The user reviews the public fields and taps Publish.
6. Share sheet distinguishes:
   - durable public link created;
   - native share completed/cancelled/unsupported;
   - PNG downloaded;
   - link copied;
   - X intent opened.
7. Copy recipient always reviews a new draft and signs their own Pick.

## 4. Market lifecycle state matrix

| State | Board | Market detail | Own Card/Call | Available actions |
|---|---|---|---|---|
| Loading | geometry-matched rows | geometry-matched hero/ticket/proof | skeleton card | none; no fake data |
| Open | lock time + distribution | full composer + Room | OPEN/PENDING | Pick, edit/cancel before intake cutoff, publish, Challenge |
| Locked | expected event/settlement | composer replaced by watch state | OPEN/LOCKED | share/view Room; no copy-Pick after cutoff |
| Committed | commitment id/time | commitment proof link | COMMITTED | watch/share |
| Awaiting attestation | phase + elapsed/usual | full lifecycle, “you can close this” | AWAITING | share/view activity |
| Proof submitted/confirmation unknown | amber phase + tx hash if known | explicit “may have reached chain” | same | view tx, retry only when safe |
| Proof verified, scoring pending | verified Market, scoring note | outcome/proof plus own scoring state | VERIFYING SCORE | view proof; no payout celebration yet |
| Scored correct | settled state | proof + score | SETTLED RECORD / correct | share, next Market |
| Scored incorrect | settled state | proof + zero | SETTLED RECORD / ash | share, next Market |
| Voided | void reason + returned points | deadline/source evidence | VOIDED | next Market/share record |
| Stuck | persistent stuck reason/elapsed | proof/activity details, no manual resolution | STUCK | leave safely, view status |
| Error/stale read | last-updated + retry | local persistent recovery | last confirmed state | retry/refresh; never overwrite truth |

## 5. Market Room flow

- Public reader sees messages, pagination, loading/empty/error states and the off-chain disclaimer.
- Signed-in non-player sees “Make a Pick to join this room” with the Market composer action.
- Eligible player sees composer, character count and posting identity.
- A successful post appears only after durable server acknowledgement.
- Known rejection (ineligible, rate-limited, invalid signature) is persistent in the composer with a next action.
- Unknown acknowledgement keeps the draft and shows the request id; duplicate resend uses an idempotency key.
- A report action opens one-level sheet/dialog, records a reason code and confirms locally without deleting truth.
- Room outage collapses to an unavailable panel; Market, composer and proof remain functional.

## 6. Challenge flow

1. Create explains the v1 boundary: choose an existing admitted Market; no custom result/source.
2. User selects Market, short title and prompt.
3. Preview shows public route, lock/settlement facts and Room context.
4. Publish creates the durable Challenge and then opens the share sheet.
5. Recipient sees creator, prompt, immutable Market truth and “Make my own Pick”.
6. Locked Challenge routes to watch/settled state; expired unjoined Challenge still resolves to its historical Market.
7. Owner can unlist the wrapper. Picks/Cards/comments remain under their own retention/moderation laws.

## 7. Reels flow

- Initial load uses the same Market query/view model as Markets with a Reels presentation adapter.
- One real Market is active at a time; next/previous preserves a bounded cursor.
- Primary action opens/inlines the canonical composer. Room/share/detail are secondary controls.
- At end: “You’re caught up” plus Today/Upcoming routes. No fabricated cycling.
- Leaving and returning restores the cursor for the session; a lifecycle change refreshes the active view without resetting position.
- Keyboard arrows/PageUp/PageDown, swipe/wheel threshold and visible controls all work; reduced motion removes animated transitions.

## 8. League and Record states

### League

- Loading: table geometry and current-user-bar placeholder.
- Thin field: render the real field and explanatory copy; no seeded rows.
- Unranked own state: sticky row with next action.
- Ranked: Season Points, Streak, movement and deterministic tie-break detail.
- Stale/error: retain last confirmed timestamp and retry; do not zero ranks.

### Record

- Signed out: explain permanent proof-backed history; sign-in action.
- Zero Cards: one structural empty state and first-Market action.
- Open/awaiting only: Cards remain useful; show next lifecycle time.
- Mixed settled history: filters for All/Open/Settled, never hide incorrect Cards by default.
- Activity link exposes operation reports and confirmation-unknown states.

## 9. Settings and recovery

- Theme: system/light/dark with current source and immediate preview.
- Identity: generated handle and canonical address; copy action; no editable bio/avatar in v1.
- Session: sign out with effect explained; returning sign-in rehydrates from server/chain.
- Recovery: show Privy/provider recovery availability and link/action; never claim Proof League can recover or export keys unless the provider flow proves it.
- Install: show installed/available/unavailable state; dismissible and non-blocking.
- Before Story 7.3, notification capability is descriptive with no dead toggle. After Story 7.3, only verified/supported channels expose controls, including consent version, channel verification, quiet hours, per-event preferences, delivery status and unsubscribe.

## 10. League Guide flow

```text
closed dock
  -> three capped contextual invitations, or open from Market / More / `?guide=1`
  -> typed context loading | live | stale | unavailable
  -> starter prompt or user question
  -> answering | refused | provider unavailable/rate-limited
  -> explanation + sources-known/missing + optional follow-up chips
  -> optional unsigned Pick draft
  -> canonical composer review and ordinary EIP-712 flow
```

- The dock shows real current Market/proof timing even when the model provider is not configured.
- The dock appears above mobile navigation. Its first teaser waits 3.5 s, holds 4.8 s, waits 4.5 s and runs no more than three times; open/dismiss/reduced-motion state suppresses it.
- Desktop hover/focus reveals its name; the compact phone control remains an owned Proof League mark inside the lifecycle ring, never a letter-avatar “AI” circle.
- A response labels unavailable data and may say “sit this one out”. It never claims a Pick/tx/score/proof succeeded.
- A proposed option/points control says “Review in composer”; it never uses “Place” or bypasses the normal confirmation.
- Starter chips exist only before the first question; follow-up chips appear only after a valid answer. Loading/failure/refusal never exposes recommendation cards. Valid action cards are dismissible and close the drawer as they hand the intent to the canonical composer.
- Clearing closes the local conversation. No persistent personal memory claim exists.
- Drawer scrim, focus containment, Escape/close, focus return, background inertness, small-screen full-height behavior and reduced motion are required.

## 11. Player Edge and Proof Surface

### Player Edge

- Signed out: explain that the report uses the complete proof-backed record; sign in.
- Reading: geometry-matched skeleton with sample/completeness placeholder.
- Thin: show the real sample and the threshold required before naming a best/worst segment.
- Complete: overall sample plus Series/source/horizon breakdowns, hit/miss/void/stuck, points committed, score yield and run distribution.
- Partial/stale: keep the last complete values, timestamp and missing/capped range; never silently recompute from visible rows only.
- Every segment links to the filtered Cards that support it.

### Proof Surface

- Filters change source chain, contract/event, Series, horizon and lifecycle without changing the metric definitions.
- Each metric card names window, sample, source, updated time and completeness.
- Unsupported probability/volatility/liquidity concepts are absent, not empty decorative charts.
- Status/error deep links explain affected pipeline dependencies.

## 12. Takes, Calls feed and alerts

- `/social` and Reels render only real listed Takes/Open Calls with the source Market visible.
- Posting: authenticated author, Market selection/context, body limit, public-field preview, signature, durable acknowledgement. Known refusal stays in composer; unknown retains draft/idempotency id.
- Report/unlist affects discovery/moderation only; it never deletes Cards, Picks or Market truth.
- Alert setup starts from a real Market/Call/Challenge/creator event, requests permission only after user intent, verifies supported channel and shows quiet hours/event controls before saving.
- Delivery opens the canonical current state. Permission denied, unsubscribed, expired endpoint, provider rejection and delivery unknown are distinct.
- Feed/alert outage leaves Markets, Reels market cards, Pick, proof, Record and Activity usable.

## 13. Combo flow

```text
eligible Market leg picker
  -> 2..COMBO_MAX_LEGS unique admitted legs
  -> points + explicit void policy
  -> quote: earliest cutoff, combined multiplier, capped return
  -> review immutable ordered legs
  -> EIP-712 confirm
  -> submitted | confirmation unknown | accepted
  -> per-leg open/locked/verified/voided/stuck
  -> complete correct | complete incorrect | voided | stuck
  -> Combo Card / receipt / next action
```

- A locked/duplicate/unavailable/unsupported leg blocks confirmation with the exact leg and reason.
- If a quote or earliest cutoff changes, the review invalidates and requires reconfirmation.
- Partial settlement keeps per-leg truth, tx/commit ids and safe permissionless continuation; it never labels the whole Combo won/lost early.
- Mobile uses a leg stack plus review sheet above persistent navigation; desktop uses leg browser and sticky Combo slip.

## 14. Pick from X and Playbook authority

### Pick from X

```text
unlinked -> linking -> linked/no grant -> grant review -> authorized
  -> mention received -> parsed | ambiguous/refused
  -> fresh policy/Market/allowance/cutoff checks
  -> submitted -> accepted | confirmation unknown | failed
  -> receipt -> revoke/expire/renew
```

- No grant: the reply/deep link opens an ordinary prefilled composer draft.
- Grant review spells out executor, beneficiary, action kind, allowed scope, per-Pick/day points, expiry and revocation. No “unlimited” preset.
- Ambiguity never guesses. A receipt shows the original instruction id and why no Pick was made.
- Revocation is reachable from this surface, Settings and every active-grant receipt.

### Playbooks and Agents

- Discover → inspect readable immutable version → labeled historical simulation → create draft/alert → optionally review Action Grant → activate.
- Simulation and live performance never share an unlabeled chart/number.
- Runner paused/unavailable, grant expired/revoked, Market out of scope and confirmation unknown remain durable Agent states.
- An Agent result links Playbook version, grant and every resulting Pick/tx/score receipt. Misses and inactivity remain visible.

## 15. Proof Reveal

Keep the evidence-first sequence, restyled:

1. Market label advances to PROOF VERIFIED.
2. Decoded answer and derivation appear.
3. Seven checks appear from the canonical list.
4. Own Pick score is confirmed; Card becomes Settled Record.
5. Streak/rank changes animate only when their canonical event is present.
6. Proof links and Share action settle into the final composition.

At most one reveal plays per visit/batch. All other updates render directly. Reduced motion renders the complete final state immediately.

## 16. Error contract

Every interactive slot implements the same hierarchy:

- **Known refusal/failure:** persistent high-contrast context with reason, effect on points/data and next action.
- **Retryable:** original draft retained; Retry is adjacent; repeated submission uses idempotency.
- **Confirmation unknown:** amber context, durable/request/tx id, “check Activity/Record” and safe retry rule.
- **Success:** shown in the originating slot with durable id/state. Toast may echo it but cannot be the only feedback.

Raw provider errors are mapped to typed unions; unrecognized details are preserved behind a short ref code.

Delegated flows add one rule: an expired/revoked/out-of-scope grant is a known refusal, while a submitted intent without terminal chain evidence is confirmation-unknown. The interface never invites blind resubmission that could duplicate a Pick.

## 17. Responsive acceptance matrix

Every primary route is reviewed at:

- 1440×1000: desktop full nav and two-column detail.
- 1024×768: compact desktop/tablet without clipped ticket/proof.
- 390×844: mobile bottom nav, safe-area, full primary jobs.
- 360×800: no horizontal overflow; all actions and proof content reachable.

The implementation browser pass covers keyboard-only, 200% zoom, reduced motion, light/dark, signed out, first run, returning, zero data, loading, error, stale, open, awaiting, settled and voided/stuck where relevant. Inspect live theme toggling after charts/SVG/canvas primitives mount; a clean reload alone is not sufficient color evidence. This is targeted acceptance observation, not a separately delivered UI automation suite.

## 18. Contextual overlays, logos and identity

### Recognizable marks

1. Market, ticket, Reels, Card, Guide context and filters resolve a canonical visual key from real source metadata.
2. Known keys render their approved local mark: Bitcoin for BTC, Ethereum for ETH/Ethereum, Creditcoin/Attestcoin for proof infrastructure and X for X-origin/share actions.
3. The visible mark is paired with symbol/name when comprehension needs it; icon-only controls retain `aria-label`, focus treatment and a supplementary tooltip.
4. Player avatars resolve to a deterministic address identicon or approved uploaded image. Missing identity never becomes initials in a decorative circle or an invented portrait.
5. An unknown asset/provider renders the neutral category glyph plus full name and records the missing registry key for implementation follow-up.

### Overlay state flow

```text
IDLE
  -> TOOLTIP (non-blocking; hover/focus only)
  -> TEASER/POPOVER (anchored; dismiss/cap/session memory)
  -> BLOCKING_OVERLAY (one of onboarding | auth | Guide | share | report | composer review)
       -> close/cancel: return focus + preserve originating intent
       -> handoff: close current -> open next with validated context
       -> failure: persistent state in current surface; no toast-only escape
```

- Never stack onboarding over auth, Guide over the composer, or share/report sheets over each other.
- Browser back/Escape closes only the top safe overlay and never discards a signed/unknown operation without explicit recovery copy.
- Teasers never cover the primary action, countdown, bottom navigation or persistent error. On phone they anchor above safe-area navigation.
- Toast limit is one and every toast corresponds to a durable in-surface state or non-critical note.
