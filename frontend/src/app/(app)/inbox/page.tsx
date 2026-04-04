"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  PaperPlaneTilt, ChatCircle, Plus, MagnifyingGlass,
  ArrowLeft, Checks, X,
} from "@phosphor-icons/react";
import { conversations as convoApi, messages as msgApi } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import { useSocket } from "@/lib/useSocket";
import type { Conversation, Message } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export default function InboxPage() {
  return <Suspense><InboxContent /></Suspense>;
}

function InboxContent() {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const { socket, onlineUsers } = useSocket();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [peopleResults, setPeopleResults] = useState<{ id: number; documentId: string; handle: string; fullName: string }[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeChat = activeConvo ? convos.find((c) => c.documentId === activeConvo) : null;
  const activeOther = activeChat?.participants?.find((p) => p.id !== strapiUser?.id);
  const activeOnline = activeOther ? onlineUsers.has(String(activeOther.id)) : false;

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);

  useEffect(() => {
    if (isReady && strapiToken) {
      loadConversations().then(() => {
        if (chatParam) openChat(chatParam);
      });
    }
  }, [isReady, strapiToken, chatParam]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg: Message) => {
      if (msg.conversation?.documentId === activeConvo) {
        setMessageList((prev) => prev.some((m) => m.documentId === msg.documentId) ? prev : [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
      setConvos((prev) => prev.map((c) => c.documentId === msg.conversation?.documentId ? { ...c, lastMessageAt: msg.createdAt } : c)
        .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));
    };
    const onTyping = (data: { conversationId: string; userName: string; isTyping: boolean }) => {
      if (data.conversationId === activeConvo) { setTypingUser(data.isTyping ? data.userName : null); if (data.isTyping) setTimeout(() => setTypingUser(null), 3000); }
    };
    socket.on("message:new", onMsg);
    socket.on("typing:indicator", onTyping);
    return () => { socket.off("message:new", onMsg); socket.off("typing:indicator", onTyping); };
  }, [socket, activeConvo, scrollToBottom]);

  useEffect(() => { if (socket && activeConvo) { socket.emit("join:conversation", activeConvo); return () => { socket.emit("leave:conversation", activeConvo); }; } }, [socket, activeConvo]);

  async function loadConversations() { try { const r = await convoApi.list(strapiToken!); setConvos(r.data || []); } catch {} finally { setLoading(false); } }

  async function openChat(convoId: string) {
    setActiveConvo(convoId); setTypingUser(null); setSearchMode(false); setSearchQuery(""); setPeopleResults([]);
    try { const r = await msgApi.list(convoId, strapiToken!); setMessageList(r.data || []); setTimeout(scrollToBottom, 100); } catch {}
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeConvo || !strapiToken || !strapiUser) return;
    const body = newMsg.trim(); setNewMsg("");
    setMessageList((prev) => [...prev, { id: Date.now(), documentId: `t-${Date.now()}`, body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sender: { id: strapiUser.id, documentId: strapiUser.documentId, fullName: strapiUser.fullName, handle: strapiUser.handle } as Message["sender"] }]);
    setTimeout(scrollToBottom, 50);
    socket?.emit("typing:stop", { conversationId: activeConvo, userId: String(strapiUser.id) });
    try { await msgApi.create({ body, conversation: { connect: [activeConvo] }, sender: { connect: [strapiUser.documentId] } }, strapiToken); } catch {}
  }

  function emitTyping() {
    if (!socket || !activeConvo || !strapiUser) return;
    socket.emit("typing:start", { conversationId: activeConvo, userId: String(strapiUser.id), userName: strapiUser.fullName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { socket.emit("typing:stop", { conversationId: activeConvo, userId: String(strapiUser.id) }); }, 2000);
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setPeopleResults([]); return; }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (!strapiToken || !q.trim()) return;
      setSearchingPeople(true);
      try { const r = await fetch(`${STRAPI_URL}/api/user-profile-search?q=${encodeURIComponent(q.trim())}`, { headers: { Authorization: `Bearer ${strapiToken}` } }); const j = await r.json(); setPeopleResults(j.data || []); }
      catch {} finally { setSearchingPeople(false); }
    }, 300);
  }

  async function startChat(docId: string) {
    if (!strapiToken || !strapiUser) return;
    try { const r = await convoApi.create({ participants: { connect: [strapiUser.documentId, docId] } }, strapiToken); if (r.data) { setSearchMode(false); setSearchQuery(""); setPeopleResults([]); await loadConversations(); openChat(r.data.documentId); } } catch {}
  }

  const filteredConvos = searchQuery ? convos.filter((c) => { const o = c.participants?.find((p) => p.id !== strapiUser?.id); return o?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || o?.handle?.toLowerCase().includes(searchQuery.toLowerCase()); }) : convos;

  function dateLabel(d: string) { const dt = new Date(d), now = new Date(); if (dt.toDateString() === now.toDateString()) return "Today"; const y = new Date(now); y.setDate(y.getDate() - 1); if (dt.toDateString() === y.toDateString()) return "Yesterday"; return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
  function timeLabel(d: string) { return new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }); }

  return (
    <div className="flex h-[calc(100vh-60px)] bg-white">

      {/* ── LEFT: Conversation List ─────────────────── */}
      <div className={`w-full md:w-[340px] flex flex-col border-r border-border ${activeConvo ? "hidden md:flex" : ""}`}>
        {/* Header */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-[22px]">Chats</h1>
            <button onClick={() => { setSearchMode(true); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="w-9 h-9 rounded-full bg-surface-secondary hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Plus size={18} weight="bold" className="text-text-primary" />
            </button>
          </div>
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => setSearchMode(true)}
              placeholder="Search chats or people..." className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface-secondary text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-tertiary transition-all" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setPeopleResults([]); setSearchMode(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 text-text-tertiary">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {searchMode && searchQuery.trim() && peopleResults.length > 0 && (
          <div className="px-4 py-2 border-b border-border">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">People</p>
            {peopleResults.map((u) => {
              const existing = convos.find((c) => c.participants?.some((p) => p.id === u.id));
              return (
                <button key={u.id} onClick={() => existing ? openChat(existing.documentId) : startChat(u.documentId)}
                  className="w-full px-2 py-2.5 flex items-center gap-3 text-left hover:bg-surface-secondary rounded-xl transition-colors">
                  <Avatar src={null} name={u.fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate">{u.fullName}</p>
                    <p className="text-[12px] text-text-tertiary">@{u.handle}</p>
                  </div>
                  {existing && <span className="text-[11px] text-brand bg-brand-light px-2 py-0.5 rounded-full">Open</span>}
                </button>
              );
            })}
          </div>
        )}
        {searchMode && searchQuery.trim().length >= 2 && !searchingPeople && peopleResults.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-text-tertiary border-b border-border">No people found</p>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="flex gap-3"><div className="w-12 h-12 rounded-full bg-surface-secondary" /><div className="flex-1 pt-1 space-y-2"><div className="w-24 h-3 bg-surface-secondary rounded" /><div className="w-36 h-2.5 bg-surface-secondary rounded" /></div></div>)}
            </div>
          ) : filteredConvos.length === 0 && !searchQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
              <ChatCircle size={48} className="text-gray-200 mb-3" />
              <p className="font-semibold text-[15px] mb-1">No conversations</p>
              <p className="text-[13px] text-text-tertiary">Search for someone to start chatting</p>
            </div>
          ) : (
            filteredConvos.map((c) => {
              const other = c.participants?.find((p) => p.id !== strapiUser?.id);
              const online = other ? onlineUsers.has(String(other.id)) : false;
              const active = activeConvo === c.documentId;
              const lastMsg = (c as any).lastMessage;
              return (
                <button key={c.documentId} onClick={() => openChat(c.documentId)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${active ? "bg-surface-secondary" : "hover:bg-surface-secondary/50"}`}>
                  <div className="relative shrink-0">
                    <Avatar src={other?.avatar} name={other?.fullName} size="lg" />
                    {online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[15px] truncate">{other?.fullName || "User"}</span>
                      {c.lastMessageAt && <span className="text-[11px] text-text-tertiary shrink-0">{timeAgo(c.lastMessageAt)}</span>}
                    </div>
                    <p className="text-[13px] text-text-tertiary truncate mt-0.5">
                      {lastMsg?.body ? `${lastMsg.sender?.id === strapiUser?.id ? "You: " : ""}${lastMsg.body}` : online ? "Online" : "Tap to chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat Area ───────────────────────── */}
      <div className={`flex-1 flex flex-col bg-surface-secondary ${!activeConvo ? "hidden md:flex" : ""}`}>
        {!activeConvo ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <ChatCircle size={56} className="text-gray-200 mb-4" />
            <p className="font-semibold text-[18px] text-text-secondary mb-1">Your messages</p>
            <p className="text-[14px] text-text-tertiary">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-[60px] px-4 flex items-center gap-3 bg-surface border-b border-border shrink-0">
              <button onClick={() => setActiveConvo(null)} className="md:hidden p-1.5 rounded-full hover:bg-surface-secondary"><ArrowLeft size={20} /></button>
              <div className="relative">
                <Avatar src={activeOther?.avatar} name={activeOther?.fullName} size="md" />
                {activeOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate">{activeOther?.fullName || "User"}</p>
                <p className="text-[12px]">
                  {typingUser ? <span className="text-green-600">typing...</span> : activeOnline ? <span className="text-green-600">online</span> : <span className="text-text-tertiary">offline</span>}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
              {messageList.length === 0 && (
                <div className="flex justify-center py-12">
                  <p className="text-[13px] text-text-tertiary bg-white rounded-lg px-4 py-2">No messages yet. Say hello!</p>
                </div>
              )}

              {messageList.map((msg, idx) => {
                const isMe = msg.sender?.id === strapiUser?.id;
                const prev = messageList[idx - 1];
                const showDate = !prev || dateLabel(msg.createdAt) !== dateLabel(prev.createdAt);
                const consecutive = prev && prev.sender?.id === msg.sender?.id && !showDate;

                return (
                  <div key={msg.documentId}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] text-text-tertiary bg-white px-3 py-1 rounded-full font-medium">{dateLabel(msg.createdAt)}</span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${consecutive ? "mt-0.5" : "mt-3"}`}>
                      <div className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-3.5 py-2 ${
                        isMe
                          ? "bg-brand text-white rounded-br-md"
                          : "bg-white text-text-primary rounded-bl-md"
                      }`}>
                        <p className="text-[14.5px] leading-relaxed">{msg.body}</p>
                        <div className={`flex items-center gap-1 justify-end mt-1 ${isMe ? "opacity-70" : ""}`}>
                          <span className={`text-[10px] ${isMe ? "text-white/70" : "text-text-tertiary"}`}>{timeLabel(msg.createdAt)}</span>
                          {isMe && <Checks size={14} className="text-white/70" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing */}
              {typingUser && (
                <div className="flex justify-start mt-3">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-surface border-t border-border flex items-center gap-2">
              <form onSubmit={sendMessage} className="flex-1 flex items-center gap-2">
                <input ref={inputRef} type="text" value={newMsg} onChange={(e) => { setNewMsg(e.target.value); emitTyping(); }}
                  placeholder="Type a message..."
                  className="flex-1 h-[42px] px-4 rounded-full bg-surface-secondary text-[15px] focus:outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-tertiary transition-all" />
                <button type="submit" disabled={!newMsg.trim()}
                  className="w-[42px] h-[42px] rounded-full bg-brand text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-brand-btn-hover transition-colors">
                  <PaperPlaneTilt size={18} weight="fill" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
