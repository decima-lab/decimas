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
