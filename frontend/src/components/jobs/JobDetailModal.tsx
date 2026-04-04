"use client";

import { useState } from "react";
import { X, MapPin, Clock, CurrencyDollar, Globe } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import { jobApplications as appApi } from "@/lib/strapi";
import type { Job } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time", part_time: "Part Time", contract: "Contract",
  internship: "Internship", freelance: "Freelance",
};

interface Props {
  job: Job;
  onClose: () => void;
}

export default function JobDetailModal({ job, onClose }: Props) {
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [showApply, setShowApply] = useState(false);
  const [note, setNote] = useState("");
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!strapiToken || !strapiUser) return;
    setSaving(true);
    try {
      await appApi.create(
        { job: { connect: [job.documentId] }, user: { connect: [strapiUser.documentId] }, note: note || undefined },
        strapiToken
      );
      setApplied(true);
      setShowApply(false);
    } catch (err) {
      console.error("Apply error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-lg sm:mx-4 max-h-screen sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">{job.title}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X size={20} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm text-text-secondary">{job.company}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary flex-wrap">
              {job.jobType && <Badge>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</Badge>}
              {job.location && <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>}
              {job.isRemote && <span className="text-green-600 font-medium">Remote</span>}
              {job.salaryRange && <span className="flex items-center gap-1"><CurrencyDollar size={13} /> {job.salaryRange}</span>}
              <span className="flex items-center gap-1"><Clock size={13} /> {timeAgo(job.createdAt)}</span>
            </div>
          </div>

          {job.description && (
            <div>
              <h3 className="font-semibold text-sm mb-1">Description</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Skills</h3>
              <div className="flex gap-1.5 flex-wrap">
                {job.skills.map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </div>
          )}

          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-brand">
              <Globe size={14} /> External apply link
            </a>
          )}

          {/* Apply section */}
          {applied ? (
            <div className="bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg">
              Application submitted successfully!
            </div>
          ) : showApply ? (
            <form onSubmit={handleApply} className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-sm">Apply to this job</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note or cover letter (optional)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-brand"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowApply(false)}>Cancel</Button>
                <Button size="sm" type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Application"}</Button>
              </div>
            </form>
          ) : isReady ? (
            <Button className="w-full" onClick={() => setShowApply(true)}>Apply Now</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
