# Archived `verify:*` runs (CONVENTIONS §8)

Each script is one focused evidence run against real chains, and each exits non-zero
rather than print anything it did not observe. This file archives what they printed.

Deployment under test unless stated otherwise: ProofGateway
`0x4549fbd1acf45cf46f29b3adb6b052880c8040ec`, LeagueCore
`0xFe8C5438781f8c8392a49e20502920Ba41027493` on Creditcoin 3 testnet, with ContestSource
`0x8334889B9c068e57078Da3376087ee2b7A7fd42B` on Sepolia as the source chain.

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
