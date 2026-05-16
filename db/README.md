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
