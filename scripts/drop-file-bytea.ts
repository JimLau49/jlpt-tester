/**
 * Final step of the R2 migration: drop files.data once every row is backed by
 * an object in the bucket. Run only after migrate-media-to-r2.ts reports clean.
 *
 *   npx tsx scripts/drop-file-bytea.ts --check   # verify readiness, change nothing
 *   npx tsx scripts/drop-file-bytea.ts           # verify, then drop the column
 *
 * Refuses to drop while any row still lacks a storage_key.
 */
import { db } from "../lib/db";
import { files } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import { objectExists, requireR2Config } from "../lib/storage/r2";

const CHECK_ONLY = process.argv.includes("--check");

async function main() {
  requireR2Config();

  const rows: (typeof files.$inferSelect)[] = await db.select().from(files);
  const unmigrated = rows.filter((r) => !r.storageKey);

  if (unmigrated.length > 0) {
    console.error(`${unmigrated.length} row(s) still have no storage_key:`);
    unmigrated.slice(0, 20).forEach((r) => console.error(`  - ${r.filename}`));
    console.error("\nRun: npx tsx scripts/migrate-media-to-r2.ts");
    process.exit(1);
  }

  // Confirm the bucket really has every object before destroying the fallback.
  console.log(`Verifying ${rows.length} objects exist in R2...`);
  const absent: string[] = [];
  for (const row of rows) {
    if (!(await objectExists(row.storageKey!))) absent.push(row.storageKey!);
  }

  if (absent.length > 0) {
    console.error(`\n${absent.length} object(s) referenced by the DB are missing from the bucket:`);
    absent.forEach((k) => console.error(`  - ${k}`));
    console.error("\nRefusing to drop files.data — re-run the migration first.");
    process.exit(1);
  }

  console.log("All objects present in R2.");

  if (CHECK_ONLY) {
    console.log("\n--check passed. Re-run without --check to drop files.data.");
    process.exit(0);
  }

  console.log("Dropping files.data ...");
  await db.execute(sql`ALTER TABLE files DROP COLUMN IF EXISTS data`);
  console.log("Done. Remove the `data` column and the bytea customType from lib/db/schema.ts.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
