"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { userProfile as profileApi } from "@/lib/strapi";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

interface Props {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (data?: any) => void;
}

export default function EditProfileModal({ profile, isOpen, onClose, onSaved }: Props) {
  const { strapiToken } = useStrapiUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: profile.fullName || "",
    handle: profile.handle || "",
    bio: profile.bio || "",
    location: profile.location || "",
    profileType: profile.profileType || "individual",
    jobTitle: profile.jobTitle || "",
    company: profile.company || "",
    yearsOfExperience: profile.yearsOfExperience || 0,
    website: profile.website || "",
    linkedinUrl: profile.linkedinUrl || "",
    twitterUrl: profile.twitterUrl || "",
    skills: (profile.skills || []).join(", "),
    verticals: (profile.verticals || []).join(", "),
    isFreelancer: profile.isFreelancer || false,
    availableForHire: profile.availableForHire || false,
  });

  if (!isOpen) return null;

  function update(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!strapiToken) return;
    setSaving(true);
    try {
      await profileApi.updateMe({
        fullName: form.fullName, handle: form.handle, bio: form.bio, location: form.location,
        profileType: form.profileType, jobTitle: form.jobTitle, company: form.company,
        yearsOfExperience: form.yearsOfExperience || undefined,
        website: form.website || undefined, linkedinUrl: form.linkedinUrl || undefined, twitterUrl: form.twitterUrl || undefined,
        skills: form.skills ? form.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        verticals: form.verticals ? form.verticals.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        isFreelancer: form.isFreelancer, availableForHire: form.availableForHire,
      }, strapiToken);
      onSaved(form); onClose();
    } catch (err) { console.error("Save profile error:", err); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-12 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header — Bluesky style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-black/[0.04] transition-colors">
            <X size={20} className="text-text-primary" />
          </button>
          <span className="font-bold text-lg">Edit Profile</span>
          <Button size="sm" className="rounded-full px-5" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Banner + Avatar — Bluesky style */}
        <div className="relative shrink-0">
          <div className="h-24 bg-gradient-to-r from-brand/20 via-brand/10 to-brand/5" />
          <div className="absolute -bottom-8 left-5">
            <div className="w-16 h-16 rounded-full border-[3px] border-white bg-white">
              <Avatar src={null} name={form.fullName} size="lg" className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-4 pt-12 pb-6 space-y-4">
          <Field label="Display name" value={form.fullName} onChange={(v) => update("fullName", v)} maxLength={64} />
          <Field label="Handle" value={form.handle} onChange={(v) => update("handle", v)} prefix="@" />

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} maxLength={300}
              placeholder="Tell the community about yourself"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-base resize-none focus:outline-none focus:border-brand transition-colors" />
            <p className="text-sm text-text-tertiary mt-1 text-right">{form.bio.length}/300</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title" value={form.jobTitle} onChange={(v) => update("jobTitle", v)} placeholder="e.g. VP Engineering" />
            <Field label="Company" value={form.company} onChange={(v) => update("company", v)} placeholder="e.g. Cashfree" />
          </div>

          <Field label="Location" value={form.location} onChange={(v) => update("location", v)} placeholder="e.g. Bangalore, India" />
          <Field label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://yoursite.com" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="LinkedIn" value={form.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} placeholder="linkedin.com/in/..." />
            <Field label="Twitter / X" value={form.twitterUrl} onChange={(v) => update("twitterUrl", v)} placeholder="x.com/..." />
          </div>

          <Field label="Skills (comma-separated)" value={form.skills} onChange={(v) => update("skills", v)} placeholder="Go, React, Payments" />
          <Field label="Verticals (comma-separated)" value={form.verticals} onChange={(v) => update("verticals", v)} placeholder="SaaS, AI, Developer Tools" />

          <div className="space-y-3 pt-2">
            <Toggle label="Open to work" description="Show that you're available for opportunities" checked={form.availableForHire} onChange={(v) => update("availableForHire", v)} />
            <Toggle label="Freelancer" description="Show that you offer freelance services" checked={form.isFreelancer} onChange={(v) => update("isFreelancer", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, prefix, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string; maxLength?: number }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-primary mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-tertiary">{prefix}</span>}
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
          className={`w-full h-10 rounded-lg border border-border text-base focus:outline-none focus:border-brand transition-colors ${prefix ? "pl-7 pr-3" : "px-3"}`} />
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-base font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-tertiary">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-brand" : "bg-gray-200"}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
