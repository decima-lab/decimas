import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type Role = "admin" | "editor";

async function loadUserAndRoles() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, roles: [] as Role[] };

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (data ?? [])
    .map((r) => r.role as string)
    .filter((r): r is Role => r === "admin" || r === "editor");

  return { user, roles };
}

export async function getCurrentUserAndRoles() {
  return loadUserAndRoles();
}

export async function requireAdmin() {
  const { user, roles } = await loadUserAndRoles();
  if (!user) throw new Error("Unauthorized");
  if (!roles.includes("admin")) {
    throw new Error("Forbidden: admin role required");
  }
  return { user, roles };
}

export async function requireEditorOrAdmin() {
  const { user, roles } = await loadUserAndRoles();
  if (!user) throw new Error("Unauthorized");
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("Forbidden: editor or admin role required");
  }
  return { user, roles };
}
