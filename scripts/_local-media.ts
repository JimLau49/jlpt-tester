/**
 * Locates media files on disk by bare filename.
 *
 * Replaces the per-exam hardcoded paths the seed script used to guess at:
 * public/audio and public/images are walked once and indexed by filename.
 */
import fs from "fs";
import path from "path";

const MEDIA_ROOTS = [
  path.join(process.cwd(), "public", "audio"),
  path.join(process.cwd(), "public", "images"),
];

let index: Map<string, string> | null = null;

export function localMediaIndex(): Map<string, string> {
  if (index) return index;

  const found = new Map<string, string>();

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!found.has(entry.name)) {
        found.set(entry.name, full);
      }
    }
  };

  MEDIA_ROOTS.forEach(walk);
  index = found;
  return found;
}

export function findLocalMedia(filename: string): string | undefined {
  return localMediaIndex().get(filename);
}
