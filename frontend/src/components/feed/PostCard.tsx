"use client";

import { useState, useEffect, useRef, memo } from "react";
import Link from "next/link";
import {
  ArrowFatUp,
  ArrowFatDown,
  ChatCircle,
  BookmarkSimple,
  Repeat,
  DotsThree,
  Trash,
  ShareNetwork,
  Flag,
} from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import Lightbox from "@/components/ui/Lightbox";
import RepostModal from "./RepostModal";
import { useStrapiUser } from "@/lib/useStrapi";
import { votes as votesApi, savedPosts as savedApi, posts as postsApi, pollVotes as pollApi } from "@/lib/strapi";
import type { Post } from "@/lib/types";
import { timeAgo, formatCount } from "@/lib/utils";

// ─── Poll Widget ──────────────────────────────────────────
function PollWidget({
  postDocumentId,
  options,
  votedIndex,
  onVote,
}: {
  postDocumentId: string;
  options: { text: string; votes: number }[];
  votedIndex: number | null;
  onVote: (idx: number) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
  const hasVoted = votedIndex !== null;
  const maxVotes = Math.max(...options.map((o) => o.votes || 0));

  function handleVote(idx: number) {
    setAnimating(true);
    onVote(idx);
    setTimeout(() => setAnimating(false), 600);
  }

  // Voting view — clean outlined buttons
  if (!hasVoted) {
    return (
      <div className="mt-3 space-y-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            className="group w-full h-11 rounded-full border border-brand/40 text-brand text-[14px] font-medium hover:bg-brand hover:text-white hover:border-brand active:scale-[0.98] transition-all duration-150"
          >
            {opt.text}
          </button>
        ))}
        <p className="text-[12px] text-text-tertiary pl-1">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} &middot; Tap to vote
        </p>
      </div>
    );
  }

  // Results view — animated horizontal bars
  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, idx) => {
        const votes = opt.votes || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isSelected = votedIndex === idx;
        const isWinner = votes === maxVotes && maxVotes > 0;

        return (
          <div key={idx} className="relative">
            {/* Bar container */}
            <div className="relative h-11 rounded-full overflow-hidden bg-gray-50">
              {/* Progress bar — uses inline style for dynamic width */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${animating ? "duration-700 ease-out" : "duration-300"} ${
                  isSelected ? "bg-brand/15" : "bg-gray-100"
                }`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
              {/* Content */}
              <div className="relative flex items-center h-full px-4">
                {/* Left: checkmark + text */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                  <span className={`text-[14px] truncate ${isSelected ? "font-semibold text-text-primary" : isWinner ? "font-medium text-text-primary" : "text-text-secondary"}`}>
                    {opt.text}
                  </span>
                </div>
                {/* Right: percentage */}
                <span className={`text-[14px] tabular-nums shrink-0 ml-3 ${
                  isSelected ? "font-bold text-brand" : isWinner ? "font-semibold text-text-primary" : "text-text-tertiary"
                }`}>
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="flex items-center gap-2 pl-1 pt-0.5">
        <span className="text-[12px] text-text-tertiary">
          {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        <span className="text-[12px] text-text-tertiary">&middot;</span>
        <button
          onClick={() => handleVote(votedIndex!)}
          className="text-[12px] text-brand hover:underline"
        >
          Change vote
        </button>
      </div>
    </div>
  );
}

function PostCardInner({ post, onDeleted }: { post: Post; onDeleted?: () => void }) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [upvotes, setUpvotes] = useState(post.upvoteCount);
  const [downvotes, setDownvotes] = useState(post.downvoteCount);
  const [userVote, setUserVote] = useState<number>(0);
  const [voteDocId, setVoteDocId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostCount, setRepostCount] = useState(post.shareCount);
  const [hasReposted, setHasReposted] = useState(false);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = isReady && strapiUser && post.author?.id === strapiUser.id;
  const score = upvotes - downvotes;

  useEffect(() => {
    if (!isReady || !strapiToken || !strapiUser) return;
    votesApi.find({ "filters[user][id][$eq]": String(strapiUser.id), "filters[post][documentId][$eq]": post.documentId }, strapiToken)
      .then((res) => { if (res.data?.length > 0) { setUserVote(res.data[0].value); setVoteDocId(res.data[0].documentId); } }).catch(() => {});
    savedApi.list(strapiToken, { "filters[user][id][$eq]": String(strapiUser.id), "filters[post][documentId][$eq]": post.documentId })
      .then((res) => { if (res.data?.length > 0) { setIsSaved(true); setSavedDocId(res.data[0].documentId); } }).catch(() => {});
  }, [isReady, strapiToken, strapiUser, post.documentId]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  async function handleVote(value: number) {
    if (!isReady || !strapiToken || !strapiUser) return;
    setVoteAnimating(true);
    setTimeout(() => setVoteAnimating(false), 200);

    if (userVote === value) {
      if (voteDocId) await votesApi.delete(voteDocId, strapiToken).catch(() => {});
      if (value === 1) setUpvotes(p => p - 1); else setDownvotes(p => p - 1);
      setUserVote(0); setVoteDocId(null);
    } else {
      if (voteDocId) { await votesApi.delete(voteDocId, strapiToken).catch(() => {}); if (userVote === 1) setUpvotes(p => p - 1); else if (userVote === -1) setDownvotes(p => p - 1); }
      const res = await votesApi.create({ value, user: { connect: [strapiUser.documentId] }, post: { connect: [post.documentId] } }, strapiToken).catch(() => null);
      if (res?.data) setVoteDocId(res.data.documentId);
      if (value === 1) setUpvotes(p => p + 1); else setDownvotes(p => p + 1);
      setUserVote(value);
    }
  }

  async function handleBookmark() {
    if (!isReady || !strapiToken || !strapiUser) return;
    if (isSaved && savedDocId) {
      await savedApi.delete(savedDocId, strapiToken).catch(() => {});
      setIsSaved(false); setSavedDocId(null);
    } else {
      const res = await savedApi.create({ user: { connect: [strapiUser.documentId] }, post: { connect: [post.documentId] } }, strapiToken).catch(() => null);
      if (res?.data) { setIsSaved(true); setSavedDocId(res.data.documentId); }
    }
  }

  async function handleDelete() {
    if (!strapiToken || !confirm("Delete this post?")) return;
    await postsApi.delete(post.documentId, strapiToken).catch(() => {});
    onDeleted?.();
    setShowMenu(false);
  }

  async function handleReport() {
    if (!strapiToken || !strapiUser) return;
    const reason = prompt("Why are you reporting this post?");
    if (!reason) return;
    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      await fetch(`${STRAPI_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${strapiToken}` },
        body: JSON.stringify({ data: { targetType: "post", targetId: post.documentId, reason } }),
      });
      alert("Post reported. We'll review it shortly.");
    } catch (err) {
      console.error("Report error:", err);
    }
    setShowMenu(false);
  }

  return (
    <article className="relative py-2.5 cursor-pointer hover:bg-black/[0.015] transition-colors duration-75" style={{ paddingLeft: 18, paddingRight: 15 }}>
      {/* Bottom border — Bluesky uses hairline borders */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      <div className="flex" style={{ gap: 10 }}>
        {/* Avatar — 42px like Bluesky */}
        <Link href={`/profile/${post.author?.handle || "unknown"}`} className="shrink-0" style={{ paddingLeft: 8, paddingRight: 2 }}>
          <Avatar src={post.author?.avatar} name={post.author?.fullName} size="md" />
        </Link>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1 mb-0.5">
            <Link href={`/profile/${post.author?.handle || "unknown"}`} className="font-bold text-[15px] text-text-primary hover:underline truncate">
              {post.author?.fullName || "Unknown"}
            </Link>
            {post.author?.isVerified && (
              <svg className="w-4 h-4 text-brand shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-[15px] text-text-tertiary truncate">@{post.author?.handle || "unknown"}</span>
            <span className="text-text-tertiary text-[15px]">&middot;</span>
            <span className="text-text-tertiary text-[15px] shrink-0">{timeAgo(post.createdAt)}</span>

            {/* Menu — always visible for logged-in users */}
            {isReady && strapiUser && (
              <div className="relative ml-auto" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 -mr-1.5 rounded-full hover:bg-black/5 text-text-tertiary transition-colors">
                  <DotsThree size={18} weight="bold" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-border rounded-xl shadow-lg py-1 w-52 z-20">
                    {isAuthor ? (
                      <button onClick={handleDelete} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 w-full text-left rounded-xl">
                        <Trash size={16} /> Delete post
                      </button>
                    ) : (
                      <button onClick={handleReport} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-primary hover:bg-gray-50 w-full text-left rounded-xl">
                        <Flag size={16} /> Report post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post content */}
          <Link href={`/post/${post.documentId}`} className="block">
            <h3 className="font-semibold text-[15px] leading-[1.4] text-text-primary mb-0.5">{post.title}</h3>
            {post.body && (
              <p className="text-[15px] text-text-secondary leading-[1.5] line-clamp-4 mb-0.5">{post.body}</p>
            )}
            {post.body && post.body.length > 280 && (
              <span className="text-[13px] text-brand font-medium mt-0.5 inline-block">Show more</span>
            )}
          </Link>

          {/* Poll */}
          {post.postType === "poll" && pollOptions.length > 0 && (
            <PollWidget
              postDocumentId={post.documentId}
              options={pollOptions}
              votedIndex={votedIndex}
              onVote={async (idx) => {
                if (!isReady || !strapiToken) return;
                try {
                  const res = await pollApi.vote(post.documentId, idx, strapiToken);
                  setPollOptions(res.data.pollOptions);
                  setVotedIndex(res.data.userVotedIndex);
                } catch (err) {
                  console.error("Poll vote error:", err);
                }
              }}
            />
          )}

          {/* Image */}
          {post.link && post.link.startsWith("http") && post.postType !== "poll" && (
            <div className="mt-2.5 rounded-2xl overflow-hidden border border-border cursor-pointer" onClick={() => setShowLightbox(true)}>
              <img src={post.link} alt="" className="w-full h-[200px] object-cover" loading="lazy" />
            </div>
          )}

          {/* Circle */}
          {post.circle && (
            <div className="mt-2">
              <Link href={`/circle/${post.circle.slug}`} onClick={(e) => e.stopPropagation()} className="text-[11px] font-medium text-brand bg-brand-light/60 px-2 py-0.5 rounded hover:bg-brand-light transition-colors">{post.circle.name}</Link>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-3 mt-2.5 -ml-1">
            {/* Vote */}
            <div className="inline-flex items-center gap-0.5">
              <button
                onClick={() => handleVote(1)}
                className={`p-2 rounded-full transition-colors hover:bg-brand/10 ${userVote === 1 ? "text-brand" : "text-text-tertiary hover:text-brand"}`}
              >
                <ArrowFatUp size={18} weight={userVote === 1 ? "fill" : "regular"} className={voteAnimating && userVote === 1 ? "vote-pop" : ""} />
              </button>
              <span className={`text-[13px] tabular-nums ${
                userVote === 1 ? "text-brand" : userVote === -1 ? "text-red-500" : "text-text-tertiary"
              }`}>
                {score !== 0 ? formatCount(score) : "Vote"}
              </span>
              <button
                onClick={() => handleVote(-1)}
                className={`p-2 rounded-full transition-colors hover:bg-red-500/10 ${userVote === -1 ? "text-red-500" : "text-text-tertiary hover:text-red-500"}`}
              >
                <ArrowFatDown size={18} weight={userVote === -1 ? "fill" : "regular"} className={voteAnimating && userVote === -1 ? "vote-pop" : ""} />
              </button>
            </div>

            {/* Comment */}
            <Link href={`/post/${post.documentId}`} className="group flex items-center gap-0.5">
              <div className="p-2 rounded-full group-hover:bg-brand/10 transition-colors">
                <ChatCircle size={17} className="text-text-tertiary group-hover:text-brand transition-colors" />
              </div>
              <span className="text-[13px] text-text-tertiary group-hover:text-brand transition-colors">
                {post.commentCount > 0 ? formatCount(post.commentCount) : "Reply"}
              </span>
            </Link>

            {/* Repost — green when active like X.com */}
            <button onClick={() => setShowRepostModal(true)} className="group flex items-center gap-0.5">
              <div className={`p-2 rounded-full transition-colors ${hasReposted ? "bg-green-500/10" : "group-hover:bg-green-500/10"}`}>
                <Repeat size={17} className={`transition-colors ${hasReposted ? "text-green-600" : "text-text-tertiary group-hover:text-green-600"}`} />
              </div>
              <span className={`text-[13px] transition-colors ${hasReposted ? "text-green-600" : "text-text-tertiary group-hover:text-green-600"}`}>
                {repostCount > 0 ? formatCount(repostCount) : ""}
              </span>
            </button>

            {/* Bookmark */}
            <button onClick={handleBookmark} className="group flex items-center gap-0.5">
              <div className={`p-2 rounded-full transition-colors ${isSaved ? "bg-brand/10" : "group-hover:bg-brand/10"}`}>
                <BookmarkSimple size={17} weight={isSaved ? "fill" : "regular"} className={`transition-colors ${isSaved ? "text-brand" : "text-text-tertiary group-hover:text-brand"}`} />
              </div>
              <span className={`text-[13px] transition-colors ${isSaved ? "text-brand" : "text-text-tertiary group-hover:text-brand"}`}>
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {/* Repost Modal */}
          <RepostModal
            post={post}
            isOpen={showRepostModal}
            onClose={() => setShowRepostModal(false)}
            onReposted={() => { setRepostCount(c => c + 1); setHasReposted(true); }}
          />
        </div>
      </div>
      {showLightbox && post.link && <Lightbox src={post.link} onClose={() => setShowLightbox(false)} />}
    </article>
  );
}

export default memo(PostCardInner);
