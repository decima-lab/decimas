#!/bin/bash
set -e

echo "Dropping existing tables..."
npx supabase db query --linked "
drop table if exists post_tag_mapping cascade;
drop table if exists post_vote cascade;
drop table if exists user_roles cascade;
drop table if exists post cascade;
drop table if exists tag cascade;
drop table if exists category cascade;
drop table if exists profiles cascade;
drop view if exists post_with_votes;
drop schema if exists private cascade;
"

echo "Applying schema..."
npx supabase db query --linked -f db/schema.sql

echo "Seeding data..."
npx supabase db query --linked -f db/seed.sql

echo "Done."
