"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { MagnifyingGlass, Bell, ChatCircle, X, Article, Rocket, User, Circle } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import { useScrollDirection } from "@/lib/useScrollDirection";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface SearchResult {
  type: "post" | "product" | "person" | "circle";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  avatar?: string;
}

export default function GlobalHeader() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const hidden = useScrollDirection();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setFocused(false); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setFocused(false); inputRef.current?.blur(); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleChange(value: string) {
    setQuery(value); setSelectedIdx(-1);
    if (!value.trim()) { setResults([]); setOpen(false); return; }
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value.trim()), 250);
  }

  async function search(q: string) {
    setLoading(true);
    try {
      const all: SearchResult[] = [];
      const [postsRes, prodsRes, circlesRes, peopleRes] = await Promise.all([
        fetch(`${STRAPI_URL}/api/posts?filters[title][$containsi]=${encodeURIComponent(q)}&pagination[pageSize]=4`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${STRAPI_URL}/api/products?filters[name][$containsi]=${encodeURIComponent(q)}&pagination[pageSize]=3`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${STRAPI_URL}/api/circles?pagination[pageSize]=50`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${STRAPI_URL}/api/user-profile-search?q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      (postsRes.data || []).forEach((p: any) => all.push({ type: "post", id: p.documentId, title: p.title, subtitle: p.author?.fullName ? `by ${p.author.fullName}` : "Post", href: `/post/${p.documentId}` }));
      (prodsRes.data || []).forEach((p: any) => all.push({ type: "product", id: p.documentId, title: p.name, subtitle: p.tagline || "Product", href: `/launchpad/${p.documentId}` }));
      (circlesRes.data || []).filter((c: any) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3).forEach((c: any) => all.push({ type: "circle", id: c.documentId, title: c.name, subtitle: c.description?.slice(0, 50) || "Circle", href: `/circle/${c.slug}` }));
      (peopleRes.data || []).slice(0, 3).forEach((u: any) => all.push({ type: "person", id: u.documentId, title: u.fullName, subtitle: `@${u.handle}`, href: `/profile/${u.handle}`, avatar: u.fullName }));
      setResults(all);
    } catch {} finally { setLoading(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && selectedIdx >= 0) { e.preventDefault(); go(results[selectedIdx].href); }
  }

  function go(href: string) { setOpen(false); setQuery(""); setResults([]); setFocused(false); inputRef.current?.blur(); router.push(href); }

  const iconMap = { post: Article, product: Rocket, person: User, circle: Circle };
  const typeLabels: Record<string, string> = { post: "Posts", product: "Products", person: "People", circle: "Circles" };
  const grouped = results.reduce((acc, r) => { (acc[r.type] = acc[r.type] || []).push(r); return acc; }, {} as Record<string, SearchResult[]>);
  let flatIdx = -1;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-[60px] bg-surface border-b border-border px-4 transition-transform duration-300 ease-out lg:translate-y-0" style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}>
      <div className="max-w-[1120px] w-full mx-auto h-full flex items-center gap-4">
        <Link href="/" className="font-bold text-lg text-brand shrink-0">Headstart</Link>

        {/* ─── Search ─────────────────────────────────── */}
        <div className="flex-1 max-w-[420px] hidden sm:block relative" ref={containerRef}>
          <div className={`relative rounded-lg transition-all duration-200 ${focused ? "bg-surface ring-1 ring-border" : "bg-gray-100"}`}>
            <MagnifyingGlass size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150 ${focused ? "text-text-secondary" : "text-text-tertiary"}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => { setFocused(true); if (query.trim() && results.length > 0) setOpen(true); }}
              onBlur={() => { if (!query) setFocused(false); }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-8 bg-transparent rounded-lg text-[14px] focus:outline-none placeholder:text-text-tertiary"
            />
            {query && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X size={10} weight="bold" className="text-text-secondary" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && query.trim() && (
            <div className="absolute top-11 left-0 right-0 bg-white border border-border rounded-xl shadow-lg overflow-hidden max-h-[65vh] overflow-y-auto z-50">
              {loading && results.length === 0 && (
                <div className="px-4 py-5 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-border border-t-brand rounded-full animate-spin" />
                  <span className="text-[13px] text-text-tertiary">Searching...</span>
                </div>
              )}

              {!loading && results.length === 0 && query.trim().length >= 2 && (
                <div className="px-4 py-5 text-center">
                  <p className="text-[13px] text-text-tertiary">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}

              {Object.entries(grouped).map(([type, items]) => {
                const Icon = iconMap[type as keyof typeof iconMap];
                return (
                  <div key={type}>
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{typeLabels[type]}</p>
                    </div>
                    {items.map((r) => {
                      flatIdx++;
                      const idx = flatIdx;
                      const selected = selectedIdx === idx;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onMouseDown={(e) => { e.preventDefault(); go(r.href); }}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${selected ? "bg-brand/5" : ""}`}
                        >
                          {r.type === "person" ? (
                            <Avatar src={null} name={r.avatar} size="sm" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-brand/10" : "bg-gray-100"}`}>
                              <Icon size={15} className={selected ? "text-brand" : "text-text-tertiary"} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] truncate transition-colors ${selected ? "font-semibold text-brand" : "font-medium text-text-primary"}`}>{r.title}</p>
                            <p className="text-[11px] text-text-tertiary truncate">{r.subtitle}</p>
                          </div>
                          {selected && <MagnifyingGlass size={12} className="text-brand/40 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {results.length > 0 && (
                <div className="px-3 py-2 border-t border-border flex items-center gap-3">
                  <p className="text-[11px] text-text-tertiary">
                    <kbd className="px-1 py-px bg-gray-100 rounded text-[9px] font-mono">↑↓</kbd> navigate
                    <span className="mx-1.5">&middot;</span>
                    <kbd className="px-1 py-px bg-gray-100 rounded text-[9px] font-mono">↵</kbd> open
                    <span className="mx-1.5">&middot;</span>
                    <kbd className="px-1 py-px bg-gray-100 rounded text-[9px] font-mono">esc</kbd> close
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Actions ────────────────────────────────── */}
        <div className="flex items-center gap-1 ml-auto">
          {isSignedIn ? (
            <>
              <Link href="/inbox" className="p-2.5 rounded-full text-text-secondary hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ChatCircle size={22} />
              </Link>
              <Link href="/notifications" className="p-2.5 rounded-full text-text-secondary hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Bell size={22} />
              </Link>
              <div className="ml-1"><UserButton /></div>
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-brand-btn text-white text-[13px] font-semibold rounded-lg hover:bg-brand-btn-hover active:bg-brand-btn-active active:scale-[0.98] transition-all">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
