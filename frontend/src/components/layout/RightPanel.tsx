"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { circles as circlesApi, posts as postsApi } from "@/lib/strapi";
import type { Circle, Post } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import { TrendUp } from "@phosphor-icons/react";

export default function RightPanel({ children }: { children?: React.ReactNode }) {
  const [circleList, setCircleList] = useState<Circle[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);

  useEffect(() => {
    circlesApi.list().then((res) => setCircleList(res.data || [])).catch(() => {});
    postsApi.list({ sort: "upvoteCount:desc", "pagination[pageSize]": "5" })
      .then((res) => setTrending(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden xl:block w-[320px] shrink-0 sticky top-[84px] h-[calc(100vh-84px)] overflow-y-auto pl-6 pr-4 space-y-4">
      {children}

      {/* Trending posts */}
      {trending.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-bold text-[15px] flex items-center gap-1.5">
              <TrendUp size={16} className="text-brand" /> Trending
            </h3>
          </div>
          {trending.map((post, i) => (
            <Link
              key={post.documentId}
              href={`/post/${post.documentId}`}
              className="flex gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold text-text-tertiary mt-0.5">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-text-primary leading-snug line-clamp-2">{post.title}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  {post.upvoteCount} upvotes &middot; {post.commentCount} comments
                </p>
              </div>
            </Link>
          ))}
          <Link href="/" className="block px-4 py-2.5 text-[13px] text-brand font-medium hover:bg-gray-50 transition-colors">
            Show more
          </Link>
        </div>
      )}

      {/* Circles */}
      {circleList.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-bold text-[15px]">Circles</h3>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {circleList.map((c) => (
              <Link
                key={c.documentId}
                href={`/circle/${c.slug}`}
                className="text-[12px] font-medium text-text-secondary bg-gray-50 hover:bg-brand-light hover:text-brand px-2.5 py-1 rounded-full transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 pb-4">
        <p className="text-[11px] text-text-tertiary leading-relaxed">
          Headstart &middot; The professional network for early stage founders
        </p>
      </div>
    </aside>
  );
}
