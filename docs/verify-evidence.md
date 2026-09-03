# Archived `verify:*` runs (CONVENTIONS §8)

Each script is one focused evidence run against real chains, and each exits non-zero
rather than print anything it did not observe. This file archives what they printed.

Deployment under test unless stated otherwise: ProofGateway
`0x4549fbd1acf45cf46f29b3adb6b052880c8040ec`, LeagueCore
`0xFe8C5438781f8c8392a49e20502920Ba41027493` on Creditcoin 3 testnet, with ContestSource
`0x8334889B9c068e57078Da3376087ee2b7A7fd42B` on Sepolia as the source chain.

---

## `verify:void` — 2026-09-03, live deployment

```
created markets 2 (will commit) and 3 (never commits)
empty pick-set published and committed to 2:
  picksets/2-ec38e449cfa1fd9d5c218990eb5adf5b92f1aa90d538f1ae04b0d99c7bdde243.json
pre-deadline void correctly refused (VoidBeforeDeadline)
Committed -> Voided landed for market 2:
  0x667c85c281bfcfa6417f7d65b796e1d9a0d0d4424e9e2aec85450b1c5f15035c
Created -> Voided landed for market 3:
  0xa7e244d254e9261ab2a86210f1db724e32bf3d5e5e6d8815450ac89ca205e29a
PASS — both AD-19 edges exercised on testnet, early void refused.
```

What this demonstrates: void is a clock fact rather than an operator decision. Called
before the deadline it refuses by name, and the refusal was probed on-chain rather than
assumed. Called after, it works from either non-terminal state, including the market that
missed its commit window entirely, which is the edge that keeps a stalled Market from
freezing its league day and the season payout behind it.

---

## `verify:settlement` — 2026-09-03, first live run

Run against the first deployment (gateway `0x6bf6a39c..0d76`), which was replaced later
the same hour; see the note at the bottom. The measurement stands on its own, because it
is a property of the protocol path rather than of the addresses.

```
Sepolia round 1, settleBlock 11626536
RoundSettled on Sepolia: 0x0f5eae3b063adad403a8394306e5e508f90d7b93297fcbba7a9ad3cb6737e10c
PASS — watch -> attest -> prove (hosted) -> submit -> project on testnet.
  event 1788438024 -> attested 1788438495 (+471s) -> proven 1788438510 (+486s)
  target (measured attestation + 5 min): 810s — met
  cost cliff 3600s: under
  proof tx: 0xbb9b12d13b7e97d5bf380213f47109de0bdda426dadb13a797a87e6b385e2f2a
```

What this demonstrates: a real event on one chain settled a Market on another with no
human choosing the outcome, in **8 minutes 6 seconds** end to end, inside the FR-12 target
of 13 minutes 30 seconds derived from the day-1 measurements, and far under the 60-minute
cost cliff. The attestation leg was 7 minutes 51 seconds of that, which is the protocol's
own latency and not ours; the proof and submission added 15 seconds.

### Why the first deployment was replaced

The same run committed its Market's pick-set as a placeholder `local:` URI, so those bytes
were never published anywhere. `pnpm rebuild` then refused that core, correctly: a
commitment pointing at bytes nobody can fetch is not reconstructable by anyone, which is
precisely the condition that gate exists to detect. The script was wrong, not the gate.
Both live-core scripts now publish the canonical empty document to both homes and prove it
readable before committing, and the core was redeployed while it was 35 minutes old and
held nothing else.

---

## `verify:settlement` — 2026-09-03, clean deployment

Same path, run against `0xFe8C5438..7493` with the pick-set published for real this time:

```
Sepolia round 3, settleBlock 11626738
market 4 on sourceKey 0x200187ee5ee74b83744ade8d2f5069a0110d5c255f8bbb200ad7384a8d8f2889
empty pick-set published and committed:
  picksets/4-ce9cfc53748a479d5346aacaa46dc4cffaf48db7d9b9c1ecc2ff9d8ae9ff510a.json
RoundSettled on Sepolia: 0xc07efdc06fdc63d3dd86e068c013d660071f00b5383eb9baf8cb04e9e423bae5
PASS — watch -> attest -> prove (hosted) -> submit -> project on testnet.
  event 1788440604 -> attested 1788441135 (+531s) -> proven 1788441165 (+561s)
  target (measured attestation + 5 min): 810s — met
  cost cliff 3600s: under
  proof tx: 0x8b2fcf3c5ce787e3c43a49c18b049e3996e37cb2f6e56e4f40fa4298c8b5b1b0
```

Nine minutes 21 seconds, inside target again, on a second independent run.

## The rest of the machine, over that settlement

The production worker was then run against the same core and every duty executed on real
state: it scored market 4 (the canonical empty-set opening, `MarketFullyScored`), voided
the market left over from a failed fixture run, and projected all four markets. `pnpm
rebuild` then reconstructed the core from chain plus published pick-sets and diffed clean
at `markets=4 resolutions=1`.

```
rebuild: LIVE — reconstructing core 0xFe8C5438..7493 (logs from block 5423291)
rebuild: PASS — every class-1 row re-derived and diffed clean (markets=4 resolutions=1)
```

Running it also found a real bug worth recording: the projector's log scan started at
genesis and timed out against the public RPC, because the deployment block was recorded
in config but never passed to the scan. Reading a log line beats reasoning about one.

## Reference-fidelity pass (Story 3.1, NFR-8)

Checked in a real browser rather than from clean-load screenshots alone:

| Check | Result |
|---|---|
| 1440x1000 desktop, dark and light | header with the five jobs, ticker, section rhythm, crop ticks, grain overlay present |
| Live toggle dark -> light and light -> dark | canvas moves between `#050505` and `#F4EEE3` in place; semantic colors re-derive, none stale |
| Toggle accessibility | label flips between "Switch to light theme" and "Switch to dark theme"; visible state shows the current theme; choice persists to `pl.theme.v1` |
| 390x844 and 360x800 | compact header, all five jobs in the safe-area bottom nav, rows reflow |
| Horizontal overflow at 360px | `scrollWidth == clientWidth`, zero elements past the viewport |
| Touch targets | bottom-nav links measure 44px |
| State chips over live data | three voided markets render the ash treatment, the settled one renders proof verified |

The remaining fidelity work is the states this build has no data for yet (first-run,
awaiting attestation, a player's own pick), which arrive with the stories that own them.
