import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPost = {
  id: string;
  label: string;
  description: string | null;
  link: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_global: boolean;
  is_deleted: boolean;
  status: "draft" | "published";
  created_by: string | null;
  category: { id: string; label: string } | null;
  post_tag_mapping: { tag: { id: string; label: string } }[];
};

export async function getAdminPosts(
  supabase: SupabaseClient,
): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("post")
    .select(
      "id, label, description, link, logo_url, is_verified, is_global, is_deleted, status, created_by, category(id, label), post_tag_mapping(tag(id, label))",
    )
    .order("status", { ascending: true })
    .order("label");

  if (error) throw new Error(error.message);
  return (data as unknown as AdminPost[]) ?? [];
}
