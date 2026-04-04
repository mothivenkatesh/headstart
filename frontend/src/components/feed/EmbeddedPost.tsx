"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function EmbeddedPost({ post }: { post: Post }) {
  return (
    <Link
      href={`/post/${post.documentId}`}
      className="block border border-border rounded-2xl p-3 mt-2 hover:bg-gray-50/50 active:bg-gray-100/50 active:scale-[0.995] transition-all"
    >
      {/* Author row */}
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar src={post.author?.avatar} name={post.author?.fullName} size="xs" />
        <span className="font-bold text-[13px] text-text-primary">{post.author?.fullName || "User"}</span>
        <span className="text-[13px] text-text-tertiary">@{post.author?.handle || "user"}</span>
        <span className="text-[13px] text-text-tertiary">&middot;</span>
        <span className="text-[13px] text-text-tertiary">{timeAgo(post.createdAt)}</span>
      </div>
      {/* Content */}
      <h4 className="font-semibold text-[14px] text-text-primary leading-snug">{post.title}</h4>
      {post.body && (
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-3 mt-0.5">{post.body}</p>
      )}
      {/* Image preview */}
      {post.link && post.link.startsWith("http") && (
        <div className="mt-2 rounded-xl overflow-hidden border border-border">
          <img src={post.link} alt="" className="w-full h-[120px] object-cover" loading="lazy" />
        </div>
      )}
      {/* Circle */}
      {post.circle && (
        <span className="inline-block mt-2 text-[11px] font-medium text-brand bg-brand-light/60 px-2 py-0.5 rounded">{post.circle.name}</span>
      )}
    </Link>
  );
}
