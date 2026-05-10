# DB Setup

## Applying the schema to Supabase

### Prerequisites

Install and authenticate the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref imivbltplalkdhdjkupq
```

Your project ref is in the Supabase dashboard under **Project Settings → General**.

### Option A — Run SQL directly

```bash
npx supabase db query --linked < db/schema.sql
```

### Option B — Push as a migration

```bash
npx supabase migration new init_schema
```

Copy the contents of `db/schema.sql` into the generated file at `supabase/migrations/<timestamp>_init_schema.sql`, then:

```bash
npx supabase db push
```

Option B is recommended if you want to track schema changes over time via migration files.

### How migrations work

Each migration is a discrete SQL file representing one change. Supabase tracks which migrations have already been applied, so `db push` only runs new ones.

**Adding a new table or column in the future**

```bash
npx supabase migration new add_users_table
# write only the new CREATE/ALTER statements in the generated file
npx supabase db push
```

Rules to follow:
- Each migration file should only contain the **delta** — what's changing, not the full schema
- Never edit an already-pushed migration file — create a new one instead
- Migration files are ordered by timestamp and always run in sequence

`db/schema.sql` in this repo serves as a human-readable reference of the full schema, but the source of truth for Supabase is the `supabase/migrations/` folder.

## Seeding sample data

`db/seed.sql` contains 10 sample posts with categories and tags. It is idempotent — safe to run multiple times.

```bash
npx supabase db query --linked < db/seed.sql
```

To reset and re-seed from scratch, truncate first:

```bash
npx supabase db query --linked --sql "truncate post_tag_mapping, post, tag, category restart identity cascade;"
```

Then re-run the seed command above.
