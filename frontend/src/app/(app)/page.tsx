"use client";

import { useEffect, useState, useCallback } from "react";
import { posts as postsApi, circles as circlesApi, reposts as repostsApi } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Post, Circle, Repost } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import RepostCard from "@/components/feed/RepostCard";
import Composer from "@/components/feed/Composer";
import FeedTabs from "@/components/feed/FeedTabs";
import EmptyState from "@/components/ui/EmptyState";
import { Article } from "@phosphor-icons/react";
import PullToRefresh from "@/components/ui/PullToRefresh";

type FeedItem = { type: "post"; data: Post; sortDate: string } | { type: "repost"; data: Repost; sortDate: string };

export default function FeedPage() {
  const { strapiToken, isReady } = useStrapiUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [circleList, setCircleList] = useState<Circle[]>([]);
  const [activeTab, setActiveTab] = useState("For You");
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab === "Trending") {
        params["sort"] = "upvoteCount:desc";
      }
      const postsRes = await postsApi.list(params);
      const posts: FeedItem[] = (postsRes.data || []).map((p) => ({
        type: "post" as const,
        data: p,
        sortDate: p.createdAt,
      }));

      // Fetch reposts if user is authenticated
      let repostItems: FeedItem[] = [];
      if (isReady && strapiToken) {
        try {
          const repostsRes = await repostsApi.list(strapiToken);
          repostItems = (repostsRes.data || [])
            .filter((r) => r.originalPost)
            .map((r) => ({
              type: "repost" as const,
              data: r,
              sortDate: r.createdAt,
            }));
        } catch {
          // Reposts might fail if not authenticated — that's fine
        }
      }

      // Merge and sort by date
      const merged = [...posts, ...repostItems].sort(
        (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
      );

      setFeedItems(merged);
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isReady, strapiToken]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    circlesApi.list().then((res) => setCircleList(res.data || [])).catch(console.error);
  }, []);

// Press R to refresh feed (not when typing)  useEffect(() => {    const h = (e: KeyboardEvent) => {      if (e.key === "r" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) fetchFeed();    };    window.addEventListener("keydown", h);    return () => window.removeEventListener("keydown", h);  }, [fetchFeed]);
  return (
    <PullToRefresh onRefresh={async () => { await fetchFeed(); }}>
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-10 bg-surface">
        <FeedTabs active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Composer */}
      <Composer circles={circleList} onPostCreated={(newPost) => {
            if (newPost) {
              setFeedItems((prev) => [{ type: 'post' as const, data: newPost, sortDate: newPost.createdAt || new Date().toISOString() }, ...prev]);
            } else {
              fetchFeed();
            }
          }} />

      {/* Feed */}
      {loading ? (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 border-b border-border animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3.5 bg-gray-200 rounded" />
                  <div className="w-20 h-2.5 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="ml-[52px] space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-full h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <EmptyState
          icon={<Article size={48} />}
          title="No posts yet"
          description="Be the first to start a conversation in Headstart."
        />
      ) : (
        feedItems.map((item) =>
          item.type === "repost" ? (
            <RepostCard key={`repost-${item.data.documentId}`} repost={item.data as Repost} onDeleted={fetchFeed} />
          ) : (
            <PostCard key={`post-${item.data.documentId}`} post={item.data as Post} onDeleted={fetchFeed} />
          )
        )
      )}
    </div>
    </PullToRefresh>
  );
}