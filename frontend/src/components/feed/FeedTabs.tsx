"use client";

const TABS = ["For You", "Trending", "Following"] as const;

interface FeedTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

export default function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex border-b border-border">
      {TABS.map((tab) => (
        <div
          key={tab}
          role="button"
          tabIndex={0}
          onClick={() => onChange(tab)}
          onKeyDown={(e) => e.key === "Enter" && onChange(tab)}
          data-active={active === tab}
          className="tab-item"
        >
          <span
            className={`tab-item-inner text-[15px] font-semibold ${
              active === tab ? "text-text-primary" : "text-text-tertiary"
            }`}
          >
            {tab}
          </span>
        </div>
      ))}
    </div>
  );
}
