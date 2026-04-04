"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface StrapiUser {
  id: number;
  documentId: string;
  email: string;
  username: string;
  handle: string;
  fullName: string;
  bio?: string;
  profileType: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  reputation: number;
  badge?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  skills?: string[];
  verticals?: string[];
}

interface StrapiContextType {
  strapiUser: StrapiUser | null;
  strapiToken: string | null;
  loading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
}

const StrapiContext = createContext<StrapiContextType>({
  strapiUser: null,
  strapiToken: null,
  loading: true,
  isReady: false,
  refreshUser: async () => {},
});

export function StrapiProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [strapiUser, setStrapiUser] = useState<StrapiUser | null>(null);
  const [strapiToken, setStrapiToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(async () => {
    if (!clerkUser?.primaryEmailAddress?.emailAddress) return;

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clerkUser.primaryEmailAddress.emailAddress,
          fullName: clerkUser.fullName || clerkUser.firstName || "",
          handle: clerkUser.username || clerkUser.primaryEmailAddress.emailAddress.split("@")[0],
          clerkId: clerkUser.id,
        }),
      });

      if (!res.ok) throw new Error("Auth sync failed");

      const data = await res.json();
      setStrapiUser(data.user);
      setStrapiToken(data.jwt);
    } catch (err) {
      console.error("Strapi sync error:", err);
    } finally {
      setLoading(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn) {
      setStrapiUser(null);
      setStrapiToken(null);
      setLoading(false);
      return;
    }
    syncUser();
  }, [clerkLoaded, isSignedIn, syncUser]);

  const refreshUser = useCallback(async () => {
    if (!strapiToken || !strapiUser) return;
    try {
      const res = await fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${strapiToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStrapiUser(data);
      }
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  }, [strapiToken, strapiUser]);

  return (
    <StrapiContext.Provider
      value={{
        strapiUser,
        strapiToken,
        loading,
        isReady: !loading && !!strapiUser && !!strapiToken,
        refreshUser,
      }}
    >
      {children}
    </StrapiContext.Provider>
  );
}

export function useStrapiUser() {
  return useContext(StrapiContext);
}
