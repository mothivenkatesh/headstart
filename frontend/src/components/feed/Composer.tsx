"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStrapiUser } from "@/lib/useStrapi";
import {
  Image as ImageIcon, ChartBar, X, Plus,
  CaretDown, Check, Clock, Spinner, Note,
} from "@phosphor-icons/react";
import { posts as postsApi } from "@/lib/strapi";
import { saveDraft, getDrafts, deleteDraft, type Draft } from "@/lib/drafts";
import type { Circle } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

const POLL_DURATIONS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

interface ComposerProps { circles: Circle[]; onPostCreated?: (post?: any) => void; }

export default function Composer({ circles, onPostCreated }: ComposerProps) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [circleId, setCircleId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(24);
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { if (expanded && titleRef.current) titleRef.current.focus(); }, [expanded]);

  // Load drafts on mount
  useEffect(() => { setDrafts(getDrafts()); }, [expanded]);

  // Auto-save draft every 2s when content exists
  useEffect(() => {
    if (!expanded || !title.trim()) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      const circleName = circles.find((c) => c.documentId === circleId)?.name || "";
      const id = saveDraft({ title, body, circleId, circleName, imageUrl, pollOptions, pollDuration, showPoll }, draftId || undefined);
      setDraftId(id);
      setDrafts(getDrafts());
    }, 2000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [title, body, circleId, imageUrl, showPoll, pollOptions, expanded]);

  function loadDraft(draft: Draft) {
    setTitle(draft.title); setBody(draft.body); setCircleId(draft.circleId);
    setImageUrl(draft.imageUrl); setShowPoll(draft.showPoll);
    setPollOptions(draft.pollOptions.length >= 2 ? draft.pollOptions : ["", ""]);
    setPollDuration(draft.pollDuration); setDraftId(draft.id);
    setShowDrafts(false); setExpanded(true);
  }

  function removeDraft(id: string) {
    deleteDraft(id); setDrafts(getDrafts());
    if (draftId === id) setDraftId(null);
  }
  useEffect(() => {
    const h = (e: MouseEvent) => { if (circleRef.current && !circleRef.current.contains(e.target as Node)) setShowCirclePicker(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }, []);

  if (!isReady) return null;
  const selectedCircle = circles.find((c) => c.documentId === circleId);

  function resetAll() { setTitle(""); setBody(""); setCircleId(""); setImageUrl(""); setShowPoll(false); setPollOptions(["", ""]); setPollDuration(24); setExpanded(false); }

  async function handleImageUpload(file: File) {
    if (!strapiToken) return;
    setUploading(true);
    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch(`${STRAPI_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${strapiToken}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]?.url) {
          const url = data[0].url.startsWith("http") ? data[0].url : `${STRAPI_URL}${data[0].url}`;
          setImageUrl(url);
        }
      }
    } catch (err) { console.error("Upload error:", err); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !circleId || !strapiToken || !strapiUser) return;
    setLoading(true);
    try {
      const now = new Date();
      const data: Record<string, unknown> = {
        title: title.trim(), body: body.trim() || undefined,
        author: { connect: [strapiUser.documentId] }, circle: { connect: [circleId] },
        ...(imageUrl.trim() ? { link: imageUrl.trim() } : {}),
      };
      if (showPoll) {
        const valid = pollOptions.filter((o) => o.trim());
        if (valid.length >= 2) {
          data.postType = "poll";
          data.pollOptions = valid.map((text) => ({ text, votes: 0 }));
          data.pollEndsAt = new Date(now.getTime() + pollDuration * 60 * 60 * 1000).toISOString();
        }
      }
      const res = await postsApi.create(data, strapiToken);
      resetAll(); onPostCreated?.(res?.data);
    } catch (err) { console.error("Failed to create post:", err); }
    finally { setLoading(false); }
  }

  const canSubmit = title.trim() && circleId && (!showPoll || pollOptions.filter((o) => o.trim()).length >= 2);

  // ─── Collapsed — matches Bluesky ComposerPrompt ─
  if (!expanded) {
    return (
      <div
        className="relative flex items-start cursor-pointer hover:bg-black/[0.015] transition-colors duration-75"
        style={{ paddingLeft: 18, paddingRight: 15 }}
        onClick={() => setExpanded(true)}
      >
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
        <div className="flex items-center py-2.5" style={{ gap: 10 }}>
          <div style={{ paddingLeft: 8 }}>
            <Avatar src={null} name={strapiUser?.fullName} size="md" />
          </div>
          <div className="flex-1 flex items-center justify-between" style={{ height: 40 }}>
            <span className="text-base text-text-tertiary">What&apos;s up?</span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full hover:bg-brand/10 text-text-tertiary hover:text-brand transition-colors">
                <ImageIcon size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Expanded ───────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      <div className="flex pt-3" style={{ paddingLeft: 26, paddingRight: 15, gap: 10 }}>
        <div className="shrink-0">
          <Avatar src={null} name={strapiUser?.fullName} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Circle pill — mandatory */}
          <div className="mb-2 relative" ref={circleRef}>
            <button
              type="button"
              onClick={() => setShowCirclePicker(!showCirclePicker)}
              className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border text-[13px] transition-all ${
                selectedCircle ? "border-brand/30 bg-brand/5 text-brand font-medium"
                : title.trim() && !circleId ? "border-red-300 bg-red-50 text-red-500 font-medium"
                : "border-border text-text-tertiary hover:border-border"
              }`}
            >
              {selectedCircle ? selectedCircle.name : "Choose a circle *"}
              <CaretDown size={11} weight="bold" />
            </button>
            {showCirclePicker && (
              <div className="absolute left-0 top-9 bg-white border border-border rounded-2xl shadow-lg py-2 w-60 z-30 max-h-72 overflow-y-auto">
                <p className="px-3 pb-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Choose a circle</p>
                {circles.map((c) => (
                  <button key={c.documentId} type="button" onClick={() => { setCircleId(c.documentId); setShowCirclePicker(false); }} className="flex items-center justify-between w-full px-3 py-2 text-[13px] text-text-primary hover:bg-gray-50 transition-colors">
                    <span>{c.name}</span>
                    {circleId === c.documentId && <Check size={14} weight="bold" className="text-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title — borderless */}
          <textarea ref={titleRef} placeholder="Title" value={title} onChange={(e) => { setTitle(e.target.value); autoResize(e.target); }}
            rows={1} className="w-full text-[17px] font-semibold placeholder:text-text-tertiary placeholder:font-normal focus:outline-none resize-none leading-snug" />

          {/* Body — borderless */}
          <textarea placeholder="What's on your mind?" value={body} onChange={(e) => { setBody(e.target.value); autoResize(e.target); }}
            rows={2} className="w-full text-[15px] placeholder:text-text-tertiary resize-none focus:outline-none leading-relaxed mt-1" />

          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />

          {/* Upload progress */}
          {uploading && (
            <div className="flex items-center gap-2 mt-2 mb-2 p-3 rounded-2xl bg-gray-50 border border-border">
              <Spinner size={18} className="text-brand animate-spin" />
              <span className="text-[13px] text-text-tertiary">Uploading image...</span>
            </div>
          )}

          {/* Image preview */}
          {imageUrl && (
            <div className="relative mt-2 mb-2 rounded-2xl overflow-hidden border border-border group">
              <img src={imageUrl} alt="" className="w-full h-[200px] object-cover" />
              <button type="button" onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Poll builder with duration — X.com style */}
          {showPoll && (
            <div className="mt-2 mb-2 rounded-2xl border border-border overflow-hidden">
              {/* Options */}
              <div className="p-3 space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="text" placeholder={`Option ${idx + 1}${idx < 2 ? " (required)" : ""}`} value={opt}
                      onChange={(e) => setPollOptions(pollOptions.map((o, i) => (i === idx ? e.target.value : o)))}
                      className="flex-1 h-[44px] px-4 rounded-xl border border-border text-[15px] focus:outline-none focus:border-brand placeholder:text-text-tertiary transition-colors" maxLength={80} />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-1.5 rounded-full hover:bg-gray-100 text-text-tertiary"><X size={16} /></button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="w-full h-[44px] rounded-xl border border-dashed border-border text-[14px] text-brand font-medium hover:bg-brand/5 hover:border-brand/30 transition-colors flex items-center justify-center gap-1">
                    <Plus size={14} weight="bold" /> Add option
                  </button>
                )}
              </div>
              {/* Duration row */}
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-border bg-gray-50">
                <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                  <Clock size={14} />
                  <span>Poll duration</span>
                </div>
                <div className="flex items-center gap-1">
                  {POLL_DURATIONS.map((d) => (
                    <button key={d.hours} type="button" onClick={() => setPollDuration(d.hours)}
                      className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${pollDuration === d.hours ? "bg-brand text-white" : "bg-white border border-border text-text-secondary hover:border-border"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Remove poll */}
              <div className="px-3 py-2 border-t border-border">
                <button type="button" onClick={() => { setShowPoll(false); setPollOptions(["", ""]); }} className="text-[13px] text-red-500 hover:text-red-600 font-medium">Remove poll</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-2" style={{ paddingLeft: 78, paddingRight: 15 }}>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { if (showPoll) { setShowPoll(false); setPollOptions(["", ""]); } fileInputRef.current?.click(); }}
            disabled={uploading}
            className={`p-2 rounded-full transition-colors ${imageUrl ? "text-brand bg-brand/10" : "text-brand/60 hover:bg-brand/5 hover:text-brand"} disabled:opacity-50`}>
            <ImageIcon size={20} />
          </button>
          <button type="button" onClick={() => { setShowPoll(!showPoll); if (imageUrl) setImageUrl(""); }}
            className={`p-2 rounded-full transition-colors ${showPoll ? "text-brand bg-brand/10" : "text-brand/60 hover:bg-brand/5 hover:text-brand"}`}>
            <ChartBar size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(title || body || imageUrl || showPoll) && (
            <button type="button" onClick={resetAll} className="text-[13px] text-text-tertiary hover:text-text-secondary">Discard</button>
          )}
          <Button type="submit" size="sm" className="rounded-full px-5" disabled={!canSubmit || loading}>
            {loading ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting</span> : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
