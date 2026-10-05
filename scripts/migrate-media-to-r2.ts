/**
 * One-time migration: move media out of Postgres bytea and into Cloudflare R2.
 *
 *   npx tsx scripts/migrate-media-to-r2.ts --local     # no R2: just link rows to public/
 *   npx tsx scripts/migrate-media-to-r2.ts --dry-run   # report only
 *   npx tsx scripts/migrate-media-to-r2.ts             # upload + backfill storage_key
 *
 * --local sets storage_key without uploading anything. Keys mirror public/, so
 * publicUrlFor() then serves the local static copy and the app works offline.
 * Re-running later without --local uploads those same keys to the bucket.
 *
 * Idempotent: rows that already have a storage_key backed by a real object in
 * the bucket are skipped, so it is safe to re-run after a partial failure.
 *
 * Bytes come from the local file in public/ when present (that is the original
 * source), otherwise from the row's existing bytea column.
 */
import { db } from "../lib/db";
import { files } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import {
  mimeTypeFor,
  resolveStorageKey,
  objectExists,
  uploadObject,
  requireR2Config,
} from "../lib/storage/r2";
import { localMediaIndex } from "./_local-media";
import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const LOCAL_ONLY = process.argv.includes("--local");
const CONCURRENCY = 4;

function fmtMB(bytes: number): string {
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

type Row = typeof files.$inferSelect;

async function migrateRow(row: Row, localIndex: Map<string, string>) {
  const localPath = localIndex.get(row.filename);
  const key = row.storageKey ?? resolveStorageKey(row.filename, localPath);
  const mime = mimeTypeFor(row.filename) || row.mimeType;

  // --local: record the key so public/ can serve it; never touch the network.
  if (LOCAL_ONLY) {
    if (!localPath) return { status: "missing" as const, key, bytes: 0 };
    if (row.storageKey === key) return { status: "skipped" as const, key, bytes: 0 };

    if (DRY_RUN) {
      console.log(`  would link ${row.filename} -> ${key}`);
    } else {
      await db.update(files).set({ storageKey: key, mimeType: mime }).where(eq(files.id, row.id));
      console.log(`  ✓ linked ${row.filename} -> ${key}`);
    }
    return { status: "uploaded" as const, key, bytes: 0 };
  }

  if (row.storageKey && (await objectExists(row.storageKey))) {
    return { status: "skipped" as const, key, bytes: 0 };
  }

  // Prefer the file on disk; fall back to whatever is already in Postgres.
  let body: Buffer | null = null;
  let source: string;

  if (localPath) {
    body = fs.readFileSync(localPath);
    source = path.relative(process.cwd(), localPath);
  } else if (row.data) {
    body = Buffer.from(row.data);
    source = "postgres bytea";
  } else {
    return { status: "missing" as const, key, bytes: 0 };
  }

  if (DRY_RUN) {
    console.log(`  would upload ${key}  (${fmtMB(body.length)}, from ${source})`);
    return { status: "uploaded" as const, key, bytes: body.length };
  }

  await uploadObject(key, body, mime);
  await db
    .update(files)
    .set({ storageKey: key, mimeType: mime })
    .where(eq(files.id, row.id));

  console.log(`  ✓ ${key}  (${fmtMB(body.length)}, from ${source})`);
  return { status: "uploaded" as const, key, bytes: body.length };
}

async function main() {
  if (!LOCAL_ONLY) requireR2Config();

  if (LOCAL_ONLY) console.log("LOCAL MODE — linking rows to public/, no uploads.\n");
  if (DRY_RUN) console.log("DRY RUN — nothing will be uploaded or written.\n");

  const localIndex = localMediaIndex();
  const rows: Row[] = await db.select().from(files);

  console.log(`${rows.length} rows in files table, ${localIndex.size} media files on disk.\n`);

  const counts = { uploaded: 0, skipped: 0, missing: 0 };
  const missing: string[] = [];
  let bytes = 0;

  // Small fixed pool — R2 handles parallel PUTs fine, but 52 concurrent
  // 16 MB buffers would be a lot of memory at once.
  const queue = [...rows];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const row = queue.shift();
      if (!row) break;
      try {
        const result = await migrateRow(row, localIndex);
        counts[result.status]++;
        bytes += result.bytes;
        if (result.status === "missing") missing.push(row.filename);
      } catch (err) {
        console.error(`  ✗ ${row.filename}:`, err instanceof Error ? err.message : err);
        throw err;
      }
    }
  });

  await Promise.all(workers);

  const verb = LOCAL_ONLY ? "Linked" : "Uploaded";
  const size = LOCAL_ONLY ? "" : ` (${fmtMB(bytes)})`;
  console.log(`\n${DRY_RUN ? "Would " + verb.toLowerCase() : verb}: ${counts.uploaded}${size}`);
  console.log(`Already ${LOCAL_ONLY ? "linked" : "in R2"}: ${counts.skipped}`);
  console.log(`${LOCAL_ONLY ? "No local file" : "No bytes found"}: ${counts.missing}`);

  if (missing.length > 0) {
    console.log(LOCAL_ONLY ? "\nRows with no local file in public/:" : "\nRows with neither a local file nor bytea data:");
    missing.forEach((f) => console.log(`  - ${f}`));
  }

  // Files on disk that no row references — not migrated, listed so they can be
  // wired up or deleted deliberately rather than silently dropped.
  const referenced = new Set(rows.map((r) => r.filename));
  const orphans = [...localIndex.keys()].filter((f) => !referenced.has(f));
  if (orphans.length > 0) {
    console.log(`\n${orphans.length} local media file(s) not referenced by any files row:`);
    orphans.forEach((f) => console.log(`  - ${f}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
