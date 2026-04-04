"use client";

import { useEffect, useState } from "react";
import { useStrapiUser } from "@/lib/useStrapi";
import { BookmarkSimple } from "@phosphor-icons/react";
import { savedPosts as savedApi } from "@/lib/strapi";
import type { Post } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import EmptyState from "@/components/ui/EmptyState";

export default function BookmarksPage() {
  const { strapiToken } = useStrapiUser();
  const [postList, setPostList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!strapiToken) return;
        const res = await savedApi.list(strapiToken);
        const posts = (res.data || []).map((sp) => sp.post).filter(Boolean) as Post[];
        setPostList(posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [strapiToken]);

  return (
    <div>
      <div className="sticky top-[60px] z-10 bg-surface border-b border-border px-4 py-3">
        <h1 className="font-semibold text-base">Bookmarks</h1>
      </div>
      {loading ? (
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
        </div>
      ) : postList.length === 0 ? (
        <EmptyState icon={<BookmarkSimple size={48} />} title="No bookmarks yet" description="Save posts to read them later." />
      ) : (
        postList.map((post) => <PostCard key={post.documentId} post={post} />)
      )}
    </div>
  );
}
