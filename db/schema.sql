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

-- RLS: category
alter table category enable row level security;

create policy "public can read categories" on category
  for select using (true);

create policy "admins can write categories" on category
  for all using (
    exists (
      select 1 from user_roles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );

-- RLS: post
alter table post enable row level security;

create policy "public can read posts" on post
  for select using (true);

create policy "admins can write posts" on post
  for all using (
    exists (
      select 1 from user_roles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );

-- RLS: tag
alter table tag enable row level security;

create policy "public can read tags" on tag
  for select using (true);

create policy "admins can write tags" on tag
  for all using (
    exists (
      select 1 from user_roles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );

-- RLS: post_tag_mapping
alter table post_tag_mapping enable row level security;

create policy "public can read post_tag_mapping" on post_tag_mapping
  for select using (true);

create policy "admins can write post_tag_mapping" on post_tag_mapping
  for all using (
    exists (
      select 1 from user_roles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );

-- RLS: user_roles (only admins can manage roles)
alter table user_roles enable row level security;

create policy "admins can manage user_roles" on user_roles
  for all using (
    exists (
      select 1 from user_roles
      where user_id = (select auth.uid()) and role = 'admin'
    )
  );
