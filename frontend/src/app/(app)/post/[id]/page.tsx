"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowFatUp, ArrowFatDown, ChatCircle,
  BookmarkSimple, ShareNetwork, Heart, DotsThree, Trash, Flag,
} from "@phosphor-icons/react";
import { posts as postsApi, comments as commentsApi, votes as votesApi, savedPosts as savedApi } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Post, Comment } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import FollowButton from "@/components/ui/FollowButton";
import { timeAgo, formatCount } from "@/lib/utils";

// ─── Threaded Comment — X.com style avatar-to-avatar lines ─
function ThreadedComment({
  comment, allComments, depth = 0, onReply,
}: {
  comment: Comment; allComments: Comment[]; depth?: number; onReply: (id: string, name: string) => void;
}) {
  const replies = allComments.filter((c) => c.parent?.id === comment.id);
  const [collapsed, setCollapsed] = useState(depth >= 4 && replies.length > 0);
  const hasReplies = replies.length > 0 && !collapsed;
  const avatarSize = depth === 0 ? 40 : 32; // md=40px, sm=32px

  return (
    <div className={depth > 0 ? "ml-8 sm:ml-[52px]" : ""}>
      <div className="flex gap-3 py-3 relative">
        {/* Avatar column with thread line */}
        <div className="relative shrink-0 flex flex-col items-center">
          <Link href={`/profile/${comment.author?.handle || "unknown"}`}>
            <Avatar src={comment.author?.avatar} name={comment.author?.fullName} size={depth === 0 ? "md" : "sm"} />
          </Link>
          {/* Vertical line from avatar bottom to next reply's avatar */}
          {hasReplies && depth < 5 && (
            <div className="flex-1 w-[2px] bg-gray-200 mt-1" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link href={`/profile/${comment.author?.handle || "unknown"}`} className="font-bold text-[13px] text-text-primary hover:underline">
              {comment.author?.fullName || "User"}
            </Link>
            <span className="text-[13px] text-text-tertiary">@{comment.author?.handle || "user"}</span>
            <span className="text-[13px] text-text-tertiary">&middot;</span>
            <span className="text-[13px] text-text-tertiary">{timeAgo(comment.createdAt)}</span>
            {comment.isHelpful && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full ml-1">Helpful</span>
            )}
          </div>
          <p className="text-[15px] text-text-primary mt-0.5 leading-[1.5]">{comment.body}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <button className="group flex items-center gap-1">
              <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart size={15} className="text-text-tertiary group-hover:text-red-500 transition-colors" />
              </div>
              {comment.upvoteCount > 0 && <span className="text-[12px] text-text-tertiary">{comment.upvoteCount}</span>}
            </button>
            <button onClick={() => onReply(comment.documentId, comment.author?.fullName || "User")} className="group flex items-center gap-1">
              <div className="p-1.5 rounded-full group-hover:bg-brand/10 transition-colors">
                <ChatCircle size={15} className="text-text-tertiary group-hover:text-brand transition-colors" />
              </div>
              {replies.length > 0 && <span className="text-[12px] text-text-tertiary">{replies.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Collapse toggle for deep threads */}
      {collapsed && replies.length > 0 && (
        <button
          onClick={() => setCollapsed(false)}
          className="ml-10 text-[13px] text-brand font-medium hover:underline py-1"
        >
          Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </button>
      )}

      {/* Nested replies */}
      {!collapsed && depth < 5 && replies.map((reply) => (
        <ThreadedComment key={reply.documentId} comment={reply} allComments={allComments} depth={depth + 1} onReply={onReply} />
      ))}
    </div>
  );
}

// ─── Post Detail Page ─────────────────────────────────────
export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [post, setPost] = useState<Post | null>(null);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullBody, setShowFullBody] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Vote state
  const [userVote, setUserVote] = useState(0);
  const [voteDocId, setVoteDocId] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [postRes, commentsRes] = await Promise.all([postsApi.get(id), commentsApi.list(id)]);
        setPost(postRes.data);
        setUpvotes(postRes.data?.upvoteCount || 0);
        setDownvotes(postRes.data?.downvoteCount || 0);
        setCommentList(commentsRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  // Check existing vote + bookmark
  useEffect(() => {
    if (!isReady || !strapiToken || !strapiUser || !post) return;
    votesApi.find({ "filters[user][id][$eq]": String(strapiUser.id), "filters[post][documentId][$eq]": post.documentId }, strapiToken)
      .then(r => { if (r.data?.length) { setUserVote(r.data[0].value); setVoteDocId(r.data[0].documentId); } }).catch(() => {});
    savedApi.list(strapiToken, { "filters[user][id][$eq]": String(strapiUser.id), "filters[post][documentId][$eq]": post.documentId })
      .then(r => { if (r.data?.length) { setIsSaved(true); setSavedDocId(r.data[0].documentId); } }).catch(() => {});
  }, [isReady, strapiToken, strapiUser, post]);

  async function handleVote(value: number) {
    if (!isReady || !strapiToken || !strapiUser || !post) return;
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
    if (!isReady || !strapiToken || !strapiUser || !post) return;
    if (isSaved && savedDocId) {
      await savedApi.delete(savedDocId, strapiToken).catch(() => {}); setIsSaved(false); setSavedDocId(null);
    } else {
      const res = await savedApi.create({ user: { connect: [strapiUser.documentId] }, post: { connect: [post.documentId] } }, strapiToken).catch(() => null);
      if (res?.data) { setIsSaved(true); setSavedDocId(res.data.documentId); }
    }
  }

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const isAuthor = isReady && strapiUser && post?.author?.id === strapiUser.id;

  async function handleDeletePost() {
    if (!strapiToken || !post || !confirm("Delete this post? This can't be undone.")) return;
    await postsApi.delete(post.documentId, strapiToken).catch(() => {});
    router.push("/");
  }

  async function handleReportPost() {
    if (!strapiToken || !strapiUser || !post) return;
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
      console.error(err);
    }
    setShowMenu(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || !isReady || !strapiToken || !strapiUser) return;
    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        body: commentBody.trim(),
        post: { connect: [id] },
        author: { connect: [strapiUser.documentId] },
      };
      if (replyTo) data.parent = { connect: [replyTo.id] };
      const optimistic = {
        id: Date.now(), documentId: 'temp-' + Date.now(), body: commentBody.trim(),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        upvoteCount: 0, downvoteCount: 0, isHelpful: false,
        author: { id: strapiUser.id, documentId: strapiUser.documentId, fullName: strapiUser.fullName, handle: strapiUser.handle },
        parent: replyTo ? { id: 0, documentId: replyTo.id } : null,
      };
      setCommentList((prev) => [...prev, optimistic as any]);
      setCommentBody(""); setReplyTo(null);
      // Background refetch for real data
      commentsApi.create(data, strapiToken).then(() => commentsApi.list(id).then((res) => setCommentList(res.data || []))).catch(() => {});
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 rounded" /><div className="w-12 h-4 bg-gray-200 rounded" />
        </div>
        <div className="px-4 pt-4 space-y-3">
          <div className="flex gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="space-y-1.5"><div className="w-28 h-3.5 bg-gray-200 rounded" /><div className="w-20 h-2.5 bg-gray-100 rounded" /></div></div>
          <div className="w-3/4 h-6 bg-gray-200 rounded" />
          <div className="w-full h-4 bg-gray-100 rounded" />
          <div className="w-full h-4 bg-gray-100 rounded" />
          <div className="w-2/3 h-4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!post) return <div className="py-20 text-center text-sm text-text-tertiary">Post not found</div>;

  const bodyLong = (post.body?.length || 0) > 500;
  const displayBody = bodyLong && !showFullBody ? post.body?.slice(0, 500) : post.body;
  const score = upvotes - downvotes;
  const topLevelComments = commentList.filter((c) => !c.parent);

  // Format date like "10:42 AM · Jan 15, 2026"
  const postDate = new Date(post.createdAt);
  const formattedDate = postDate.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) +
    " · " + postDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-[60px] z-10 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg">Post</h1>
      </div>

      {/* Author card */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author?.handle || "unknown"}`}>
            <Avatar src={post.author?.avatar} name={post.author?.fullName} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <Link href={`/profile/${post.author?.handle || "unknown"}`} className="font-bold text-[15px] hover:underline truncate">
                {post.author?.fullName || "Unknown"}
              </Link>
              {post.author?.isVerified && (
                <svg className="w-4 h-4 text-brand shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <span className="text-[13px] text-text-tertiary">@{post.author?.handle || "unknown"}</span>
          </div>
          {post.author && isReady && strapiUser && post.author.id !== strapiUser.id && (
            <FollowButton targetUserId={post.author.id} targetUserDocumentId={post.author.documentId} />
          )}
          {/* Menu */}
          {isReady && strapiUser && (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-black/5 text-text-tertiary transition-colors">
                <DotsThree size={20} weight="bold" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-9 bg-white border border-border rounded-xl shadow-lg py-1 w-52 z-20">
                  {isAuthor ? (
                    <button onClick={handleDeletePost} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 w-full text-left rounded-xl">
                      <Trash size={16} /> Delete post
                    </button>
                  ) : (
                    <button onClick={handleReportPost} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-text-primary hover:bg-gray-50 w-full text-left rounded-xl">
                      <Flag size={16} /> Report post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 py-3">
        <h2 className="font-bold text-xl leading-[1.3] mb-2">{post.title}</h2>
        {displayBody && (
          <p className="text-[15px] text-text-primary leading-[1.6] whitespace-pre-wrap">{displayBody}</p>
        )}
        {bodyLong && !showFullBody && (
          <button onClick={() => setShowFullBody(true)} className="text-brand text-[15px] font-medium hover:underline mt-1 block">
            Show more
          </button>
        )}

        {/* Circle */}
        {post.circle && (
          <div className="mt-3">
            <Link href={`/circle/${post.circle.slug}`} className="text-[12px] font-medium text-brand bg-brand-light/60 px-2.5 py-1 rounded-md hover:bg-brand-light transition-colors">{post.circle.name}</Link>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 text-[13px] text-text-tertiary">
          {formattedDate}
        </div>
      </div>

      {/* Engagement stats bar */}
      {(upvotes > 0 || post.commentCount > 0 || post.shareCount > 0) && (
        <div className="mx-4 py-3 border-y border-border flex items-center gap-5">
          {(upvotes + downvotes) > 0 && (
            <span className="text-[14px]"><strong>{formatCount(score)}</strong> <span className="text-text-tertiary">votes</span></span>
          )}
          {post.commentCount > 0 && (
            <span className="text-[14px]"><strong>{formatCount(post.commentCount)}</strong> <span className="text-text-tertiary">replies</span></span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-around py-2 border-b border-border">
        {/* Vote */}
        <div className="inline-flex items-center gap-0.5">
          <button
            onClick={() => handleVote(1)}
            className={`p-2 rounded-full transition-colors hover:bg-brand/10 ${userVote === 1 ? "text-brand" : "text-text-tertiary hover:text-brand"}`}
          >
            <ArrowFatUp size={20} weight={userVote === 1 ? "fill" : "regular"} />
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
            <ArrowFatDown size={20} weight={userVote === -1 ? "fill" : "regular"} />
          </button>
        </div>
        {/* Reply */}
        <button onClick={() => document.getElementById("comment-input")?.focus()} className="group flex items-center gap-1 py-2">
          <div className="p-2 rounded-full group-hover:bg-brand/10 transition-colors">
            <ChatCircle size={20} className="text-text-tertiary group-hover:text-brand transition-colors" />
          </div>
          <span className="text-[13px] font-medium text-text-tertiary group-hover:text-brand transition-colors">Reply</span>
        </button>
        {/* Save */}
        <button onClick={handleBookmark} className="group flex items-center gap-1 py-2">
          <div className={`p-2 rounded-full transition-colors ${isSaved ? "bg-brand/10" : "group-hover:bg-brand/10"}`}>
            <BookmarkSimple size={20} weight={isSaved ? "fill" : "regular"} className={`${isSaved ? "text-brand" : "text-text-tertiary group-hover:text-brand"} transition-colors`} />
          </div>
          <span className={`text-[13px] font-medium transition-colors ${isSaved ? "text-brand" : "text-text-tertiary group-hover:text-brand"}`}>
            {isSaved ? "Saved" : "Save"}
          </span>
        </button>
      </div>

      {/* Reply composer */}
      {isReady && (
        <form onSubmit={handleComment} className="px-4 py-3 border-b border-border">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 sm:ml-[52px]">
              <span className="text-[13px] text-text-tertiary">Replying to <span className="text-brand font-medium">@{replyTo.name}</span></span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary">&times;</button>
            </div>
          )}
          <div className="flex gap-3">
            <Avatar src={null} name={strapiUser?.fullName} size="md" />
            <div className="flex-1">
              <textarea
                id="comment-input"
                placeholder={replyTo ? "Post your reply..." : "Post your reply"}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={2}
                className="w-full text-[15px] placeholder:text-text-tertiary resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <Button type="submit" size="sm" className="rounded-full px-5" disabled={!commentBody.trim() || submitting}>
                  {submitting ? "Posting..." : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Threaded comments */}
      <div>
        {topLevelComments.length === 0 ? (
          <div className="py-16 text-center">
            <ChatCircle size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-[15px] text-text-tertiary">No replies yet</p>
            <p className="text-[13px] text-text-tertiary mt-0.5">Be the first to join the conversation</p>
          </div>
        ) : (
          <div className="px-4">
            {topLevelComments.map((comment) => (
              <ThreadedComment
                key={comment.documentId}
                comment={comment}
                allComments={commentList}
                onReply={(docId, name) => { setReplyTo({ id: docId, name }); document.getElementById("comment-input")?.focus(); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
