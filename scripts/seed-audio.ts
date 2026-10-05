import { db } from "../lib/db";
import { files } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Usage: npx tsx scripts/seed-audio.ts

async function main() {
  const filename = "202407N101.mp3";
  // Try to find file in logical places
  const possiblePaths = [
    path.join(process.cwd(), "public", "audio", filename),
    path.join(process.cwd(), "public", filename),
    path.join(process.cwd(), filename),
  ];

  let filePath = possiblePaths.find(p => fs.existsSync(p));

  if (!filePath) {
    console.error(`Audio file ${filename} not found in expected locations.`);
    process.exit(1);
  }

  console.log(`Found audio file at: ${filePath}`);

  const fileBuffer = fs.readFileSync(filePath);

  try {
    console.log("Inserting audio into database...");
    
    // Check if exists
    const existing = await db.select().from(files).where(eq(files.filename, filename));
    
    if (existing.length > 0) {
        console.log("File already exists, skipping...");
    } else {
        await db.insert(files).values({
            filename: filename,
            mimeType: "audio/mpeg",
            data: fileBuffer,
        });
        console.log("Audio file inserted successfully!");
    }
  } catch (err) {
    console.error("Error inserting file:", err);
  } finally {
    process.exit(0);
  }
}

main();
