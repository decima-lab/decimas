@AGENTS.md
This project is about a website that acts as a website directory.
A list of compiled websites where users can get money online.

## Tech Stack
- Next.js 16 (app router, `proxy.ts` for route protection — replaces `middleware.ts`)
- Supabase (auth + postgres db)
- Tailwind CSS v4
- Biome (linting + formatting)
- Vitest (unit tests)

## Project Structure
- `app/` — Next.js pages (`page.tsx`, `login/page.tsx`, `admin/page.tsx`)
- `app-components/` — shared components (`Header`, `PostsViewer`)
- `lib/` — business logic (`posts.ts`, `actions.ts`)
- `utils/supabase/` — Supabase client setup (client, server, middleware)
- `db/` — `schema.sql`, `seed.sql`, `README.md`
- `proxy.ts` — route protection at project root

## What's Built
- Landing page with post listing (View Data button)
- Login page (email/password via Supabase auth)
- Admin page (protected, shows logged-in user)
- Header with Login/Logout/Admin links based on auth state
- DB schema: `post`, `category`, `tag`, `post_tag_mapping`, `user_roles`
- RLS policies using `private.is_admin()` security definer function
- CI: `npm run ci` (biome lint + vitest)

## Next Steps
1. Install and configure shadcn/ui for styling
2. Style login page, header, and landing page
3. Build admin CRUD page for managing posts, categories, tags