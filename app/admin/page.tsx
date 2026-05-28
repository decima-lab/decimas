import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { getAllPosts } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";
import { AdminClient } from "./_components/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const isAdmin = roles.includes("admin");
  const isEditor = roles.includes("editor");

  if (!isAdmin && !isEditor) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Access required</h1>
          <p className="mt-2 text-muted-foreground">
            You need admin or editor access to view this page.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createClient(await cookies());

  const posts = await getAllPosts(supabase);

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("category").select("id, label").order("label"),
    supabase.from("tag").select("id, label").order("label"),
  ]);

  const authors: Record<string, string> = {};
  let usersWithRoles: { id: string; email: string; roles: string[] }[] = [];
  let editorCount = 0;

  if (isAdmin) {
    const [{ data: profilesData }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("id, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    (rolesData ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    });

    const allUsers = profilesData ?? [];
    allUsers.forEach((u) => {
      if (u.email) authors[u.id] = u.email;
    });

    usersWithRoles = allUsers
      .map((u) => ({
        id: u.id,
        email: u.email ?? "(no email)",
        roles: rolesByUser.get(u.id) ?? [],
      }))
      .filter((u) => u.roles.length > 0)
      .sort((a, b) => a.email.localeCompare(b.email));

    editorCount = usersWithRoles.filter((u) =>
      u.roles.includes("editor"),
    ).length;
  } else if (user.email) {
    authors[user.id] = user.email;
  }

  const activePosts = posts.filter((p) => !p.is_deleted);
  const metrics = {
    totalPosts: activePosts.length,
    drafts: activePosts.filter((p) => p.status === "draft").length,
    published: activePosts.filter((p) => p.status === "published").length,
    editorCount,
  };

  return (
    <AdminClient
      currentUser={{
        id: user.id,
        email: user.email ?? "",
        isAdmin,
      }}
      posts={posts}
      categories={categories ?? []}
      tags={tags ?? []}
      users={usersWithRoles}
      metrics={metrics}
      authors={authors}
    />
  );
}
