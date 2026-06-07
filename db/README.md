# DB Setup

## Applying the schema to Supabase

### Prerequisites

Install and authenticate the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref imivbltplalkdhdjkupq
```

Your project ref is in the Supabase dashboard under **Project Settings → General**.

### Reset script

`db/reset.sh` is a convenience script that drops all tables, re-applies `schema.sql`, and re-seeds data in one command. Use it during development when you want a clean slate.

```bash
./db/reset.sh
```

### Option A — Run SQL directly

```bash
npx supabase db query --linked -f db/schema.sql
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

Rules to follow:
- Each migration file should only contain the **delta** — what's changing, not the full schema
- Never edit an already-pushed migration file — create a new one instead
- Migration files are ordered by timestamp and always run in sequence

`db/schema.sql` in this repo serves as a human-readable reference of the full schema, but the source of truth for Supabase is the `supabase/migrations/` folder.

## Making schema changes after production is live

Once the app is deployed and prod has real data, you can never wipe and rebuild — you must apply changes incrementally using migration files. Follow this workflow for every schema change:

### The two files you always update together

| File | Purpose |
|---|---|
| `db/schema.sql` | Complete picture of what the DB looks like. Used for dev resets and as a human-readable reference. |
| `supabase/migrations/<timestamp>_<name>.sql` | The delta — only what changed. Applied to prod without touching existing data. |

### Step-by-step workflow

**1. Update `schema.sql` locally**

Make your change directly in `schema.sql` as if you were designing the table from scratch. For example, add a `published_at` column to the `post` table definition.

**2. Write the migration file by hand**

Create a new file in `supabase/migrations/` named `<timestamp>_<description>.sql`. The timestamp must be in `YYYYMMDDHHmmss` format and newer than the last migration:

```bash
# Example filename
supabase/migrations/20260608000000_add_post_published_at.sql
```

Write only the delta — the SQL to bring the live DB from its current state to the new state:

```sql
alter table post add column published_at timestamptz;
```

Since you already know what changed in `schema.sql`, writing the corresponding `ALTER TABLE` is straightforward.

**3. Review the migration file**

Double-check the file before applying it anywhere. Common mistakes: forgetting `if not exists`, wrong column type, missing `not null` default.

**4. Apply to dev first**

Test the migration against your dev Supabase project:

```bash
npx supabase db push --linked
```

Verify your app still works against dev.

**5. Apply to prod**

Point at the prod DB and push:

```bash
npx supabase db push --db-url "postgres://postgres:[password]@db.[prod-ref].supabase.co:5432/postgres"
```

Supabase tracks which migrations have already been applied, so only new files run.

### Rules to follow

- **Never edit a migration file after it has been applied to prod** — create a new one instead
- **Never run `schema.sql` directly against prod** after the initial setup — it will fail or corrupt data
- **Migration files are ordered by timestamp** and always run in sequence
- **`schema.sql` and the migrations must stay in sync** — `schema.sql` should always reflect what you'd get if you ran all migrations from scratch on an empty DB

### Example: adding a column

```
# 1. Edit schema.sql — add `published_at timestamptz` to the post table definition

# 2. Create the migration file
#    supabase/migrations/20260608000000_add_post_published_at.sql
#    Contents: alter table post add column published_at timestamptz;

# 3. Push to dev, test, then push to prod
npx supabase db push --linked
```

## Seeding sample data

`db/seed.sql` contains 10 sample posts with categories and tags. It is idempotent — safe to run multiple times.

```bash
npx supabase db query --linked -f db/seed.sql
```

To reset and re-seed from scratch, truncate first:

```bash
npx supabase db query --linked "truncate post_tag_mapping, post, tag, category restart identity cascade;"
```

Then re-run the seed command above.

## Authentication

### Where users are stored

Supabase manages a built-in `auth.users` table in the `auth` schema. You never create or touch this table — Supabase owns it. When someone registers or logs in, Supabase writes a row here containing their email, a hashed password (bcrypt), a UUID `id`, and metadata like email confirmation status.

Your app tables live in the `public` schema. The `user_roles` table references `auth.users(id)`:

```sql
create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role    text not null,
  primary key (user_id, role)
);
```

This foreign key is how you attach application-level roles to Supabase-managed identities. You don't store passwords or re-implement auth — you only add what Supabase doesn't track natively.

### What happens when someone logs in

1. The browser submits an email + password to the Supabase Auth API (via `supabase.auth.signInWithPassword()`).
2. Supabase verifies the credentials against `auth.users` (bcrypt compare).
3. On success, Supabase returns a **JWT access token** (and a refresh token). The JWT is a signed JSON payload — it contains the user's UUID, email, role, and an expiry timestamp. The signature is made with Supabase's private key, so it cannot be forged.
4. The `@supabase/ssr` library writes this token into an **HttpOnly cookie** on the response. HttpOnly means JavaScript in the browser cannot read the cookie — only the browser and server can see it, which prevents XSS theft.

### How the token travels on subsequent requests

Every request the browser makes to your Next.js app automatically includes the auth cookie (browsers attach cookies to matching-domain requests). In your server-side code:

```ts
// utils/supabase/server.ts
const supabase = createServerClient(url, key, {
  cookies: { getAll: () => cookieStore.getAll(), ... }
});
```

`createServerClient` reads the JWT from the cookie and attaches it as an `Authorization: Bearer <token>` header on every Postgres query it sends to Supabase. Supabase's API layer validates the signature and extracts the user's UUID from the token before the query reaches Postgres.

### How `auth.uid()` works inside Postgres

When Supabase receives a query, it sets a Postgres session variable with the authenticated user's UUID:

```
SET request.jwt.claims = '{"sub": "900fbe1b-...", "role": "authenticated", ...}';
```

The built-in `auth.uid()` function simply reads that session variable:

```sql
select auth.uid(); -- returns the UUID from the JWT, or null for anonymous requests
```

This runs **inside Postgres**, not in your app code. It's not possible to fake it from the client — the JWT signature is validated before the session variable is ever set.

### How RLS uses `auth.uid()`

Row Level Security (RLS) policies run automatically on every query. When a query hits a table with RLS enabled, Postgres evaluates the policy expression before returning or modifying rows. For example:

```sql
-- Only the owner of a row can read it
create policy "users can read own role" on user_roles
  for select using ((select auth.uid()) = user_id);
```

`auth.uid()` here is the UUID Supabase set from the JWT. No matter what a client sends in a query, they can only see rows where `user_id` matches their verified identity.

### Why `private.is_admin()` exists

A naive admin check policy on `user_roles` would query `user_roles` itself to decide if the user is an admin — causing infinite recursion. The fix is a `security definer` function in the `private` schema:

```sql
create schema if not exists private; -- not exposed via PostgREST

create or replace function private.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
```

`security definer` means the function runs with the **owner's privileges**, bypassing RLS for that one internal lookup. The `private` schema is not exposed by PostgREST (Supabase's REST layer), so it can't be called directly from the client. Every write policy on `category`, `post`, `tag`, `post_tag_mapping`, and `user_roles` delegates to this function.

### End-to-end flow for an admin write

```
Browser → POST /admin (with auth cookie)
  → Next.js server reads JWT from cookie
  → supabase.from("post").insert({...})
  → Supabase API validates JWT signature, sets auth.uid() = <admin UUID>
  → Postgres evaluates RLS policy: private.is_admin() → true
  → INSERT succeeds, row returned
```

For an unauthenticated request, `auth.uid()` returns `null`, `private.is_admin()` returns `false`, and the write is rejected by Postgres before it ever executes.

### Allowing the password reset redirect URL

The "Forgot password?" flow calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: "${origin}/auth/callback?next=/reset-password" })`. For security, Supabase only honors that `redirectTo` if the URL is on the project's allowlist — otherwise the reset email link sends users to Supabase's default page (or an error) instead of our `/reset-password` form.

Each Supabase project keeps its own list, so you'll need to set this once per project (dev and prod).

1. Open the project in https://supabase.com/dashboard.
2. **Authentication → URL Configuration**.
3. Under **Redirect URLs**, add the project's `auth/callback` URL:
   - Dev project: `http://localhost:3000/auth/callback`
   - Prod project: `https://<your-domain>/auth/callback`
4. Save.

If a reset email lands on a Supabase error page or bounces to the default Site URL, this allowlist is the first thing to check.

### Sending auth emails (default vs. custom SMTP)

By default, every Supabase project sends auth emails (reset password, confirm signup, etc.) through Supabase's built-in SMTP. No setup needed — but it has two limitations worth knowing:

1. **Rate-limited.** The built-in SMTP caps auth emails at a few per hour per project. Fine for dev, not for real traffic.
2. **Sender is Supabase's domain.** Emails come from `noreply@mail.app.supabase.io` rather than `noreply@<your-domain>`, which hurts trust and deliverability.

**Dev project:** leave the default in place. Nothing to configure.

**Prod project:** before going live, switch to a custom SMTP provider so emails come from your domain and aren't rate-limited.

1. Pick a provider (Resend is the easiest — has a Supabase integration guide; SendGrid, Postmark, Mailgun, and Amazon SES all work too).
2. At the provider, verify your sending domain by adding their SPF/DKIM DNS records. This is what makes emails appear as "from `noreply@<your-domain>`" without landing in spam.
3. In the Supabase dashboard → **Authentication → Emails → SMTP Settings**, enable custom SMTP and paste in the provider's host / port / username / password.

**Customising the email body.** Independent of SMTP — open **Authentication → Emails → Templates** in the dashboard and edit the "Reset Password" template (subject, HTML body, link text). Works with both the default and custom SMTP.
