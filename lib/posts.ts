import type { SupabaseClient } from "@supabase/supabase-js";

export type Tag = {
  label: string;
  category: string;
};

export type Post = {
  id: string;
  label: string;
  description: string;
  logo_url: string;
  link: string;
  is_verified: boolean;
  is_global: boolean;
  category: { label: string } | null;
  post_tag_mapping: { tag: Tag }[];
};

export type FormattedPost = {
  id: string;
  name: string;
  description: string;
  category: string;
  link: string;
  isVerified: boolean;
  isGlobal: boolean;
  tags: string[];
};

export async function getPosts(supabase: SupabaseClient): Promise<Post[]> {
  const { data, error } = await supabase
    .from("post")
    .select("*, category(label), post_tag_mapping(tag(label, category))");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function formatPost(post: Post): FormattedPost {
  return {
    id: post.id,
    name: post.label,
    description: post.description ?? "",
    category: post.category?.label ?? "Uncategorised",
    link: post.link ?? "",
    isVerified: post.is_verified,
    isGlobal: post.is_global,
    tags: post.post_tag_mapping.map((m) => m.tag.label),
  };
}

export function formatPosts(posts: Post[]): FormattedPost[] {
  return posts.map(formatPost);
}
