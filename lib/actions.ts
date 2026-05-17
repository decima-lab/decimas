"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type Role, requireAdmin, requireEditorOrAdmin } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

// ---------- Auth ----------

export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- Posts ----------

export type PostInput = {
  label: string;
  description?: string | null;
  link?: string | null;
  categoryId?: string | null;
  isVerified?: boolean;
  isGlobal?: boolean;
};

export async function createPost(input: PostInput) {
  const { user } = await requireEditorOrAdmin();
  const supabase = createClient(await cookies());

  const { error } = await supabase.from("post").insert({
    label: input.label,
    description: input.description ?? null,
    link: input.link ?? null,
    category: input.categoryId ?? null,
    is_verified: input.isVerified ?? false,
    is_global: input.isGlobal ?? false,
    status: "draft",
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updatePost(id: string, input: PostInput) {
  const { user, roles } = await requireEditorOrAdmin();
  const supabase = createClient(await cookies());

  const isAdmin = roles.includes("admin");

  if (!isAdmin) {
    const { data: existing, error: fetchErr } = await supabase
      .from("post")
      .select("created_by, status")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) throw new Error("Post not found");
    if (existing.created_by !== user.id) {
      throw new Error("Editors can only edit their own posts");
    }
    if (existing.status !== "draft") {
      throw new Error("Editors can only edit drafts");
    }
  }

  const { error } = await supabase
    .from("post")
    .update({
      label: input.label,
      description: input.description ?? null,
      link: input.link ?? null,
      category: input.categoryId ?? null,
      is_verified: input.isVerified ?? false,
      is_global: input.isGlobal ?? false,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deletePost(id: string) {
  await requireAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("post")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function restorePost(id: string) {
  await requireAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("post")
    .update({ is_deleted: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function publishPost(id: string) {
  await requireAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("post")
    .update({ status: "published" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function unpublishPost(id: string) {
  await requireAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("post")
    .update({ status: "draft" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------- User roles ----------

export async function promoteUser(email: string, role: Role) {
  await requireAdmin();
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");

  const supabase = createClient(await cookies());
  const { data: profile, error: lookupErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (lookupErr) throw new Error(lookupErr.message);
  if (!profile) throw new Error(`No user found with email ${email}`);

  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: profile.id, role },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function demoteUser(userId: string, role: Role) {
  await requireAdmin();
  const supabase = createClient(await cookies());
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
