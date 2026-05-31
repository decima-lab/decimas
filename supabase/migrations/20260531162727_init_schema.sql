create extension if not exists "pgcrypto";

create table category (
  id uuid primary key default gen_random_uuid(),
  label text not null
);

create table post (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  category uuid references category(id),
  logo_url text,
  link text,
  is_verified bool not null default false,
  is_global bool not null default false,
  is_deleted bool not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id),
  metadata jsonb
);

create table tag (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text
);

create table post_tag_mapping (
  post_id uuid not null references post(id) on delete cascade,
  tag_id uuid not null references tag(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  primary key (user_id, role)
);

create table post_vote (
  post_id uuid not null references post(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote    smallint not null check (vote in (1, -1)),
  primary key (post_id, user_id)
);

create view post_with_votes as
  select
    p.*,
    coalesce(sum(case when v.vote = 1 then 1 else 0 end), 0)  as upvotes,
    coalesce(sum(case when v.vote = -1 then 1 else 0 end), 0) as downvotes,
    coalesce(sum(v.vote), 0)                                   as vote_score
  from post p
  left join post_vote v on v.post_id = p.id
  where not p.is_deleted
  group by p.id;

-- is_admin() runs with owner privileges (security definer) to avoid
-- infinite recursion when policies on other tables check user_roles.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function private.is_editor_or_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;

-- Mirror of auth.users that lives in our own schema so we can query emails
-- with normal RLS-protected reads (no security-definer RPCs needed).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

create unique index profiles_email_idx on profiles (email);

-- Trigger keeps profiles in sync with auth.users on signup + email change.
-- security definer because the trigger inserts into a table the auth schema
-- normally can't write to.
create or replace function handle_auth_user_change()
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

drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
  after insert or update of email on auth.users
  for each row execute function handle_auth_user_change();

-- Backfill for users that already existed before this table was added.
insert into profiles (id, email)
  select u.id, lower(u.email)
  from auth.users u
  where u.email is not null
  on conflict (id) do update set email = excluded.email;

-- Data API grants (required from May 30 for new projects, Oct 30 for existing)
grant select on category to anon;
grant select, insert, update, delete on category to authenticated, service_role;

grant select on post to anon;
grant select, insert, update, delete on post to authenticated, service_role;

grant select on tag to anon;
grant select, insert, update, delete on tag to authenticated, service_role;

grant select on post_tag_mapping to anon;
grant select, insert, update, delete on post_tag_mapping to authenticated, service_role;

grant select, insert, update, delete on user_roles to authenticated, service_role;

grant select on profiles to authenticated;
grant select, insert, update, delete on profiles to service_role;

grant select on post_vote to anon;
grant select, insert, update, delete on post_vote to authenticated, service_role;

grant select on post_with_votes to anon, authenticated, service_role;

-- RLS: category
alter table category enable row level security;

create policy "public can read categories" on category
  for select using (true);

create policy "admins can write categories" on category
  for all using (
    private.is_admin()
  );

-- RLS: post
alter table post enable row level security;

create policy "public can read posts" on post
  for select using (true);

create policy "editors and admins can write posts" on post
  for all using (
    private.is_editor_or_admin()
  );

-- RLS: tag
alter table tag enable row level security;

create policy "public can read tags" on tag
  for select using (true);

create policy "admins can write tags" on tag
  for all using (
    private.is_admin()
  );

-- RLS: post_tag_mapping
alter table post_tag_mapping enable row level security;

create policy "public can read post_tag_mapping" on post_tag_mapping
  for select using (true);

-- Admins can manage any post's tags; editors only their own draft posts
-- (mirrors the post-edit rule enforced in updatePost).
create policy "manage post_tag_mapping" on post_tag_mapping
  for all using (
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

-- RLS: post_vote
alter table post_vote enable row level security;

create policy "public can read votes" on post_vote
  for select using (true);

create policy "users can manage own vote" on post_vote
  for all using ((select auth.uid()) = user_id);

-- RLS: user_roles
alter table user_roles enable row level security;

create policy "users can read own role" on user_roles
  for select using ((select auth.uid()) = user_id);

create policy "admins can write user_roles" on user_roles
  for all using (private.is_admin());

-- RLS: profiles. Users can read their own; admins can read all.
-- No write policies — only the trigger writes (as security definer, so RLS
-- doesn't apply to it).
alter table profiles enable row level security;

create policy "users can read own profile" on profiles
  for select using ((select auth.uid()) = id);

create policy "admins can read all profiles" on profiles
  for select using (private.is_admin());
