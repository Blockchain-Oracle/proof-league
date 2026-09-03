# Failover drill — the named history-window task (Story 2.8, AD-7)

Three forced failures against the live deployment during the one-deployment history
window (≈ Sep 1–5, extended through the judging window as needed), each proving a
recovery path the architecture claims. Results are recorded here as they run — a drill
without a logged result has not happened.

How to force each failure, and what must be observed:

## 1. Prover outage → RawProofBuilder settles the round

Block the hosted prover for one settlement (set `PROVER_URL` to an unroutable address on
the worker for one round, or firewall it). The pipeline's prove phase must fail over to
`RawProofBuilder` (same `ProofProvider` interface, `prover: "raw"` in the cursor and the
verify output) and the proof must land on-chain. No `stuck` state, no operator action.

- **Result:** _not yet run_

## 2. Restart mid-pipeline → cursors resume, no re-detection

Kill the worker process between detection and submission (the phase is visible in
`.worker-state/state.json`). On restart the cursor must resume at the same phase: no
second log scan (the `scanFromBlock` and `detected` fields survive), no second proof
query if one was already built (a proof unit is budget, AD-7).

- **Result:** _not yet run_

## 3. Ledger forced below threshold → alert + honest `stuck`

Force a worker account below the three-day line (temporarily raise the floor constant, or
drain the account to a sibling). The operator webhook must receive `ledger-low-water`;
driving the signer below the submission minimum must withhold submission with the
`stuck` reason "worker gas exhausted" in the transparency log — never a silent skip,
never a broadcast that dies of insufficient funds.

- **Result:** _not yet run_
