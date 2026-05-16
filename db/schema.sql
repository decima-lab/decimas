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

create policy "admins can write posts" on post
  for all using (
    private.is_admin()
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

create policy "admins can write post_tag_mapping" on post_tag_mapping
  for all using (
    private.is_admin()
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
