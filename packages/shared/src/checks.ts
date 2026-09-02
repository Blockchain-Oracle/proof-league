// The seven checks, verbatim (PRD §4.4). This list is the single copy source for the focused
// contract verification names, the proof panel, the transparency page and the Integration
// Summary — one wording everywhere, or the trust pitch contradicts itself.
export const SEVEN_CHECKS = [
  {
    id: "source-succeeded",
    title: "The Ethereum transaction succeeded",
    plain: "It did not fail or revert.",
  },
  {
    id: "right-contract",
    title: "It came from the right contract",
    plain: "The emitting address is on the approved list for this Market, on the right chain.",
  },
  {
    id: "right-event",
    title: "It is the right kind of event",
    plain: "The event's signature matches the one this Market settles on.",
  },
  {
    id: "right-subject",
    title: "It is about the right thing",
    plain: "For example the report for this day, not another one.",
  },
  {
    id: "not-reused",
    title: "It has not been used before",
    plain: "The same Proof cannot settle the same Market twice.",
  },
  {
    id: "market-was-open",
    title: "The Market was open when it happened",
    plain: "The Source Event came after the Market opened, never before.",
  },
  {
    id: "real-verifier",
    title: "The submitter proved it through the real verifier",
    plain: "Settlement only trusts the genuine Attestcoin verification path, never a caller-supplied prover.",
  },
] as const;

export type CheckId = (typeof SEVEN_CHECKS)[number]["id"];
