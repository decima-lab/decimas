"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

type Tag = { label: string; category: string };
type Post = {
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

export default function PostsViewer() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchPosts() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("post")
      .select("*, category(label), post_tag_mapping(tag(label, category))");
    console.log("data", data, "error", error);
    setPosts(data ?? []);
    setLoading(false);
  }

  return (
    <div>
      <button type="button" onClick={fetchPosts} disabled={loading}>
        {loading ? "Loading..." : "View Data"}
      </button>

      {posts && (
        <table
          border={1}
          cellPadding={6}
          style={{ marginTop: 16, borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Link</th>
              <th>Global</th>
              <th>Verified</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.label}</td>
                <td>{post.description}</td>
                <td>{post.category?.label ?? "—"}</td>
                <td>
                  <a href={post.link} target="_blank" rel="noreferrer">
                    {post.link}
                  </a>
                </td>
                <td>{post.is_global ? "Yes" : "No"}</td>
                <td>{post.is_verified ? "Yes" : "No"}</td>
                <td>
                  {post.post_tag_mapping.map((m) => m.tag.label).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
