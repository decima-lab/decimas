import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPost = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  link: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_global: boolean;
  is_deleted: boolean;
  effort_level: number;
  earn_up_to_amount: number;
  earn_up_to_currency: string;
  status: "draft" | "published";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; label: string } | null;
  post_tag_mapping: {
    tag: { id: string; label: string; category: string | null };
  }[];
};

export async function getAllPosts(
  supabase: SupabaseClient,
): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("post")
    .select(
      "id, slug, label, description, link, logo_url, is_verified, is_global, is_deleted, effort_level, earn_up_to_amount, earn_up_to_currency, status, created_by, created_at, updated_at, category(id, label), post_tag_mapping(tag(id, label, category))",
    )
    .order("status", { ascending: true })
    .order("label");

  if (error) throw new Error(error.message);
  return (data as unknown as AdminPost[]) ?? [];
}
