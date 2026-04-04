"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { jobs as jobsApi } from "@/lib/strapi";
import Button from "@/components/ui/Button";

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPosted: () => void;
}

export default function PostJobModal({ isOpen, onClose, onPosted }: Props) {
  const { strapiUser, strapiToken } = useStrapiUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    jobType: "full_time",
    location: "",
    isRemote: false,
    salaryRange: "",
    vertical: "",
    skills: "",
    applyUrl: "",
  });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!strapiToken || !strapiUser) return;
    setSaving(true);
    try {
      await jobsApi.create(
        {
          title: form.title,
          company: form.company,
          description: form.description || undefined,
          jobType: form.jobType as "full_time",
          location: form.location || undefined,
          isRemote: form.isRemote,
          salaryRange: form.salaryRange || undefined,
          vertical: form.vertical || undefined,
          skills: form.skills ? form.skills.split(",").map((s) => s.trim()) : undefined,
          applyUrl: form.applyUrl || undefined,
          postedBy: { connect: [strapiUser.documentId] },
        } as Record<string, unknown>,
        strapiToken
      );
      onPosted();
      onClose();
      setForm({ title: "", company: "", description: "", jobType: "full_time", location: "", isRemote: false, salaryRange: "", vertical: "", skills: "", applyUrl: "" });
    } catch (err) {
      console.error("Post job error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-screen sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Post a Job</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:border-brand">
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remote" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} className="rounded" />
            <label htmlFor="remote" className="text-sm">Remote friendly</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Salary Range</label>
              <input type="text" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="e.g. 15-25 LPA" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vertical</label>
              <input type="text" value={form.vertical} onChange={(e) => setForm({ ...form, vertical: e.target.value })} placeholder="e.g. Payments" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
            <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, Node.js, PostgreSQL" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apply URL</label>
            <input type="url" value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} placeholder="https://..." className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-brand" />
          </div>
          <Button type="submit" className="w-full" disabled={!form.title || !form.company || saving}>
            {saving ? "Posting..." : "Post Job"}
          </Button>
        </form>
      </div>
    </div>
  );
}
