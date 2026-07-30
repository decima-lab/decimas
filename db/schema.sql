-- =============================================================================
-- EXTENSIONS
-- =============================================================================

create extension if not exists "pgcrypto"; -- provides gen_random_uuid()


-- =============================================================================
-- SCHEMAS
-- =============================================================================

-- Private schema for internal security-definer functions.
-- Kept out of the public schema so they are not exposed via the REST API.
create schema if not exists private;


-- =============================================================================
-- TABLES & INDEXES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- category
-- Lookup table for post categories (e.g. Freelancing, Passive Income).
-- -----------------------------------------------------------------------------
create table category (
  id    uuid primary key default gen_random_uuid(),
  label text not null
);

-- -----------------------------------------------------------------------------
-- tag
-- Filterable labels attached to posts (e.g. Global, PayPal, Beginner Friendly).
-- Tags are grouped by a category string (e.g. Location, Payment Type).
-- -----------------------------------------------------------------------------
create table tag (
  id       uuid primary key default gen_random_uuid(),
  label    text not null,
  category text
);

-- -----------------------------------------------------------------------------
-- post
-- Core content table. Each row is one money-making opportunity.
-- status: 'draft' (hidden from public) | 'published' (visible).
-- is_deleted: soft delete flag — rows are never hard deleted.
-- -----------------------------------------------------------------------------
create table post (
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        not null unique,
  label               text        not null,
  description         text,
  category            uuid        not null references category(id),
  logo_url            text,
  link                text,
  is_verified         bool        not null default false,
  is_global           bool        not null default false,
  is_deleted          bool        not null default false,
  effort_level        smallint    not null default 3
                                  check (effort_level between 1 and 5),
  earn_up_to_amount   integer     not null default 0
                                  check (earn_up_to_amount >= 0),
  earn_up_to_currency text        not null default 'USD'
                                  check (char_length(earn_up_to_currency) = 3),
  status              text        not null default 'draft' check (status in ('draft', 'published')),
  created_by          uuid        references auth.users(id),
  metadata            jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  search_vector       tsvector    generated always as (
    to_tsvector('english', coalesce(label, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index post_category_idx on post (category);
create index post_search_idx on post using gin(search_vector);

-- -----------------------------------------------------------------------------
-- post_tag_mapping
-- Many-to-many join between posts and tags.
-- -----------------------------------------------------------------------------
create table post_tag_mapping (
  post_id uuid not null references post(id) on delete cascade,
  tag_id  uuid not null references tag(id)  on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tag_mapping_tag_idx on post_tag_mapping (tag_id);

-- -----------------------------------------------------------------------------
-- user_roles
-- Grants elevated permissions to specific users.
-- Supported roles: 'admin', 'editor'.
-- -----------------------------------------------------------------------------
create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role    text not null,
  primary key (user_id, role)
);

-- -----------------------------------------------------------------------------
-- post_vote
-- One vote per user per post. vote: 1 = upvote, -1 = downvote.
-- -----------------------------------------------------------------------------
create table post_vote (
  post_id uuid     not null references post(id)       on delete cascade,
  user_id uuid     not null references auth.users(id) on delete cascade,
  vote    smallint not null check (vote in (1, -1)),
  primary key (post_id, user_id)
);

create index post_vote_user_idx on post_vote (user_id);

-- -----------------------------------------------------------------------------
-- profiles
-- Mirror of auth.users kept in public schema so emails can be queried
-- with normal RLS-protected reads (no security-definer RPCs needed).
-- Written exclusively by the handle_auth_user_change trigger — no direct writes.
-- -----------------------------------------------------------------------------
create table profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

create unique index profiles_email_idx on profiles (email);


-- =============================================================================
-- VIEWS
-- =============================================================================

-- post_with_votes
-- Aggregates upvotes/downvotes/score onto each non-deleted post.
-- security_invoker = true ensures the querying user's RLS policies apply
-- rather than the view creator's (which would bypass RLS entirely).
create view post_with_votes with (security_invoker = true) as
  select
    p.*,
    coalesce(sum(case when v.vote =  1 then 1 else 0 end), 0) as upvotes,
    coalesce(sum(case when v.vote = -1 then 1 else 0 end), 0) as downvotes,
    coalesce(sum(v.vote), 0)                                   as vote_score
  from post p
  left join post_vote v on v.post_id = p.id
  where not p.is_deleted
  group by p.id;


-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- private.set_updated_at()
-- Generic trigger function that stamps updated_at = now() on any row update.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- private.is_admin()
-- Returns true if the current user has the 'admin' role.
-- security definer + empty search_path: runs as owner to avoid infinite
-- recursion when RLS policies on other tables query user_roles.
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

-- private.is_editor_or_admin()
-- Returns true if the current user has the 'admin' or 'editor' role.
create or replace function private.is_editor_or_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;

-- handle_auth_user_change()
-- Trigger function that keeps profiles in sync with auth.users.
-- Fires on insert or email update. security definer so it can write to
-- public.profiles from within the auth schema trigger context.
-- Execute is revoked from all roles — only the trigger should call this.
create or replace function private.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null then
    insert into public.profiles (id, email)
    values (new.id, lower(new.email))
    on conflict (id) do update set email = excluded.email;
  end if;
  return new;
end;
$$;


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Keep post.updated_at current on every update.
create trigger post_set_updated_at
  before update on post
  for each row execute function private.set_updated_at();

-- Sync profiles whenever a user signs up or changes their email.
drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
  after insert or update of email on auth.users
  for each row execute function private.handle_auth_user_change();

-- Backfill profiles for any users that existed before this trigger was added.
insert into profiles (id, email)
  select u.id, lower(u.email)
  from auth.users u
  where u.email is not null
  on conflict (id) do update set email = excluded.email;


-- =============================================================================
-- GRANTS
-- =============================================================================
-- Required by Supabase Data API (PostgREST). Grants control which roles can
-- reach each table at the Postgres level — RLS then further restricts rows.

-- anon: unauthenticated visitors (read-only on public content)
-- authenticated: signed-in users
-- service_role: server-side admin access (bypasses RLS)

grant select                            on category        to anon;
grant select, insert, update, delete    on category        to authenticated, service_role;

grant select                            on tag             to anon;
grant select, insert, update, delete    on tag             to authenticated, service_role;

grant select                            on post            to anon;
grant select, insert, update, delete    on post            to authenticated, service_role;

grant select                            on post_tag_mapping to anon;
grant select, insert, update, delete    on post_tag_mapping to authenticated, service_role;

grant select                            on post_vote       to anon;
grant select, insert, update, delete    on post_vote       to authenticated, service_role;

grant select, insert, update, delete    on user_roles      to authenticated, service_role;

grant select                            on profiles        to authenticated;
grant select, insert, update, delete    on profiles        to service_role;

grant select                            on post_with_votes to anon, authenticated, service_role;


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Policies are evaluated after grants. Each table has RLS enabled, meaning
-- even if a role is granted access above, row visibility is further restricted
-- by the policies below.

-- -----------------------------------------------------------------------------
-- category
-- -----------------------------------------------------------------------------
alter table category enable row level security;

create policy "public can read categories"   on category for select using (true);
create policy "admins can insert categories" on category for insert with check (private.is_admin());
create policy "admins can update categories" on category for update using (private.is_admin());
create policy "admins can delete categories" on category for delete using (private.is_admin());

-- -----------------------------------------------------------------------------
-- tag
-- -----------------------------------------------------------------------------
alter table tag enable row level security;

create policy "public can read tags"   on tag for select using (true);
create policy "admins can insert tags" on tag for insert with check (private.is_admin());
create policy "admins can update tags" on tag for update using (private.is_admin());
create policy "admins can delete tags" on tag for delete using (private.is_admin());

-- -----------------------------------------------------------------------------
-- post
-- -----------------------------------------------------------------------------
alter table post enable row level security;

create policy "public can read posts"              on post for select using (true);
create policy "editors and admins can insert posts" on post for insert with check (private.is_editor_or_admin());
create policy "editors and admins can update posts" on post for update using (private.is_editor_or_admin());
create policy "editors and admins can delete posts" on post for delete using (private.is_editor_or_admin());

-- -----------------------------------------------------------------------------
-- post_tag_mapping
-- Admins can manage tags on any post.
-- Editors can only manage tags on their own draft posts.
-- -----------------------------------------------------------------------------
alter table post_tag_mapping enable row level security;

create policy "public can read post_tag_mapping" on post_tag_mapping
  for select using (true);

create policy "manage post_tag_mapping insert" on post_tag_mapping
  for insert with check (
    private.is_admin()
    or (
      private.is_editor_or_admin()
      and exists (
        select 1 from post p
        where p.id = post_tag_mapping.post_id
          and p.created_by = (select auth.uid())
          and p.status = 'draft'
      )
    )
  );

create policy "manage post_tag_mapping delete" on post_tag_mapping
  for delete using (
    private.is_admin()
    or (
      private.is_editor_or_admin()
      and exists (
        select 1 from post p
        where p.id = post_tag_mapping.post_id
          and p.created_by = (select auth.uid())
          and p.status = 'draft'
      )
    )
  );

-- -----------------------------------------------------------------------------
-- post_vote
-- Anyone can read votes. Users can only manage their own vote.
-- -----------------------------------------------------------------------------
alter table post_vote enable row level security;

create policy "public can read votes"     on post_vote for select using (true);
create policy "users can insert own vote" on post_vote for insert with check ((select auth.uid()) = user_id);
create policy "users can update own vote" on post_vote for update using ((select auth.uid()) = user_id);
create policy "users can delete own vote" on post_vote for delete using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- user_roles
-- Users can see their own role; admins can see everyone's. Only admins can grant/revoke roles.
-- -----------------------------------------------------------------------------
alter table user_roles enable row level security;

create policy "read user_roles" on user_roles for select using ((select auth.uid()) = user_id or private.is_admin());
create policy "admins can insert user_roles" on user_roles for insert with check (private.is_admin());
create policy "admins can update user_roles" on user_roles for update using (private.is_admin());
create policy "admins can delete user_roles" on user_roles for delete using (private.is_admin());

-- -----------------------------------------------------------------------------
-- profiles
-- Users can read their own profile. Admins can read all profiles.
-- No write policies — only the trigger writes to this table.
-- -----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "read profiles" on profiles
  for select using (
    (select auth.uid()) = id or private.is_admin()
  );
