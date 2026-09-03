import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createDb, transparencyObservations, type Db } from "@proof-league/shared/db";
import { logger } from "../logger.js";

// The project phase (AD-7): phase timestamps write to the transparency projection AS EACH
// PHASE COMPLETES, feeding the live pipeline UI. Two adapters behind one port: Postgres
// (the local Supabase stack in dev, the hosted project in prod — Abu 2026-09-03: the local
// stack is the dev database, no waiting on provisioning) and the append-only JSONL file
// for a worker running with no DATABASE_URL. Rows are append-only either way — nothing
// here can rewrite an observation after the fact.

export type TransparencyRow = {
  readonly atSec: number;
  readonly sourceKey: `0x${string}`;
  readonly marketIds: readonly string[];
  readonly phase: "event" | "attested" | "proven" | "note";
  // AD-18's two classes, carried on every row: event/attested are worker observations
  // (labelled observed-not-proven where displayed); a proven row carries the Creditcoin
  // transaction that IS proven.
  readonly class: "observed" | "proven";
  readonly txHash?: `0x${string}`;
  readonly overCliff?: boolean;
  readonly note?: string;
};

export interface TransparencyProjection {
  record(row: TransparencyRow): void | Promise<void>;
}

export class FileTransparencyProjection implements TransparencyProjection {
  private readonly file: string;

  constructor(stateDir: string) {
    mkdirSync(stateDir, { recursive: true });
    this.file = join(stateDir, "transparency.jsonl");
  }

  record(row: TransparencyRow): void {
    appendFileSync(this.file, `${JSON.stringify(row)}\n`);
  }
}

/// The database adapter (schema owned by packages/shared/db, CONVENTIONS §4). An insert
/// failure falls back to the JSONL file — an observation, once made, is never lost to a
/// database hiccup, and the failure itself is logged, never swallowed.
export class PostgresTransparencyProjection implements TransparencyProjection {
  private readonly db: Db;
  private readonly fallback: FileTransparencyProjection;

  constructor(databaseUrl: string, stateDir: string) {
    this.db = createDb(databaseUrl).db;
    this.fallback = new FileTransparencyProjection(stateDir);
  }

  async record(row: TransparencyRow): Promise<void> {
    try {
      await this.db.insert(transparencyObservations).values({
        atSec: row.atSec,
        sourceKey: row.sourceKey,
        marketIds: row.marketIds,
        phase: row.phase,
        evidenceClass: row.class,
        txHash: row.txHash ?? null,
        overCliff: row.overCliff ?? null,
        note: row.note ?? null,
      });
    } catch (error) {
      logger.error({ err: error }, "[worker] transparency insert failed — row kept in the JSONL fallback");
      this.fallback.record(row);
    }
  }
}
