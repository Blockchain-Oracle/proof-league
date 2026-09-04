"use client";

import { useCallback, useEffect, useState } from "react";
import { useSigningProvider, type SigningProvider } from "../auth/adapter.js";
import { COMPOSER_FAILURE_COPY, type ComposerFailure, type FailureCopy } from "./errors.js";
import { couldHaveReachedIntake, furthestPhase, validateDraft, type ComposerPhase, type Draft, type DraftProblem } from "./pick-submit-flow.js";
import { fetchIntakeState, submitPick, type SignedPickBody } from "./service.js";
import type { IntakeState, Refusal } from "./schema.js";

// THE points composer, as a hook (rebaseline section 7, FR-8). Every surface that lets a
// player make a Call drives this one hook: the table's gauge, the spot and LOCK IT IN are
// its controls, and later a shared Challenge is too. One composer is not a tidiness
// preference, it is the integrity model: a second one is a second answer to what a Call
// costs, when it closes and what the signature covers.
//
// It computes no rules of its own. The next nonce, the running day total and what is left
// of the allowance come from intake, derived there by the same shared functions that will
// judge the Call, so this cannot draft something the door would refuse. The signature comes
// from the one signing seam. Openness is decided by the page that rendered the card and,
// authoritatively, by intake itself.

export type ComposerMarket = {
  readonly marketId: string;
  readonly optionCount: number;
};

export type AcceptedCall = {
  readonly nonce: number;
  readonly receivedAtSec: number;
  readonly stake: number;
  readonly optionIndex: number;
};

export type PickComposer = {
  readonly provider: SigningProvider;
  readonly draft: Draft;
  readonly setOption: (optionIndex: number | undefined) => void;
  readonly setStake: (stake: number) => void;
  readonly phase: ComposerPhase;
  readonly intake: IntakeState | undefined;
  readonly intakeProblem: string | undefined;
  readonly problem: DraftProblem | undefined;
  readonly failure: FailureCopy | undefined;
  readonly refusal: Refusal | undefined;
  readonly accepted: AcceptedCall | undefined;
  readonly couldHaveReached: boolean;
  readonly busy: boolean;
  readonly canResend: boolean;
  readonly sign: () => Promise<void>;
  readonly resend: () => Promise<void>;
  readonly reset: () => void;
};

export const usePickComposer = (market: ComposerMarket): PickComposer => {
  const provider = useSigningProvider();
  const [draft, setDraft] = useState<Draft>({ optionIndex: undefined, stake: 0 });
  const [phase, setPhase] = useState<ComposerPhase>("idle");
  const [reached, setReached] = useState<ComposerPhase>("idle");
  const [intake, setIntake] = useState<IntakeState | undefined>(undefined);
  const [intakeProblem, setIntakeProblem] = useState<string | undefined>(undefined);
  /// The exact bytes of the last submission. A retry resends THESE, same nonce and all:
  /// the nonce is the idempotency key, so a retry that re-signed with a fresh one would
  /// turn one uncertain Call into two real ones.
  const [attempt, setAttempt] = useState<SignedPickBody | undefined>(undefined);
  const [failure, setFailure] = useState<ComposerFailure | undefined>(undefined);
  const [refusal, setRefusal] = useState<Refusal | undefined>(undefined);
  const [accepted, setAccepted] = useState<AcceptedCall | undefined>(undefined);

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
  }, [address, market.marketId, accepted]);

  const send = useCallback(
    async (body: SignedPickBody): Promise<void> => {
      setFailure(undefined);
      setRefusal(undefined);
      goto("submitting");
      const outcome = await submitPick(body);
      if (outcome.kind === "accepted") {
        setAccepted({
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

  const resend = useCallback(async (): Promise<void> => {
    if (attempt !== undefined) await send(attempt);
  }, [attempt, send]);

  const reset = useCallback((): void => {
    setDraft({ optionIndex: undefined, stake: 0 });
    setPhase("idle");
    setReached("idle");
    setAttempt(undefined);
    setFailure(undefined);
    setRefusal(undefined);
    setAccepted(undefined);
  }, []);

  // Stable setters: the table calls setStake from an effect keyed on the pot, and a setter
  // that changed identity every render would re-run that effect forever.
  const setOption = useCallback((optionIndex: number | undefined): void => {
    setDraft((held) => ({ ...held, optionIndex }));
    goto("editing");
  }, [goto]);
  const setStake = useCallback((stake: number): void => {
    setDraft((held) => (held.stake === stake ? held : { ...held, stake }));
    if (stake > 0) goto("editing");
  }, [goto]);

  const problem = intake === undefined ? undefined : validateDraft(draft, intake.remaining);
  const failureCopy = failure === undefined ? undefined : COMPOSER_FAILURE_COPY[failure];
  return {
    provider,
    draft,
    setOption,
    setStake,
    phase,
    intake,
    intakeProblem,
    problem: problem !== undefined && !problem.ok ? problem.error : undefined,
    failure: failureCopy,
    refusal,
    accepted,
    couldHaveReached: couldHaveReachedIntake(reached),
    busy: phase === "signing" || phase === "submitting",
    canResend: failureCopy !== undefined && attempt !== undefined && failureCopy.kind !== "refusal",
    sign,
    resend,
    reset,
  };
};
