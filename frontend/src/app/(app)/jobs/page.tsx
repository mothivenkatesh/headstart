"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, CurrencyDollar, Briefcase, Plus } from "@phosphor-icons/react";
import { jobs as jobsApi } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Job } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PostJobModal from "@/components/jobs/PostJobModal";
import JobDetailModal from "@/components/jobs/JobDetailModal";
import { timeAgo } from "@/lib/utils";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

export default function JobsPage() {
  const [jobList, setJobList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [showPostJob, setShowPostJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { isReady } = useStrapiUser();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filterType) params["filters[jobType][$eq]"] = filterType;
        const res = await jobsApi.list(params);
        setJobList(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterType]);

  return (
    <div>
      <div className="sticky top-[60px] z-10 bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-semibold text-base">Jobs</h1>
          {isReady && (
            <Button size="sm" onClick={() => setShowPostJob(true)}>
              <Plus size={16} /> Post Job
            </Button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setFilterType("")}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !filterType ? "bg-brand text-white" : "bg-surface-secondary text-text-secondary"
            }`}
          >
            All
          </button>
          {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === key ? "bg-brand text-white" : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 border-b border-border animate-pulse space-y-2">
              <div className="w-48 h-4 bg-gray-200 rounded" />
              <div className="w-32 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : jobList.length === 0 ? (
        <EmptyState icon={<Briefcase size={48} />} title="No jobs posted yet" description="Check back later for new opportunities." />
      ) : (
        jobList.map((job) => (
          <div key={job.documentId} onClick={() => setSelectedJob(job)} className="px-4 py-4 border-b border-border hover:bg-surface-secondary transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm">{job.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{job.company}</p>
              </div>
              {job.jobType && <Badge>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary flex-wrap">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
              )}
              {job.isRemote && <span className="text-success">Remote</span>}
              {job.salaryRange && (
                <span className="flex items-center gap-1"><CurrencyDollar size={13} /> {job.salaryRange}</span>
              )}
              <span className="flex items-center gap-1"><Clock size={13} /> {timeAgo(job.createdAt)}</span>
            </div>
            {job.skills && job.skills.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {job.skills.slice(0, 5).map((skill) => (
                  <span key={skill} className="text-[10px] bg-surface-secondary text-text-tertiary px-1.5 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
      <PostJobModal isOpen={showPostJob} onClose={() => setShowPostJob(false)} onPosted={() => { setFilterType(""); }} />
      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
