"use client";

import { useCallback, useEffect, useState } from "react";
import { MIN_STAKE, cardSerialOf } from "@proof-league/shared";
import { useSigningProvider } from "../../features/auth/adapter.js";
import { COMPOSER_FAILURE_COPY, type ComposerFailure } from "../../features/picks/errors.js";
import {
  DRAFT_PROBLEM_COPY,
  couldHaveReachedIntake,
  furthestPhase,
  reviewSummary,
  validateDraft,
  type ComposerPhase,
  type Draft,
} from "../../features/picks/pick-submit-flow.js";
import { fetchIntakeState, submitPick, type SignedPickBody } from "../../features/picks/service.js";
import type { ComposerAvailability } from "../../features/picks/availability.js";
import type { IntakeState, Refusal } from "../../features/picks/schema.js";
import { PredictionCard } from "../record/prediction-card.js";
import { ComposerDraft } from "./composer-draft.js";

// THE points composer (rebaseline section 7, FR-8). Every surface that lets a player make
// a Pick opens this component: the Market page, Reels, and later Games and a shared Call.
// One composer is not a tidiness preference, it is the integrity model: a second one is a
// second answer to what a Pick costs, when it closes and what the signature covers.
//
// It computes no rules of its own. The next nonce, the running day total and what is left
// of the allowance all come from intake, derived there by the same shared functions that
// will judge the Pick, so this cannot draft something the door would refuse. The signature
// comes from the one signing seam. Openness is decided by the server that rendered the
// page and, authoritatively, by intake itself.

export type ComposerMarket = {
  readonly marketId: string;
  readonly question: string;
  readonly sourceLine: string;
  readonly options: readonly { readonly index: number; readonly label: string }[];
  readonly lockTimeSec: number;
  readonly expectedSettlementSec: number;
};

const BOX = "border border-rule bg-surface p-5";
const LABEL = "font-data text-[11px] uppercase tracking-widest text-ink-muted";
const ACTION =
  "min-h-11 bg-brand px-5 py-2.5 font-display text-sm font-bold text-white hover:bg-brand-deep disabled:opacity-50";
const QUIET = "min-h-11 border border-rule px-4 py-2 font-data text-[11px] uppercase tracking-widest hover:border-ink";

/// One persistent block for every non-success outcome (PRODUCT-FLOWS section 16). It stays
/// in the action slot, states the effect on points, and always ends in a next action. A
/// toast could do none of those things, which is why none of this is a toast.
function Persistent({
  headline,
  detail,
  next,
  unknown,
}: {
  headline: string;
  detail?: string;
  next: string;
  unknown?: boolean;
}) {
  return (
    <div
      role="status"
      className={`mt-4 border-l-2 ${unknown === true ? "border-waiting" : "border-ink"} bg-surface-strong p-4`}
    >
      <p className="font-display text-sm font-bold">{headline}</p>
      {detail === undefined ? null : <p className="mt-1 font-body text-sm text-ink-muted">{detail}</p>}
      <p className="mt-2 font-body text-sm text-ink-muted">{next}</p>
      <p className={`mt-2 ${LABEL}`}>Your points are untouched</p>
    </div>
  );
}

export function PointsComposer({ market, availability }: { market: ComposerMarket; availability: ComposerAvailability }) {
  const provider = useSigningProvider();
  const [draft, setDraft] = useState<Draft>({ optionIndex: undefined, stake: MIN_STAKE });
  const [phase, setPhase] = useState<ComposerPhase>("idle");
  const [reached, setReached] = useState<ComposerPhase>("idle");
  const [intake, setIntake] = useState<IntakeState | undefined>(undefined);
  const [intakeProblem, setIntakeProblem] = useState<string | undefined>(undefined);
  /// The exact bytes of the last submission. A retry resends THESE, same nonce and all:
  /// the nonce is the idempotency key, so a retry that re-signed with a fresh one would
  /// turn one uncertain Pick into two real ones.
  const [attempt, setAttempt] = useState<SignedPickBody | undefined>(undefined);
  const [failure, setFailure] = useState<ComposerFailure | undefined>(undefined);
  const [refusal, setRefusal] = useState<Refusal | undefined>(undefined);
  const [card, setCard] = useState<
    { readonly nonce: number; readonly receivedAtSec: number; readonly stake: number; readonly optionIndex: number } | undefined
  >(undefined);

  const address = provider.kind === "connected" ? provider.address : undefined;

  const goto = useCallback((next: ComposerPhase): void => {
    setPhase(next);
    setReached((held) => furthestPhase(held, next));
  }, []);

  useEffect(() => {
    if (address === undefined) return;
    let alive = true;
    void fetchIntakeState(address, market.marketId).then((result) => {
      if (!alive) return;
      if (result.kind === "ready") {
        setIntake(result.state);
        setIntakeProblem(undefined);
      } else setIntakeProblem(result.message);
    });
    return () => {
      alive = false;
    };
  }, [address, market.marketId]);

  const send = useCallback(
    async (body: SignedPickBody): Promise<void> => {
      setFailure(undefined);
      setRefusal(undefined);
      goto("submitting");
      const outcome = await submitPick(body);
      if (outcome.kind === "accepted") {
        setCard({
          nonce: outcome.accepted.nonce,
          receivedAtSec: outcome.accepted.receivedAtSec,
          stake: body.stake,
          optionIndex: body.optionIndex,
        });
        goto("accepted");
        return;
      }
      if (outcome.kind === "refused") setRefusal(outcome.refusal);
      else setFailure(outcome.failure);
      goto("reviewing");
    },
    [goto],
  );

  const sign = useCallback(async (): Promise<void> => {
    if (provider.kind !== "connected" || intake === undefined) return;
    const valid = validateDraft(draft, intake.remaining);
    if (!valid.ok) return;
    setFailure(undefined);
    setRefusal(undefined);
    goto("signing");
    const signature = await provider.signPick(
      { chainId: intake.domain.chainId, verifyingContract: intake.domain.verifyingContract as `0x${string}` },
      {
        player: provider.address,
        marketId: BigInt(market.marketId),
        optionIndex: valid.value.optionIndex,
        stake: valid.value.stake,
        nonce: intake.nextNonce,
        utcDay: intake.utcDay,
        stakedSoFarInDay: intake.stakedSoFarInDay,
      },
    );
    if (!signature.ok) {
      setFailure(signature.error === "declined" ? "signature-declined" : "signature-failed");
      goto("reviewing");
      return;
    }
    const body: SignedPickBody = {
      player: provider.address,
      marketId: market.marketId,
      optionIndex: valid.value.optionIndex,
      stake: valid.value.stake,
      nonce: intake.nextNonce,
      utcDay: intake.utcDay,
      stakedSoFarInDay: intake.stakedSoFarInDay,
      signature: signature.value,
    };
    setAttempt(body);
    await send(body);
  }, [draft, goto, intake, market.marketId, provider, send]);

  if (card !== undefined) {
    return (
      <div>
        <p className={LABEL}>Your Card</p>
        <div className="mt-3 max-w-sm">
          <PredictionCard
            view={{
              marketId: market.marketId,
              serial: cardSerialOf(market.marketId, card.nonce),
              player: address ?? "",
              question: market.question,
              sourceLine: market.sourceLine,
              choiceLabel: market.options[card.optionIndex]?.label ?? `Option ${card.optionIndex + 1}`,
              stake: card.stake,
              returnIfCorrect: card.stake * market.options.length,
              createdAtSec: card.receivedAtSec,
              lockTimeSec: market.lockTimeSec,
              // A Pick just accepted on an open Market is private by definition: nothing is
              // published until the player asks for it. Record derives stages properly once
              // Cards outlive the page that made them.
              stage: { kind: "private" },
            }}
          />
        </div>
      </div>
    );
  }

  if (availability.kind === "closed") {
    return (
      <div className={BOX}>
        <p className={LABEL}>This Market</p>
        <p className="mt-3 font-display text-base font-bold">{availability.headline}</p>
        <p className="mt-2 font-body text-sm text-ink-muted">{availability.detail}</p>
      </div>
    );
  }

  const problem = intake === undefined ? undefined : validateDraft(draft, intake.remaining);
  const summary =
    problem?.ok === true && intake !== undefined
      ? reviewSummary(problem.value, market.options.length, intake.remaining)
      : undefined;
  const busy = phase === "signing" || phase === "submitting";
  const failureCopy = failure === undefined ? undefined : COMPOSER_FAILURE_COPY[failure];

  return (
    <div className={BOX}>
      <p className={LABEL}>Make your call</p>

      <ComposerDraft
        options={market.options}
        draft={draft}
        onDraft={(next) => {
          setDraft(next);
          goto("editing");
        }}
        remaining={intake?.remaining}
        lockTimeSec={market.lockTimeSec}
        expectedSettlementSec={market.expectedSettlementSec}
        summary={summary}
      />

      {provider.kind === "unconfigured" ? (
        <Persistent
          headline={COMPOSER_FAILURE_COPY["no-signer"].headline}
          detail={provider.gate}
          next={COMPOSER_FAILURE_COPY["no-signer"].nextAction}
        />
      ) : null}

      {intakeProblem === undefined ? null : (
        <Persistent
          headline="Picks cannot be taken right now."
          detail={intakeProblem}
          next="Try again shortly. Nothing was submitted."
        />
      )}

      {refusal === undefined ? null : <Persistent headline={refusal.message} next={refusal.nextAction} />}

      {failureCopy === undefined ? null : (
        <Persistent
          unknown={failureCopy.kind === "unknown"}
          headline={failureCopy.headline}
          // The stalled headline names the phase actually reached rather than assuming the
          // worst or the best (CONVENTIONS section 5).
          detail={
            couldHaveReachedIntake(reached)
              ? "Your signature was made and the Pick was sent."
              : "Nothing was sent, so there is nothing to undo."
          }
          next={failureCopy.nextAction}
        />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {provider.kind === "available" ? (
          <button type="button" className={ACTION} onClick={() => void provider.connect()}>
            Connect a {provider.label}
          </button>
        ) : null}
        {provider.kind === "connected" ? (
          <button type="button" className={ACTION} disabled={problem?.ok !== true || busy} onClick={() => void sign()}>
            {phase === "signing" ? "Waiting for your signature" : phase === "submitting" ? "Sending your Pick" : "Sign this Pick"}
          </button>
        ) : null}
        {failureCopy !== undefined && attempt !== undefined && failureCopy.kind !== "refusal" ? (
          // Safe to press twice: the route answers an identical resend with the Pick it
          // already holds rather than a second one, which is what makes this the right
          // action even when the first attempt's fate is unknown.
          <button type="button" className={QUIET} disabled={busy} onClick={() => void send(attempt)}>
            {failureCopy.kind === "unknown" ? "Resend the same Pick" : "Retry"}
          </button>
        ) : null}
        {problem !== undefined && !problem.ok ? (
          <span className="font-body text-xs text-ink-muted">{DRAFT_PROBLEM_COPY[problem.error]}</span>
        ) : null}
      </div>

      {provider.kind === "connected" ? (
        <p className="mt-3 font-body text-xs text-ink-muted">
          You are signing one message: this Market, this option, these points, for today. It moves no
          funds and it authorises nothing else. Signed as {provider.address.slice(0, 6)}...
          {provider.address.slice(-4)} with a {provider.label}.
        </p>
      ) : null}
    </div>
  );
}
