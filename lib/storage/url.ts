/**
 * Public URL construction for media.
 *
 * Only the object key is persisted (files.storage_key), so the bucket or
 * custom domain can change without rewriting the database.
 *
 * Keys mirror the layout under public/ ("audio/foo.mp3",
 * "images/exams/n1_dec_2018/bar.png"). That means when R2 is not configured
 * we can serve the very same key straight out of public/ as a static asset —
 * no filesystem lookup, no API route, just a "/" prefix.
 *
 * Kept free of any AWS SDK import: this runs during page render, while
 * r2.ts (which pulls in the SDK) is used only by the seed/migrate scripts.
 */

export function publicUrlFor(storageKey: string | null | undefined): string | undefined {
  if (!storageKey) return undefined;

  const key = storageKey.replace(/^\/+/, "");
  const base = process.env.R2_PUBLIC_URL;

  if (base) {
    return `${base.replace(/\/+$/, "")}/${key}`;
  }

  // No bucket configured. Locally that is expected — fall through to the
  // copy in public/. In production it means a missing env var, and silently
  // serving 404s would be worse than failing loudly.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "R2_PUBLIC_URL is not set. Set it to the bucket's public base " +
        "(e.g. https://pub-xxxx.r2.dev) so media URLs can be built."
    );
  }

  return `/${key}`;
}
