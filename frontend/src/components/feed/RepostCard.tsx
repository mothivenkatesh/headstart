"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Repeat, DotsThree, Trash, Flag } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { reposts as repostsApi } from "@/lib/strapi";
import PostCard from "./PostCard";
import EmbeddedPost from "./EmbeddedPost";
import Avatar from "@/components/ui/Avatar";
import type { Repost } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function RepostCard({ repost, onDeleted }: { repost: Repost; onDeleted?: () => void }) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnRepost = isReady && strapiUser && repost.user?.id === strapiUser.id;

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  async function handleDeleteRepost() {
    if (!strapiToken || !confirm("Remove this repost?")) return;
    await repostsApi.delete(repost.documentId, strapiToken).catch(() => {});
    onDeleted?.();
    setShowMenu(false);
  }

  async function handleReport() {
    if (!strapiToken) return;
    const reason = prompt("Why are you reporting this?");
    if (!reason) return;
    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      await fetch(`${STRAPI_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${strapiToken}` },
        body: JSON.stringify({ data: { targetType: "post", targetId: repost.originalPost?.documentId || repost.documentId, reason } }),
      });
      alert("Reported. We'll review it shortly.");
    } catch (err) {
      console.error(err);
    }
    setShowMenu(false);
  }

  if (!repost.originalPost) return null;

  // Simple repost — "X reposted" header + full PostCard
  if (!repost.thoughts) {
    return (
      <div>
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2 sm:ml-[52px]">
            <Repeat size={13} weight="bold" className="text-green-600" />
            <Link href={`/profile/${repost.user?.handle || "unknown"}`} className="text-[13px] text-text-tertiary font-medium hover:underline">
              {repost.user?.fullName || "Someone"} reposted
            </Link>
          </div>
          {isReady && strapiUser && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-black/5 text-text-tertiary transition-colors">
                <DotsThree size={16} weight="bold" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-border rounded-xl shadow-lg py-1 w-52 z-20">
                  {isOwnRepost ? (
                    <button onClick={handleDeleteRepost} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 w-full text-left rounded-xl">
                      <Trash size={16} /> Undo repost
                    </button>
                  ) : (
                    <button onClick={handleReport} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-primary hover:bg-gray-50 w-full text-left rounded-xl">
                      <Flag size={16} /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <PostCard post={repost.originalPost} onDeleted={onDeleted} />
      </div>
    );
  }

  // Quote repost
  return (
    <article className="post-card px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 sm:ml-[52px]">
          <Repeat size={13} weight="bold" className="text-green-600" />
          <span className="text-[13px] text-text-tertiary font-medium">Quote</span>
        </div>
        {isReady && strapiUser && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-black/5 text-text-tertiary transition-colors">
              <DotsThree size={16} weight="bold" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-border rounded-xl shadow-lg py-1 w-52 z-20">
                {isOwnRepost ? (
                  <button onClick={handleDeleteRepost} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 w-full text-left rounded-xl">
                    <Trash size={16} /> Delete quote
                  </button>
                ) : (
                  <button onClick={handleReport} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-primary hover:bg-gray-50 w-full text-left rounded-xl">
                    <Flag size={16} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href={`/profile/${repost.user?.handle || "unknown"}`} className="shrink-0 pt-0.5">
          <Avatar src={repost.user?.avatar} name={repost.user?.fullName} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Link href={`/profile/${repost.user?.handle || "unknown"}`} className="font-bold text-[15px] hover:underline truncate">
              {repost.user?.fullName || "Unknown"}
            </Link>
            <span className="text-[15px] text-text-tertiary">@{repost.user?.handle || "unknown"}</span>
            <span className="text-text-tertiary text-[15px]">&middot;</span>
            <span className="text-text-tertiary text-[15px] shrink-0">{timeAgo(repost.createdAt)}</span>
          </div>
          <p className="text-[15px] text-text-primary leading-[1.5]">{repost.thoughts}</p>
          <EmbeddedPost post={repost.originalPost} />
        </div>
      </div>
    </article>
  );
}
