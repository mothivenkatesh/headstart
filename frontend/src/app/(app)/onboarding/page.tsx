"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStrapiUser } from "@/lib/useStrapi";
import Button from "@/components/ui/Button";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export default function OnboardingPage() {
  const { strapiUser, strapiToken, refreshUser } = useStrapiUser();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: strapiUser?.fullName || "",
    handle: strapiUser?.handle || "",
    bio: "",
    jobTitle: "",
    company: "",
    location: "",
    profileType: "individual" as "individual" | "company",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!strapiUser || !strapiToken) return;
    setSaving(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/users/${strapiUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${strapiToken}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await refreshUser();
        router.push("/");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Complete your profile</h1>
      <p className="text-sm text-text-secondary mb-8">
        Tell the community about yourself.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Handle *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">@</span>
            <input
              type="text"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
              className="w-full h-10 pl-7 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">I am a</label>
          <div className="flex gap-3">
            {(["individual", "company"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, profileType: type })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.profileType === type
                    ? "border-brand bg-brand-light text-brand"
                    : "border-border text-text-secondary hover:bg-surface-secondary"
                }`}
              >
                {type === "individual" ? "Professional" : "Company"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            placeholder="What are you building?"
            className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="e.g. Product Manager"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Cashfree"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Bangalore, India"
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand"
          />
        </div>

        <Button type="submit" className="w-full" disabled={!form.fullName || !form.handle || saving}>
          {saving ? "Saving..." : "Complete Profile"}
        </Button>
      </form>
    </div>
  );
}
