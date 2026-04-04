"use client";

import { useState } from "react";
import { X, Repeat } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { reposts as repostsApi } from "@/lib/strapi";
import type { Post } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmbeddedPost from "./EmbeddedPost";

interface Props {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onReposted: () => void;
}

export default function RepostModal({ post, isOpen, onClose, onReposted }: Props) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [thoughts, setThoughts] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !isReady) return null;

  async function handleQuoteRepost() {
    if (!strapiToken || !strapiUser) return;
    setLoading(true);
    try {
      await repostsApi.create(
        {
          originalPost: { connect: [post.documentId] },
          thoughts: thoughts.trim() || undefined,
        },
        strapiToken
      );
      setThoughts("");
      onReposted();
      onClose();
    } catch (err) {
      console.error("Repost error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickRepost() {
    if (!strapiToken || !strapiUser) return;
    setLoading(true);
    try {
      await repostsApi.create(
        { originalPost: { connect: [post.documentId] } },
        strapiToken
      );
      onReposted();
      onClose();
    } catch (err) {
      console.error("Repost error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-text-primary transition-colors">
            <X size={20} />
          </button>
          <h2 className="font-bold text-[15px]">Repost</h2>
          <div className="w-8" />
        </div>

        {/* Quick repost option */}
        <button
          onClick={handleQuickRepost}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-border text-left"
        >
          <div className="p-2 rounded-full bg-green-50">
            <Repeat size={18} className="text-green-600" />
          </div>
          <div>
            <span className="font-semibold text-[15px] text-text-primary">Repost</span>
            <p className="text-[13px] text-text-tertiary">Share instantly to your followers</p>
          </div>
        </button>

        {/* Quote repost */}
        <div className="px-4 py-3">
          <div className="flex gap-3">
            <Avatar src={null} name={strapiUser?.fullName} size="md" />
            <div className="flex-1">
              <textarea
                placeholder="Add your thoughts..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                rows={3}
                className="w-full text-[15px] placeholder:text-text-tertiary resize-none focus:outline-none leading-relaxed"
                autoFocus
              />
            </div>
          </div>

          {/* Embedded original post preview */}
          <div className="ml-[52px]">
            <EmbeddedPost post={post} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-border">
          <Button
            size="sm"
            className="rounded-full px-5"
            onClick={handleQuoteRepost}
            disabled={loading}
          >
            {loading ? "Posting..." : thoughts.trim() ? "Quote" : "Repost with thoughts"}
          </Button>
        </div>
      </div>
    </div>
  );
}
