"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Rocket, Briefcase, User } from "@phosphor-icons/react";
import { useScrollDirection } from "@/lib/useScrollDirection";

const ITEMS = [
  { label: "Home", href: "/", icon: House },
  { label: "Launchpad", href: "/launchpad", icon: Rocket },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Profile", href: "/profile/me", icon: User },
];

// Bluesky MinimalShellFooterTransform: hides on scroll down, shows on scroll up
export default function BottomNav() {
  const pathname = usePathname();
  const hidden = useScrollDirection();

  return (
    <nav
      className="lg:hidden fixed left-0 right-0 z-30 bg-surface border-t border-border flex transition-transform duration-300 ease-out"
      style={{
        bottom: 0,
        paddingLeft: 5,
        paddingRight: 10,
        paddingBottom: "max(env(safe-area-inset-bottom), 4px)",
        transform: hidden ? "translateY(100%)" : "translateY(0)",
      }}
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center" style={{ paddingTop: 13, paddingBottom: 4 }}>
            <item.icon size={26} weight={active ? "fill" : "regular"} className={active ? "text-text-primary" : "text-text-tertiary"} />
            <span className={`text-[10px] mt-0.5 ${active ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
