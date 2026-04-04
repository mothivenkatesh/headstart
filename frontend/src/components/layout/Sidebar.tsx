"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Rocket, Briefcase, ChatCircle, BookmarkSimple,
  Bell, User, GearSix,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: House },
  { label: "Launchpad", href: "/launchpad", icon: Rocket },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Chat", href: "/inbox", icon: ChatCircle },
  { label: "Bookmarks", href: "/bookmarks", icon: BookmarkSimple },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile/me", icon: User },
  { label: "Settings", href: "/settings", icon: GearSix },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[200px] shrink-0 sticky top-[84px] h-[calc(100vh-84px)] overflow-y-auto flex-col items-start">
      <nav className="flex flex-col gap-0.5 py-1 w-full">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors duration-100 ${
                active ? "" : "hover:bg-black/[0.04]"
              }`}
            >
              <item.icon
                size={26}
                weight={active ? "fill" : "regular"}
                className="text-text-primary shrink-0"
              />
              <span className={`text-[17px] leading-none ${active ? "font-bold" : "font-normal"} text-text-primary`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
