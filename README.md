# JLPT Tester

A web app for sitting past JLPT exams: vocabulary/grammar, reading and listening sections, with answer checking and audio playback.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Drizzle ORM and PostgreSQL.

> **Exam content is not included in this repository.** The questions, passages, audio and images are kept out of git. You supply your own exam data (see [Exam data](#exam-data)) or restore a database dump someone shares with you (see [Sharing a database](#sharing-a-database)).

## Requirements

- Node.js 20 or newer
- Docker (for the local Postgres database)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env.local

# 3. Start Postgres
docker compose up -d

# 4. Create the tables
npm run db:push

# 5. Load exam data from data/exams/*.json (see "Exam data")
npm run db:seed

# 6. Run the app
npm run dev
```

Open http://localhost:3000. The home page lists every exam in the database; each one opens at `/exams/<id>`.

## Postgres setup

### Local database (Docker)

`docker-compose.yml` runs Postgres 15 in a container named `jlpt_postgres`:

| Setting  | Value        |
| -------- | ------------ |
| Host     | `localhost`  |
| Port     | `5432`       |
| Database | `jlpt_local` |
| User     | `postgres`   |
| Password | `password`   |

Data is kept in the `postgres_data` Docker volume, so it survives container restarts.

```bash
docker compose up -d        # start
docker compose stop         # stop, keep data
docker compose down         # remove the container, keep data
docker compose down -v      # remove the container AND delete all data
```

If port 5432 is already in use by another Postgres on your machine, stop that one or change the left-hand side of `ports` in `docker-compose.yml` (and the port in `DATABASE_URL`).

To open a SQL shell:

```bash
docker exec -it jlpt_postgres psql -U postgres -d jlpt_local
```

### Connection string

Set `DATABASE_URL` in `.env.local`. For the Docker database:

```
DATABASE_URL=postgres://postgres:password@localhost:5432/jlpt_local
```

**The URL scheme picks the driver** (`lib/db/index.ts`):

- `postgres://...` uses the standard `pg` driver. Use this for local Docker.
- Anything else (for example `postgresql://...`) uses the Neon serverless HTTP driver. Use this for a hosted [Neon](https://neon.tech) database.

So a local URL must start with `postgres://`, not `postgresql://`, or the app will try to reach it over Neon's HTTP protocol and fail.

### Schema

The schema lives in `lib/db/schema.ts`. There are no migration files; `npm run db:push` syncs the database to the schema directly.

| Table       | Holds                                                              |
| ----------- | ------------------------------------------------------------------ |
| `exams`     | One row per exam: level (N1–N5), year, session (July/December)     |
| `sections`  | Parts of an exam: type (vocab/reading/listening), order, passage   |
| `questions` | Question text, number, optional audio and image references         |
| `choices`   | Answer options, with `is_correct` and an optional image            |
| `files`     | Metadata for audio and image files, including their storage key    |

## Exam data

The seed script reads every `*.json` file in `data/exams/` and upserts it into the database. That folder is gitignored, so create it and add your own files.

Each file describes one exam (types in `lib/types/seed-data.ts`):

```json
{
  "level": "N1",
  "year": 2099,
  "session": "July",
  "sections": [
    {
      "type": "listening",
      "title": "Problem 1",
      "order": 1,
      "passageTitle": "Optional heading",
      "passageContent": "Optional passage, HTML allowed",
      "questions": [
        {
          "number": 1,
          "text": "Question text",
          "instruction": "Optional instruction",
          "audioFilename": "example_listening.mp3",
          "imageFilename": "example.png",
          "choices": [
            { "text": "Option one", "isCorrect": false },
            { "text": "Option two", "isCorrect": true }
          ]
        }
      ]
    }
  ]
}
```

`type` is one of `vocab`, `reading` or `listening`. `audioFilename` and `imageFilename` are bare filenames.

```bash
npm run db:seed            # seed every file in data/exams
npm run db:seed -- 2099    # only files whose name contains "2099"
```

Seeding is an upsert keyed on level, year and session, so it is safe to re-run.

## Audio and images

Media files are not stored in Postgres. The `files` table only records a storage key such as `audio/example_listening.mp3`, and the app turns that key into a URL.

**Locally:** put audio under `public/audio/` and images under `public/images/exams/` (subfolders are fine). The seed script finds them by filename, and they are served straight from `public/`. No extra configuration is needed; leave the R2 variables blank.

**In production:** media is served from a Cloudflare R2 bucket. Fill in the `R2_*` variables in your environment (see `.env.example`). When they are all set, the seed script uploads each file to the bucket as it goes. `R2_PUBLIC_URL` is required in production; the app throws rather than serving broken links if it is missing.

## Scripts

| Command                    | What it does                                                        |
| -------------------------- | ------------------------------------------------------------------- |
| `npm run dev`              | Start the dev server                                                |
| `npm run build`            | Production build                                                    |
| `npm run start`            | Run the production build                                            |
| `npm run lint`             | Run ESLint                                                          |
| `npm run db:push`          | Sync the database to `lib/db/schema.ts`                             |
| `npm run db:seed`          | Load `data/exams/*.json` into the database                          |
| `npm run db:studio`        | Open Drizzle Studio to browse the database                          |
| `npm run db:reset`         | **Drop every table.** Run `db:push` and `db:seed` afterwards        |
| `npm run media:link-local` | Point existing `files` rows at the copies in `public/`              |
| `npm run media:migrate`    | Upload media to R2 and record storage keys (needs R2 configured)    |
| `npm run media:drop-bytea` | Drop the legacy in-database media column once R2 has everything     |

Scripts read `DATABASE_URL` from `.env.local`, so they act on whichever database that points to. Check it before running `db:reset`.

## Sharing a database

To hand someone a ready-to-use copy without them seeding from JSON:

```bash
# Export
docker exec jlpt_postgres pg_dump -U postgres -Fc jlpt_local > jlpt_local.dump

# Import (on a fresh database, after `docker compose up -d`)
docker exec -i jlpt_postgres pg_restore -U postgres -d jlpt_local --no-owner < jlpt_local.dump
```

The dump does not make audio or images playable on its own: the app serves those from `public/audio` and `public/images/exams`, so send those folders too.

## Project layout

```
app/                   Pages: exam list (/) and exam runner (/exams/[examId])
components/            QuizRunner and UI components
lib/db/                Drizzle schema and database connection
lib/storage/           Media URL building and R2 upload helpers
lib/types/             Seed data types
scripts/               Seed, reset and media migration scripts
data/exams/            Your exam JSON (gitignored)
public/audio/          Your audio files (gitignored)
public/images/exams/   Your image files (gitignored)
```
