// The rebuild gate's comparison engine (AD-8), split out of rebuild.ts under the
// file-size law. One canonical shape for "all class-1 truth": maps keyed by row identity,
// values JSON-comparable. Both sides of the gate — the chain reconstruction and the
// projection load — produce this, so the diff never has to know which side it is holding.

export type Truth = Record<string, Record<string, unknown>>;

export type TruthTables = {
  markets: Truth;
  committedPicks: Truth;
  resolutions: Truth;
  scores: Truth;
  standings: Truth;
};

export const emptyTruth = (): TruthTables => ({
  markets: {},
  committedPicks: {},
  resolutions: {},
  scores: {},
  standings: {},
});

/// Every disagreement, named. Serialization uses the CHAIN side's key list on both sides,
/// so a projection row carrying extra identity columns compares on truth alone while a
/// missing or altered value still shows up. Rows present on only one side are reported in
/// the direction that says what went wrong: reconstructable-but-absent means the cache
/// never caught up, present-but-not-reconstructable means the cache invented something.
export const diffTruth = (expected: TruthTables, actual: TruthTables): string[] => {
  const diffs: string[] = [];
  for (const table of Object.keys(expected) as (keyof TruthTables)[]) {
    const expectedRows = expected[table];
    const actualRows = actual[table];
    for (const key of Object.keys(expectedRows)) {
      const expectedRow = expectedRows[key] as Record<string, unknown>;
      if (!(key in actualRows)) {
        diffs.push(`${table}[${key}]: reconstructed from chain but MISSING from the database`);
        continue;
      }
      const fields = Object.keys(expectedRow).sort();
      const expectedJson = JSON.stringify(expectedRow, fields);
      const actualJson = JSON.stringify(actualRows[key], fields);
      if (expectedJson !== actualJson) {
        diffs.push(`${table}[${key}]: chain says ${expectedJson} but database says ${actualJson}`);
      }
    }
    for (const key of Object.keys(actualRows)) {
      if (!(key in expectedRows)) {
        diffs.push(`${table}[${key}]: in the database but NOT reconstructable from chain`);
      }
    }
  }
  return diffs;
};
