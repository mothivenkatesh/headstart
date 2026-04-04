"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { products as productsApi } from "@/lib/strapi";
import Button from "@/components/ui/Button";

const CATEGORIES = [
  "SaaS", "AI & ML", "Developer Tools", "Marketplace", "Fintech", "Healthtech",
  "Edtech", "E-commerce", "Open Source", "B2B", "Consumer", "Climate",
  "Infrastructure", "Security", "Productivity", "Social", "Web3",
];

const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
  { value: "open_source", label: "Open Source" },
  { value: "contact_sales", label: "Contact for Pricing" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function SubmitProductModal({ isOpen, onClose, onSubmitted }: Props) {
  const { strapiUser, strapiToken } = useStrapiUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    website: "",
    description: "",
    pricing: "free",
    categories: [] as string[],
  });

  if (!isOpen) return null;

  function toggleCategory(cat: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : prev.categories.length < 3
        ? [...prev.categories, cat]
        : prev.categories,
    }));
  }

  async function handleSubmit() {
    if (!strapiToken || !strapiUser) return;
    setSaving(true);
    try {
      await productsApi.create(
        {
          name: form.name,
          tagline: form.tagline,
          website: form.website || undefined,
          description: form.description || undefined,
          pricing: form.pricing as "free",
          categories: form.categories,
          status: "pending",
          submittedBy: { connect: [strapiUser.documentId] },
          submittedAt: new Date().toISOString(),
        } as Record<string, unknown>,
        strapiToken
      );
      onSubmitted();
      onClose();
      setStep(1);
      setForm({ name: "", tagline: "", website: "", description: "", pricing: "free", categories: [] });
    } catch (err) {
      console.error("Submit product error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-screen sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Submit a Product</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 px-5 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${s <= step ? "bg-brand" : "bg-gray-200"}`}
            />
          ))}
        </div>

        <div className="px-5 py-4 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-text-secondary">Step 1: Basics</p>
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. PayEase SDK"
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tagline *</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="One line about your product"
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website URL</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <Button
                className="w-full"
                disabled={!form.name || !form.tagline}
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-text-secondary">Step 2: Details</p>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="What does your product do?"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pricing</label>
                <div className="flex flex-wrap gap-2">
                  {PRICING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, pricing: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.pricing === opt.value
                          ? "border-brand bg-brand-light text-brand"
                          : "border-border text-text-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categories (max 3)</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.categories.includes(cat)
                          ? "border-brand bg-brand-light text-brand"
                          : "border-border text-text-secondary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-text-secondary">Step 3: Review & Submit</p>
              <div className="bg-surface-secondary rounded-lg p-4 space-y-2 text-sm">
                <div><strong>Name:</strong> {form.name}</div>
                <div><strong>Tagline:</strong> {form.tagline}</div>
                {form.website && <div><strong>Website:</strong> {form.website}</div>}
                {form.description && <div><strong>Description:</strong> {form.description.slice(0, 100)}...</div>}
                <div><strong>Pricing:</strong> {form.pricing}</div>
                <div><strong>Categories:</strong> {form.categories.join(", ") || "None"}</div>
              </div>
              <p className="text-xs text-text-tertiary">
                Your product will be reviewed before appearing on the launchpad.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Submitting..." : "Submit Product"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
