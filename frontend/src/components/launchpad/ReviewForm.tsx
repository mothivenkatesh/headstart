"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { productReviews as reviewsApi } from "@/lib/strapi";
import Button from "@/components/ui/Button";

interface Props {
  productDocumentId: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productDocumentId, onReviewSubmitted }: Props) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [whatsGreat, setWhatsGreat] = useState("");
  const [whatsBetter, setWhatsBetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isReady || submitted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!strapiToken || !strapiUser || rating === 0) return;
    setSaving(true);
    try {
      await reviewsApi.create(
        {
          rating,
          whatsGreat: whatsGreat || undefined,
          whatsBetter: whatsBetter || undefined,
          product: { connect: [productDocumentId] },
          user: { connect: [strapiUser.documentId] },
        },
        strapiToken
      );
      setSubmitted(true);
      onReviewSubmitted();
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border pt-4 mt-4 space-y-3">
      <h4 className="font-semibold text-sm">Write a Review</h4>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star
              size={24}
              weight={s <= (hoverRating || rating) ? "fill" : "regular"}
              className={s <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-300"}
            />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-text-secondary ml-2">{rating}/5</span>}
      </div>

      <textarea
        value={whatsGreat}
        onChange={(e) => setWhatsGreat(e.target.value)}
        placeholder="What's great about this product?"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand"
      />
      <textarea
        value={whatsBetter}
        onChange={(e) => setWhatsBetter(e.target.value)}
        placeholder="What could be improved?"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand"
      />
      <Button type="submit" size="sm" disabled={rating === 0 || saving}>
        {saving ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
