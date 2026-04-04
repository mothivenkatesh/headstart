"use client";

import { useEffect, useState } from "react";
import { useStrapiUser } from "@/lib/useStrapi";
import { Bell, Check } from "@phosphor-icons/react";
import { notifications as notifApi } from "@/lib/strapi";
import type { Notification } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { timeAgo, cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { strapiToken } = useStrapiUser();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!strapiToken) return;
        const res = await notifApi.list(strapiToken);
        setNotifs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [strapiToken]);

  async function markRead(documentId: string) {
    if (!strapiToken) return;
    await notifApi.markRead(documentId, strapiToken);
    setNotifs((prev) => prev.map((n) => (n.documentId === documentId ? { ...n, isRead: true } : n)));
  }

  return (
    <div>
      <div className="sticky top-[60px] z-10 bg-surface border-b border-border px-4 py-3.5">
        <h1 className="font-semibold text-base">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-0 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 border-b border-border flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="space-y-1"><div className="w-48 h-3 bg-gray-200 rounded" /><div className="w-24 h-2.5 bg-gray-100 rounded" /></div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No notifications" description="You're all caught up." />
      ) : (
        notifs.map((n) => (
          <div
            key={n.documentId}
            className={cn(
              "px-4 py-3 border-b border-border flex items-start gap-3 cursor-pointer hover:bg-surface-secondary transition-colors",
              !n.isRead && "bg-brand-light/30"
            )}
            onClick={() => !n.isRead && markRead(n.documentId)}
          >
            <Avatar src={n.actor?.avatar} name={n.actorName || n.actor?.fullName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{n.actorName || n.actor?.fullName}</span>{" "}
                <span className="text-text-secondary">{n.action}</span>{" "}
                {n.targetText && <span className="font-medium">{n.targetText}</span>}
              </p>
              <span className="text-xs text-text-tertiary">{timeAgo(n.createdAt)}</span>
            </div>
            {!n.isRead && (
              <div className="w-2 h-2 rounded-full bg-brand mt-2 shrink-0" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
