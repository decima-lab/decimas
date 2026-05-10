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
npx supabase db execute --file db/schema.sql
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

## Seeding sample data

`db/seed.sql` contains 10 sample posts with categories and tags. It is idempotent — safe to run multiple times.

```bash
npx supabase db execute --file db/seed.sql
```

To reset and re-seed from scratch, truncate first:

```bash
npx supabase db execute --sql "truncate post_tag_mapping, post, tag, category restart identity cascade;"
```

Then re-run the seed command above.
