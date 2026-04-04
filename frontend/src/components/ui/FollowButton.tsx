"use client";

import { useState, useEffect } from "react";
import { useStrapiUser } from "@/lib/useStrapi";
import { follows as followsApi } from "@/lib/strapi";
import Button from "./Button";

interface FollowButtonProps {
  targetUserId: number;
  targetUserDocumentId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, targetUserDocumentId, onFollowChange }: FollowButtonProps) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isReady || !strapiToken || !strapiUser) return;
    if (strapiUser.id === targetUserId) return; // Can't follow yourself

    followsApi
      .find(
        {
          "filters[follower][id][$eq]": String(strapiUser.id),
          "filters[following][id][$eq]": String(targetUserId),
        },
        strapiToken
      )
      .then((res) => {
        if (res.data?.length > 0) {
          setIsFollowing(true);
          setFollowDocId(res.data[0].documentId);
        }
      })
      .catch(() => {});
  }, [isReady, strapiToken, strapiUser, targetUserId]);

  async function handleToggle() {
    if (!isReady || !strapiToken || !strapiUser || loading) return;
    setLoading(true);

    try {
      if (isFollowing && followDocId) {
        await followsApi.delete(followDocId, strapiToken);
        setIsFollowing(false);
        setFollowDocId(null);
        onFollowChange?.(false);
      } else {
        const res = await followsApi.create(
          { follower: { connect: [strapiUser.documentId] }, following: { connect: [targetUserDocumentId] } },
          strapiToken
        );
        if (res?.data) {
          setIsFollowing(true);
          setFollowDocId(res.data.documentId);
          onFollowChange?.(true);
        }
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Don't show follow button for own profile
  if (strapiUser?.id === targetUserId) return null;

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "primary"}
      onClick={handleToggle}
      disabled={loading}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
