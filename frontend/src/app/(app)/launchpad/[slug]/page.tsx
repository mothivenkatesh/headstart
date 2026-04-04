"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowFatUp, Star, Globe, ChatCircle, Eye } from "@phosphor-icons/react";
import { products as productsApi, productReviews as reviewsApi, votes as votesApi, strapiMedia } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Product, ProductReview } from "@/lib/types";
import ReviewForm from "@/components/launchpad/ReviewForm";
import Avatar from "@/components/ui/Avatar";
import { formatCount } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [voteDocId, setVoteDocId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await productsApi.get(slug);
        setProduct(res.data);
        setUpvoteCount(res.data?.upvoteCount || 0);
        const revRes = await reviewsApi.list(slug);
        setReviews(revRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!isReady || !strapiToken || !strapiUser || !product) return;
    votesApi.find({ "filters[user][id][$eq]": String(strapiUser.id), "filters[post][documentId][$eq]": product.documentId }, strapiToken)
      .then((res) => { if (res.data?.length > 0) { setUpvoted(true); setVoteDocId(res.data[0].documentId); } }).catch(() => {});
  }, [isReady, strapiToken, strapiUser, product]);

  async function handleUpvote() {
    if (!isReady || !strapiToken || !strapiUser || !product) return;
    if (upvoted && voteDocId) {
      await votesApi.delete(voteDocId, strapiToken).catch(() => {});
      setUpvoted(false); setVoteDocId(null); setUpvoteCount(c => c - 1);
    } else {
      const res = await votesApi.create({ value: 1, user: { connect: [strapiUser.documentId] }, post: { connect: [product.documentId] } }, strapiToken).catch(() => null);
      if (res?.data) { setUpvoted(true); setVoteDocId(res.data.documentId); setUpvoteCount(c => c + 1); }
    }
  }

  async function refreshReviews() {
    const revRes = await reviewsApi.list(slug).catch(() => ({ data: [] as ProductReview[] }));
    setReviews(revRes.data || []);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="px-4 py-3 border-b border-border flex gap-3"><div className="w-5 h-5 bg-gray-200 rounded" /><div className="w-16 h-4 bg-gray-200 rounded" /></div>
        <div className="px-4 py-6 flex gap-4"><div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200" /><div className="flex-1 space-y-2"><div className="w-40 h-5 bg-gray-200 rounded" /><div className="w-64 h-4 bg-gray-100 rounded" /></div></div>
        <div className="px-4 py-4 space-y-2"><div className="w-full h-3 bg-gray-100 rounded" /><div className="w-full h-3 bg-gray-100 rounded" /><div className="w-2/3 h-3 bg-gray-100 rounded" /></div>
      </div>
    );
  }

  if (!product) return <div className="py-20 text-center text-[15px] text-text-tertiary">Product not found</div>;

  const avgRating = product.rating || 0;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-10 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center gap-3">
        <Link href="/launchpad" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg truncate">{product.name}</h1>
      </div>

      {/* Hero */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-secondary border border-border overflow-hidden shrink-0 ">
            {product.logo ? (
              <Image src={strapiMedia(product.logo)} alt="" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-light to-brand/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-brand">{product.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xl leading-tight">{product.name}</h2>
            <p className="text-[15px] text-text-secondary mt-1">{product.tagline}</p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {product.pricing && (
                <span className="text-[11px] font-semibold text-text-secondary bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wide">
                  {product.pricing.replace("_", " ")}
                </span>
              )}
              {product.categories?.map((cat) => (
                <span key={cat} className="text-[11px] font-medium text-brand bg-brand-light/60 px-2 py-0.5 rounded">{cat}</span>
              ))}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-semibold text-sm border transition-all ${
                  upvoted
                    ? "border-brand bg-brand text-white "
                    : "border-border bg-white text-text-primary hover:border-brand hover:text-brand"
                }`}
              >
                <ArrowFatUp size={18} weight={upvoted ? "fill" : "bold"} />
                UPVOTE · {upvoteCount}
              </button>
              {product.website && (
                <a href={product.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-sm font-medium text-text-primary hover:border-brand hover:text-brand transition-colors">
                  <Globe size={16} /> Visit
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mx-4 py-3 border-y border-border flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <ArrowFatUp size={16} className="text-text-tertiary" />
          <span className="text-[14px]"><strong>{formatCount(upvoteCount)}</strong> <span className="text-text-tertiary">upvotes</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <ChatCircle size={16} className="text-text-tertiary" />
          <span className="text-[14px]"><strong>{product.commentCount}</strong> <span className="text-text-tertiary">comments</span></span>
        </div>
        {product.viewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Eye size={16} className="text-text-tertiary" />
            <span className="text-[14px]"><strong>{formatCount(product.viewCount)}</strong> <span className="text-text-tertiary">views</span></span>
          </div>
        )}
        {avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={14} weight="fill" className="text-amber-400" />
            <span className="text-[14px] font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-[14px] text-text-tertiary">({product.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div className="px-4 py-5">
          <h3 className="font-bold text-[15px] mb-2">About</h3>
          <p className="text-[15px] text-text-secondary leading-[1.6] whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {/* Reviews */}
      <div className="border-t border-border">
        <div className="px-4 py-4">
          <h3 className="font-bold text-[15px] mb-4">Reviews ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <div className="py-8 text-center">
              <Star size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-[14px] text-text-tertiary">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {reviews.map((r) => (
                <div key={r.documentId} className="py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={r.user?.avatar} name={r.user?.fullName} size="sm" />
                    <div className="flex-1">
                      <span className="font-semibold text-[13px]">{r.user?.fullName}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} weight={s <= r.rating ? "fill" : "regular"} className={s <= r.rating ? "text-amber-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.whatsGreat && <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">{r.whatsGreat}</p>}
                  {r.whatsBetter && <p className="text-[14px] text-text-tertiary mt-1 leading-relaxed italic">{r.whatsBetter}</p>}
                </div>
              ))}
            </div>
          )}

          {product && <ReviewForm productDocumentId={product.documentId} onReviewSubmitted={refreshReviews} />}
        </div>
      </div>
    </div>
  );
}
