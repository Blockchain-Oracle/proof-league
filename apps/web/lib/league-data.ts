import { and, eq, seasonStandings } from "@proof-league/shared/db";
import { deployedCore, projectionDb } from "./market-data.js";

// The season board (Masayume's leaderboard shape over the chain's own standings): every
// seat the projector has ranked, in rank order. Rank is the projector's fold of the
// contract's own comparison (points, then streak, then earliest commit), never a client
// sort, so two screens can never disagree about who is first.

export type StandingRow = {
  readonly player: string;
  readonly seasonPoints: number;
  readonly streak: number;
  readonly rank: number;
};

export const standings = async (): Promise<StandingRow[]> => {
  const db = projectionDb();
  const core = await deployedCore();
  if (db === undefined || core === undefined) return [];
  try {
    const rows = await db
      .select()
      .from(seasonStandings)
      .where(and(eq(seasonStandings.core, core.toLowerCase())))
      .orderBy(seasonStandings.rank);
    return rows.map((row) => ({ player: row.player, seasonPoints: Number(row.seasonPoints), streak: row.streak, rank: row.rank }));
  } catch {
    return [];
  }
};
