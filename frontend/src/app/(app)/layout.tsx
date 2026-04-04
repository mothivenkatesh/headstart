"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "@/components/layout/GlobalHeader";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import BottomNav from "@/components/layout/BottomNav";
import { StrapiProvider } from "@/lib/useStrapi";
import { SocketProvider } from "@/lib/useSocket";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInbox = pathname === "/inbox";

  return (
    <StrapiProvider>
      <SocketProvider>
        <GlobalHeader />
        <div className="mx-auto flex justify-center mt-[60px] min-h-[calc(100vh-60px)] pb-20 lg:pb-0">
          <Sidebar />
          {isInbox ? (
            <main className="w-full lg:w-[920px] shrink-0 border-x border-border min-h-full bg-surface max-lg:border-x-0">
              {children}
            </main>
          ) : (
            <>
              <main className="w-full lg:w-[600px] shrink-0 lg:border-x border-border min-h-full bg-surface">
                {children}
              </main>
              <RightPanel />
            </>
          )}
        </div>
        <BottomNav />
      </SocketProvider>
    </StrapiProvider>
  );
}
