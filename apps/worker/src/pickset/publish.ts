import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Hex } from "viem";
import { pickSetFileName, pickSetSha256 } from "@proof-league/shared";
import { logger } from "../logger.js";

// Story 2.2's publication port (AD-5/AD-18): content-addressed, dual-homed, WRITE-ONCE.
// Home 1 is Supabase Storage at the public path picksets/<marketId>-<sha256>.json; home 2
// is the docs/pick-sets/ mirror (committed to the dedicated data branch by the mirror
// step, never by this process). The ordering law lives here: publish() returns only after
// BOTH homes hold the bytes AND the public URL served them back sha-identical — so
// commitPicks can never point the chain at bytes nobody can fetch [review 2026-08-31].

export type PicksetPublisherConfig = {
  readonly supabaseUrl?: string | undefined;
  readonly serviceKey?: string | undefined;
  readonly mirrorDir: string;
};

/// §9: SUPABASE_URL + SUPABASE_SERVICE_KEY (new-format secret, worker only). The mirror
/// dir defaults into the state dir so a worker outside the repo still has its second home;
/// local dev points PICKSET_MIRROR_DIR at the repo's docs/pick-sets.
export const readPicksetPublisherConfig = (
  env: Record<string, string | undefined>,
  stateDir: string,
): PicksetPublisherConfig => ({
  supabaseUrl: env.SUPABASE_URL,
  serviceKey: env.SUPABASE_SERVICE_KEY,
  mirrorDir: env.PICKSET_MIRROR_DIR ?? join(stateDir, "pick-sets"),
});

export type PublishedPickSet = {
  readonly fileName: string;
  // What commitPicks records on-chain: the readable public URL when Storage is configured,
  // an honest local: uri in the degraded file-only mode (never a URL nobody can fetch).
  readonly uri: string;
  readonly homes: readonly string[];
};

const BUCKET = "picksets";
const HTTP_TIMEOUT_MS = 15_000;

export class PickSetPublisher {
  private bucketReady = false;

  constructor(private readonly config: PicksetPublisherConfig) {}

  get storageConfigured(): boolean {
    return this.config.supabaseUrl !== undefined && this.config.serviceKey !== undefined;
  }

  /// Both homes, then proof-of-readability, then (and only then) the caller may commit.
  /// Idempotent under restart: a crash between upload and commit re-publishes the same
  /// bytes — the write-once check accepts identical content and refuses different content.
  async publish(marketId: bigint, serialized: string, sha: Hex): Promise<PublishedPickSet> {
    const fileName = pickSetFileName(marketId, sha);
    const homes: string[] = [];

    this.mirrorWriteOnce(fileName, serialized);
    homes.push(`mirror:${join(this.config.mirrorDir, fileName)}`);

    if (!this.storageConfigured) {
      logger.warn(
        `[worker] pickset ${fileName}: Supabase Storage not configured — mirror-only publication (degraded, honest)`,
      );
      return { fileName, uri: `local:pick-sets/${fileName}`, homes };
    }

    await this.ensureBucket();
    await this.uploadWriteOnce(fileName, serialized, sha);
    const uri = `${this.config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`;
    // Verify-readable is a real GET of the PUBLIC url (no service key), sha-checked: the
    // uri that goes on-chain is proven fetchable by anyone before the commit spends gas.
    const served = await this.fetchText(uri, {});
    if (pickSetSha256(served) !== sha) {
      throw new Error(`pickset ${fileName}: public URL served different bytes than published`);
    }
    homes.push(`storage:${uri}`);
    return { fileName, uri, homes };
  }

  private mirrorWriteOnce(fileName: string, serialized: string): void {
    mkdirSync(this.config.mirrorDir, { recursive: true });
    const path = join(this.config.mirrorDir, fileName);
    if (existsSync(path)) {
      if (readFileSync(path, "utf8") !== serialized) {
        throw new Error(`pickset ${fileName}: mirror file exists with DIFFERENT bytes — write-once violated`);
      }
      return; // same bytes: the restart-idempotent case
    }
    writeFileSync(path, serialized);
    if (readFileSync(path, "utf8") !== serialized) {
      throw new Error(`pickset ${fileName}: mirror read-back mismatch`);
    }
  }

  private headers(): Record<string, string> {
    const key = this.config.serviceKey as string;
    return { authorization: `Bearer ${key}`, apikey: key };
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    const response = await fetch(`${this.config.supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...this.headers(), "content-type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!response.ok) {
      const body = await response.text();
      // The one acceptable failure is "already exists" — anything else is a real refusal.
      if (!/exists|duplicate/i.test(body)) {
        throw new Error(`pickset bucket create failed (${response.status}): ${body}`);
      }
    }
    this.bucketReady = true;
  }

  private async uploadWriteOnce(fileName: string, serialized: string, sha: Hex): Promise<void> {
    const response = await fetch(`${this.config.supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`, {
      method: "POST", // POST without x-upsert IS the write-once: a second write 409s
      headers: { ...this.headers(), "content-type": "application/json" },
      body: serialized,
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (response.ok) return;
    const body = await response.text();
    if (!/exists|duplicate/i.test(body)) {
      throw new Error(`pickset upload failed (${response.status}): ${body}`);
    }
    // Already present (a crash-between-upload-and-commit restart): identical bytes are
    // the idempotent pass; different bytes under a sha-addressed name mean tampering.
    const existing = await this.fetchText(
      `${this.config.supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`,
      this.headers(),
    );
    if (pickSetSha256(existing) !== sha) {
      throw new Error(`pickset ${fileName}: storage object exists with DIFFERENT bytes — write-once violated`);
    }
  }

  private async fetchText(url: string, headers: Record<string, string>): Promise<string> {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`pickset fetch ${url} failed (${response.status})`);
    return response.text();
  }
}
