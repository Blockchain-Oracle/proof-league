import { DECK_ORDER, FAMILIES, type Family } from "../event/family.js";

// The hand's card shape and the registry's NEXT and CONCEPT cards, kept free of "use
// client" so the page can deal them on the server. They are drawn in the hand at .6
// opacity and never open a stage: the registry says they are not admitted, and so do they.

export type HandCard = {
  readonly key: string;
  readonly family: Family;
  readonly chip: "LIVE" | "REPLAY" | "NEXT" | "CONCEPT";
  readonly question: string;
  readonly clock: string;
  readonly marketId: string | undefined;
};

export const conceptHand = (): HandCard[] =>
  DECK_ORDER.filter((id) => FAMILIES[id].status === "NEXT" || FAMILIES[id].status === "CONCEPT")
    .slice(0, 2)
    .map((id) => {
      const family = FAMILIES[id];
      return {
        key: `concept-${id}`,
        family,
        chip: family.status === "NEXT" ? "NEXT" : "CONCEPT",
        question: family.deckQuestion,
        clock: family.status === "NEXT" ? "NEEDS A DECODER" : "NOT ADMITTED",
        marketId: undefined,
      };
    });
