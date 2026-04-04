"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowFatUp, Plus, Star, TrendUp, Clock, Trophy } from "@phosphor-icons/react";
import { products as productsApi, strapiMedia } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Product } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import SubmitProductModal from "@/components/launchpad/SubmitProductModal";
import { Rocket } from "@phosphor-icons/react";

const SORT_OPTIONS = [
  { key: "hot", label: "Trending", icon: TrendUp },
  { key: "new", label: "New", icon: Clock },
  { key: "top", label: "Top", icon: Trophy },
];

export default function LaunchpadPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("hot");
  const [showSubmit, setShowSubmit] = useState(false);
  const { isReady } = useStrapiUser();

  useEffect(() => {
    load();
  }, [sort]);

  function load() {
    setLoading(true);
    const sortMap: Record<string, string> = { hot: "hotScore:desc", new: "createdAt:desc", top: "upvoteCount:desc" };
    productsApi
      .list({ sort: sortMap[sort] || "createdAt:desc", "filters[status][$eq]": "launched" })
      .then((res) => setProductList(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-10 bg-surface border-b border-border">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl">Launchpad</h1>
            <p className="text-xs text-text-tertiary mt-0.5">Discover and upvote the best startup products</p>
          </div>
          {isReady && (
            <Button size="sm" className="rounded-full" onClick={() => setShowSubmit(true)}>
              <Plus size={14} weight="bold" /> Submit
            </Button>
          )}
        </div>
        {/* Sort tabs */}
        <div className="flex border-b border-border">
          {SORT_OPTIONS.map((s) => (
            <div
              key={s.key}
              role="button"
              tabIndex={0}
              onClick={() => setSort(s.key)}
              onKeyDown={(e) => e.key === "Enter" && setSort(s.key)}
              data-active={sort === s.key}
              className="tab-item"
            >
              <span className={`tab-item-inner flex items-center gap-1.5 text-[15px] font-semibold ${
                sort === s.key ? "text-text-primary" : "text-text-tertiary"
              }`}>
                <s.icon size={15} weight={sort === s.key ? "fill" : "regular"} />
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-4 border-b border-border animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded bg-gray-100" />
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="w-36 h-4 bg-gray-200 rounded" />
                  <div className="w-56 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : productList.length === 0 ? (
        <EmptyState icon={<Rocket size={48} />} title="No products launched yet" description="Be the first to launch a product." />
      ) : (
        productList.map((product, index) => (
          <Link
            key={product.documentId}
            href={`/launchpad/${product.documentId}`}
            className="post-card flex items-center gap-4 px-4 py-4"
          >
            {/* Rank number */}
            <span className="rank-number w-6 text-center shrink-0">{index + 1}</span>

            {/* Logo */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-surface-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center ">
              {product.logo ? (
                <Image src={strapiMedia(product.logo)} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-light to-brand/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-brand">{product.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15px] text-text-primary">{product.name}</h3>
              <p className="text-[13px] text-text-secondary line-clamp-1 mt-0.5">{product.tagline}</p>
              <div className="flex items-center gap-3 mt-1.5">
                {product.categories && product.categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="text-[11px] text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded font-medium">
                    {cat}
                  </span>
                ))}
                {product.reviewCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-text-tertiary">
                    <Star size={11} weight="fill" className="text-amber-400" />
                    {product.rating?.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-[11px] text-text-tertiary">
                  <ChatCircleIcon /> {product.commentCount}
                </span>
              </div>
            </div>

            {/* Upvote button */}
            <div className="flex flex-col items-center border border-border rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shrink-0 hover:border-brand hover:bg-brand-light/30 transition-colors group">
              <ArrowFatUp size={20} className="text-text-tertiary group-hover:text-brand transition-colors" />
              <span className="text-xs font-bold text-text-primary mt-0.5">{product.upvoteCount}</span>
            </div>
          </Link>
        ))
      )}
      <SubmitProductModal isOpen={showSubmit} onClose={() => setShowSubmit(false)} onSubmitted={load} />
    </div>
  );
}

// Tiny inline icon to avoid importing another heavy icon
function ChatCircleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z" />
    </svg>
  );
}
