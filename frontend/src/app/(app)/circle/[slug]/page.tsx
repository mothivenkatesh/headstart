"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Article } from "@phosphor-icons/react";
import { posts as postsApi, circles as circlesApi } from "@/lib/strapi";
import type { Post, Circle } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import EmptyState from "@/components/ui/EmptyState";

export default function CirclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [postList, setPostList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Find circle by slug
        const circlesRes = await circlesApi.list();
        const found = (circlesRes.data || []).find((c) => c.slug === slug);
        if (!found) { setLoading(false); return; }
        setCircle(found);

        // Fetch posts in this circle
        const postsRes = await postsApi.list({
          "filters[circle][documentId][$eq]": found.documentId,
        });
        setPostList(postsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="px-4 py-3 border-b border-border flex gap-3">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-border">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-3.5 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!circle) {
    return <div className="py-20 text-center text-[15px] text-text-tertiary">Circle not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-10 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-text-primary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg">{circle.name}</h1>
            <p className="text-[12px] text-text-tertiary">{postList.length} posts</p>
          </div>
        </div>
        {circle.description && (
          <p className="px-4 pb-3 text-[13px] text-text-secondary">{circle.description}</p>
        )}
      </div>

      {/* Posts */}
      {postList.length === 0 ? (
        <EmptyState
          icon={<Article size={48} />}
          title={`No posts in ${circle.name} yet`}
          description="Be the first to start a discussion in this circle."
        />
      ) : (
        postList.map((post) => <PostCard key={post.documentId} post={post} />)
      )}
    </div>
  );
}
