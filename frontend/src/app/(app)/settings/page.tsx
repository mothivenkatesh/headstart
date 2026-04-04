"use client";

import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { ArrowLeft, User, Bell, ShieldCheck, SignOut, Envelope, Lock, Eye } from "@phosphor-icons/react";
import { useStrapiUser } from "@/lib/useStrapi";
import Avatar from "@/components/ui/Avatar";

export default function SettingsPage() {
  const { strapiUser } = useStrapiUser();
  const { signOut } = useClerk();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      key: "account",
      icon: User,
      label: "Account",
      description: "Manage your account details",
      content: (
        <div className="space-y-4">
          <SettingRow label="Email" value={strapiUser?.email || "—"} />
          <SettingRow label="Handle" value={`@${strapiUser?.handle || "—"}`} />
          <SettingRow label="Profile Type" value={strapiUser?.profileType === "company" ? "Company" : "Professional"} />
          <SettingRow label="Member since" value={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
          <Link href={`/profile/${strapiUser?.handle || "me"}`} className="block text-[14px] text-brand font-medium hover:underline">
            View public profile
          </Link>
        </div>
      ),
    },
    {
      key: "notifications",
      icon: Bell,
      label: "Notifications",
      description: "Choose what you get notified about",
      content: (
        <div className="space-y-3">
          <ToggleRow label="Upvotes on your posts" defaultChecked />
          <ToggleRow label="Comments on your posts" defaultChecked />
          <ToggleRow label="New followers" defaultChecked />
          <ToggleRow label="Product reviews" defaultChecked />
          <ToggleRow label="Direct messages" defaultChecked />
          <ToggleRow label="Job application updates" defaultChecked />
          <ToggleRow label="Weekly digest email" defaultChecked={false} />
        </div>
      ),
    },
    {
      key: "privacy",
      icon: Eye,
      label: "Privacy",
      description: "Control your visibility and data",
      content: (
        <div className="space-y-3">
          <ToggleRow label="Show profile in search results" defaultChecked />
          <ToggleRow label="Show email on profile" defaultChecked={false} />
          <ToggleRow label="Allow direct messages from anyone" defaultChecked />
          <ToggleRow label="Show online status" defaultChecked />
          <ToggleRow label="Show activity status" defaultChecked />
        </div>
      ),
    },
    {
      key: "security",
      icon: ShieldCheck,
      label: "Security",
      description: "Password and authentication",
      content: (
        <div className="space-y-4">
          <div className="bg-surface-secondary rounded-xl p-4">
            <p className="text-[14px] text-text-secondary">
              Your authentication is managed by Clerk. To change your password or enable two-factor authentication, use your Clerk account settings.
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <Lock size={18} className="text-green-600" />
            <span className="text-[14px] text-green-700 font-medium">Account secured via Clerk</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-[60px] z-10 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-lg">Settings</h1>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-3">
        <Avatar src={null} name={strapiUser?.fullName} size="lg" />
        <div>
          <p className="font-bold text-[15px]">{strapiUser?.fullName || "User"}</p>
          <p className="text-[13px] text-text-tertiary">@{strapiUser?.handle || "user"}</p>
        </div>
      </div>

      {/* Sections */}
      <div>
        {sections.map((section) => (
          <div key={section.key} className="border-b border-border">
            <button
              onClick={() => setActiveSection(activeSection === section.key ? null : section.key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="p-2 rounded-xl bg-surface-secondary">
                <section.icon size={20} className="text-text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text-primary">{section.label}</p>
                <p className="text-[13px] text-text-tertiary">{section.description}</p>
              </div>
              <svg
                className={`w-4 h-4 text-text-tertiary transition-transform ${activeSection === section.key ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {activeSection === section.key && (
              <div className="px-4 pb-4 pt-1">
                {section.content}
              </div>
            )}
          </div>
        ))}

        {/* Sign out */}
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
        >
          <div className="p-2 rounded-xl bg-red-50">
            <SignOut size={20} className="text-red-500" />
          </div>
          <p className="text-[15px] font-semibold text-red-600">Sign out</p>
        </button>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[14px] text-text-tertiary">{label}</span>
      <span className="text-[14px] font-medium text-text-primary">{value}</span>
    </div>
  );
}

function ToggleRow({ label, defaultChecked = true }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[14px] text-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-brand" : "bg-gray-200"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
