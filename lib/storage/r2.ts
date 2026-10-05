/**
 * R2 upload helpers. Server/script use only — pulls in the AWS SDK.
 * Page render should import publicUrlFor from ./url instead.
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env;

export function requireR2Config() {
  const missing = [
    ["R2_ACCOUNT_ID", R2_ACCOUNT_ID],
    ["R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET", R2_BUCKET],
    ["R2_PUBLIC_URL", process.env.R2_PUBLIC_URL],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`Missing R2 env vars in .env.local: ${missing.join(", ")}`);
  }
}

/**
 * True when every R2 var is present. Lets the seed script run against a bare
 * local checkout: keys are still recorded, the upload is simply skipped, and
 * publicUrlFor() serves the copy in public/.
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
      R2_ACCESS_KEY_ID &&
      R2_SECRET_ACCESS_KEY &&
      R2_BUCKET &&
      process.env.R2_PUBLIC_URL
  );
}

let client: S3Client | null = null;

export function r2(): S3Client {
  if (!client) {
    requireR2Config();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function mimeTypeFor(filename: string): string {
  return MIME_BY_EXT[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Key for a file that exists under public/ — the path relative to public/,
 * e.g. "audio/foo.mp3" or "images/exams/n1_dec_2018/bar.png".
 *
 * Mirroring the public/ layout is what lets publicUrlFor() fall back to the
 * local static copy when R2 is not configured. Returns null for paths outside
 * public/, so callers can fall back to storageKeyFor().
 */
export function storageKeyForLocalFile(absolutePath: string): string | null {
  const rel = path.relative(PUBLIC_DIR, absolutePath);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join("/");
}

/** Fallback key for media with no local copy: keyed by kind. */
export function storageKeyFor(filename: string): string {
  const mime = mimeTypeFor(filename);
  const prefix = mime.startsWith("audio/") ? "audio" : mime.startsWith("image/") ? "images" : "other";
  return `${prefix}/${filename}`;
}

/** Preferred key: mirrors public/ when the file is there, else keyed by kind. */
export function resolveStorageKey(filename: string, localPath?: string): string {
  if (localPath) {
    const key = storageKeyForLocalFile(localPath);
    if (key) return key;
  }
  return storageKeyFor(filename);
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: R2_BUCKET!, Key: key }));
    return true;
  } catch (err: unknown) {
    const e = err as { $metadata?: { httpStatusCode?: number }; name?: string };
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") return false;
    throw err;
  }
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Immutable content addressed by exam filename; safe to cache hard.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}
