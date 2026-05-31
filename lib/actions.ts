"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
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

  const redirectTo = formData.get("redirectTo") as string | null;
  const safeRedirect =
    redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

  redirect(safeRedirect);
}

export async function signOut() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  redirect("/");
}

export type PasswordResetState = { error: string } | { success: true } | null;

export async function requestPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  if (!email) return { error: "Email is required" };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const supabase = createClient(await cookies());
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { success: true };
}

export async function resetPassword(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirmPassword") as string | null) ?? "";

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

// ---------- Posts ----------

export type PostInput = {
  label: string;
  description?: string | null;
  link?: string | null;
  categoryId?: string | null;
  isVerified?: boolean;
  isGlobal?: boolean;
  // When provided, replaces the post's tag set. Omit to leave tags untouched.
  tagIds?: string[];
};

// Replace a post's tag mappings with the given tag ids.
async function syncPostTags(
  supabase: SupabaseClient,
  postId: string,
  tagIds: string[],
) {
  const { error: deleteErr } = await supabase
    .from("post_tag_mapping")
    .delete()
    .eq("post_id", postId);
  if (deleteErr) throw new Error(deleteErr.message);

  if (tagIds.length === 0) return;

  const { error: insertErr } = await supabase
    .from("post_tag_mapping")
    .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
  if (insertErr) throw new Error(insertErr.message);
}

export async function createPost(input: PostInput) {
  const { user } = await requireEditorOrAdmin();
  const supabase = createClient(await cookies());

  const row = {
    label: input.label,
    description: input.description ?? null,
    link: input.link ?? null,
    category: input.categoryId ?? null,
    is_verified: input.isVerified ?? false,
    is_global: input.isGlobal ?? false,
    status: "draft" as const,
    created_by: user.id,
  };

  if (input.tagIds && input.tagIds.length > 0) {
    const { data: created, error } = await supabase
      .from("post")
      .insert(row)
      .select("id")
      .single();
    if (error || !created) {
      throw new Error(error?.message ?? "Failed to create post");
    }
    await syncPostTags(supabase, created.id, input.tagIds);
  } else {
    const { error } = await supabase.from("post").insert(row);
    if (error) throw new Error(error.message);
  }
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

  if (input.tagIds !== undefined) {
    await syncPostTags(supabase, id, input.tagIds);
  }
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
