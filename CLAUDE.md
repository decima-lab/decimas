@AGENTS.md
This project is about a website that acts as a website directory.
A list of compiled websites where users can get money online.

## Tech Stack
- Next.js 16 (app router, `proxy.ts` for route protection — replaces `middleware.ts`)
- React 19
- Supabase (auth + postgres db, plus Supabase CLI migrations under `supabase/`)
- Tailwind CSS v4 (`@tailwindcss/postcss`), `tailwind-merge` for the `cn` helper
- `lucide-react` for icons
- Biome (linting + formatting)
- Vitest (unit tests)

## Project Structure
- `app/` — Next.js pages
  - `app/page.tsx` — landing page (Banner + Search + Card grid)
  - `app/login/page.tsx` — login form (styled via `AuthShell` split-screen layout)
  - `app/admin/page.tsx` — server component, auth + role gate
  - `app/admin/_components/admin-client.tsx` — admin dashboard UI
  - `app/admin/_components/post-dialog.tsx` — post create/edit dialog
- `components/` — **stateful** app components (kebab-case files, PascalCase named exports): `site-header.tsx`, `posts-search.tsx`
- `components/ui/` — **stateless** primitives and presentational chrome (alert-dialog, badge, banner, button, card, container, dialog, dropdown-menu, footer, input, label, logo, post-card, select, separator, sonner, table, tabs, textarea). Includes both generic shadcn-style primitives and app-specific stateless components.
  - Convention: stateless → `ui/`, stateful → `components/`. Imports are direct (no barrel).
- `lib/` — business logic
  - `auth.ts` — server-only `getCurrentUserAndRoles`, `requireAdmin`, `requireEditorOrAdmin`
  - `actions.ts` — server actions: `signIn`/`signOut`, post CRUD (`createPost`, `updatePost`, `deletePost`, `restorePost`, `publishPost`, `unpublishPost`), role mgmt (`promoteUser`, `demoteUser`)
  - `posts.ts` — `getAdminPosts` query + `AdminPost` type
  - `toast.ts`, `utils.ts` (`cn` via `tailwind-merge`)
  - `*.test.ts` — Vitest unit tests
- `utils/supabase/` — Supabase client/server/middleware setup
- `db/` — `schema.sql`, `seed.sql`, `reset.sh`, `README.md`
- `supabase/migrations/` — Supabase CLI migration files
- `proxy.ts` — route protection at project root

## What's Built
- Landing page (`/`) — styled with custom Tailwind components, placeholder card grid
- Login page (`/login`) — functional via `useActionState` + `signIn` server action; styled with the `AuthShell` split-screen layout, `PasswordInput` (show/hide), and a forgot-password dialog
- Header — client component, auth-aware (shows Sign In or Admin link)
- Admin page (`/admin`) — protected, gated by `admin` or `editor` role
  - Loads posts/categories/tags
  - Admins additionally see all users with roles + metrics (totals, drafts, published, editor count)
  - Editors only see their own posts; can only edit their own drafts
- Admin dashboard UI (tabs, table, dialog) built on `components/ui/*` shadcn-style primitives
- Server actions for post CRUD (with editor vs admin scoping) and role promote/demote
- DB schema: `post`, `category`, `tag`, `post_tag_mapping`, `user_roles`, `profiles`, `post_vote`, plus `post_with_votes` view
- `profiles` table mirrored from `auth.users` via `handle_auth_user_change` trigger (security definer)
- RLS using `private.is_admin()` and `private.is_editor_or_admin()` security-definer functions
- Vitest tests: `auth.test.ts`, `actions.test.ts`, `posts.test.ts`
- CI: `npm run ci` — `tsc --noEmit` + biome check + vitest

## Testing
- Always run tests via `npm run ci` (runs `tsc --noEmit` + biome check + vitest). Do not invoke `vitest` / `npx vitest` directly.
- Test files live next to the code under test as `*.test.ts` in `lib/`.
- Structure: outer `describe` names the unit under test (function or grouping). Nested `describe` blocks name the **scenario** as `"when <condition>"`. Each `it` reads as the **outcome** so `describe + it` form one sentence.
- Test body comments: only the markers `// # GIVEN`, `// # WHEN`, `// # THEN` (use `// # WHEN / # THEN` when the action and assertion collapse into one `await expect(...).rejects` line). No other explanatory comments — keep `biome-ignore` directives where lint requires them.
- Example:
  ```ts
  describe("getCurrentUserAndRoles", () => {
    describe("when an admin is signed in", () => {
      it("returns the user and their role", async () => {
        // # GIVEN
        setUser({ id: "u1" });
        setRoles(["admin"]);
        // # WHEN
        const result = await getCurrentUserAndRoles();
        // # THEN
        expect(result.user?.id).toBe("u1");
        expect(result.roles).toEqual(["admin"]);
      });
    });
  });
  ```

## Next Steps
1. Wire the landing page card grid to real posts — `PostCard` is now prop-driven (`label`, `description`, `link`, `logoUrl`, `isVerified`, `isGlobal`, `createdAt`), but `app/page.tsx` still feeds it 10 placeholder objects via `Array.from`
2. Make `PostsSearch` functional (currently `console.log`s) and migrate it onto the `Input`/`Select` primitives (needs a `Checkbox` primitive)
3. Build category/tag CRUD in the admin (post CRUD is done; no `createCategory` / `createTag` actions yet)
