"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Globe, LinkedinLogo, XLogo, CalendarBlank, Briefcase, GearSix, PencilSimple, ArrowLeft } from "@phosphor-icons/react";
import { userProfile as profileApi, posts as postsApi, reposts as repostsApi, conversations as convoApi } from "@/lib/strapi";
import { useStrapiUser } from "@/lib/useStrapi";
import type { Post, Repost } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import FollowButton from "@/components/ui/FollowButton";
import PostCard from "@/components/feed/PostCard";
import RepostCard from "@/components/feed/RepostCard";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { formatCount } from "@/lib/utils";

interface ProfileData {
  id: number; documentId: string; fullName: string; handle: string; email: string;
  bio: string | null; avatar: unknown; coverImage: unknown; profileType: string;
  jobTitle: string | null; company: string | null; companyType: string | null;
  location: string | null; website: string | null; linkedinUrl: string | null; twitterUrl: string | null;
  skills: string[]; verticals: string[]; yearsOfExperience: number | null;
  isFreelancer: boolean; availableForHire: boolean; reputation: number;
  badge: string | null; isVerified: boolean; followerCount: number; followingCount: number;
  postCount: number; proofOfWorks: { id: number; title: string; metric?: string; company?: string; link?: string }[];
  createdAt: string;
}

export default function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const router = useRouter();
  const { strapiUser, strapiToken, isReady } = useStrapiUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userReposts, setUserReposts] = useState<Repost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [showEdit, setShowEdit] = useState(false);

  const isOwnProfile = isReady && strapiUser && (strapiUser.handle === handle || handle === "me");
  const resolvedHandle = handle === "me" ? strapiUser?.handle : handle;

  useEffect(() => { if (resolvedHandle) loadProfile(); }, [resolvedHandle]);

  async function startMessageWith(targetDocumentId: string) {
    if (!strapiToken || !strapiUser) return;
    try {
      const res = await convoApi.create({ participants: { connect: [strapiUser.documentId, targetDocumentId] } }, strapiToken);
      if (res.data) router.push(`/inbox?chat=${res.data.documentId}`);
    } catch { router.push("/inbox"); }
  }

  async function loadProfile() {
    if (!resolvedHandle) return;
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        profileApi.getByHandle(resolvedHandle),
        postsApi.list({ "filters[author][handle][$eq]": resolvedHandle }),
      ]);
      setProfile(profileRes.data as unknown as ProfileData);
      setUserPosts(postsRes.data || []);
      if (strapiToken) {
        try {
          const repostsRes = await repostsApi.list(strapiToken, { "filters[user][handle][$eq]": resolvedHandle });
          setUserReposts(repostsRes.data || []);
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-100" />
        <div className="px-4 -mt-12 flex gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white" />
          <div className="pt-14 space-y-2"><div className="w-32 h-5 bg-gray-200 rounded" /><div className="w-20 h-3 bg-gray-100 rounded" /></div>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="py-20 text-center text-base text-text-tertiary">User not found</div>;

  const p = profile;
  const skills = p.skills || [];
  const verticals = p.verticals || [];
  const proofOfWorks = p.proofOfWorks || [];
  const joinDate = new Date(p.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  type FeedItem = { type: "post"; data: Post; date: string } | { type: "repost"; data: Repost; date: string };
  const feedItems: FeedItem[] = [
    ...userPosts.map((pp): FeedItem => ({ type: "post", data: pp, date: pp.createdAt })),
    ...userReposts.map((r): FeedItem => ({ type: "repost", data: r, date: r.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      {/* Banner */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-brand/20 via-brand/10 to-brand/5" />
        <button onClick={() => router.back()} className="absolute top-3 left-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm">
          <ArrowLeft size={18} weight="bold" />
        </button>
        {isOwnProfile && (
          <Link href="/settings" className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm">
            <GearSix size={18} />
          </Link>
        )}
        <div className="absolute -bottom-10 left-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-white bg-white">
            <Avatar src={null} name={p.fullName} size="xl" className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Actions — right aligned */}
      <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1" style={{ paddingLeft: 0 }}>
        {isOwnProfile ? (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowEdit(true)}>
            <PencilSimple size={15} /> Edit Profile
          </Button>
        ) : isReady && strapiUser ? (
          <>
            <FollowButton targetUserId={p.id} targetUserDocumentId={p.documentId} onFollowChange={(isFollowing) => {
                  if (profile) setProfile({ ...profile, followerCount: profile.followerCount + (isFollowing ? 1 : -1) });
                }} />
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => startMessageWith(p.documentId)}>Message</Button>
          </>
        ) : null}
      </div>

      {/* Profile info */}
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="text-xl font-bold leading-tight">{p.fullName}</h1>
          {p.isVerified && <svg className="w-5 h-5 text-brand shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        </div>
        <p className="text-sm text-text-tertiary mt-0.5">@{p.handle}</p>

        {/* Metrics */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-base"><strong>{formatCount(p.followingCount)}</strong> <span className="text-text-tertiary">following</span></span>
          <span className="text-base"><strong>{formatCount(p.followerCount)}</strong> <span className="text-text-tertiary">followers</span></span>
          <span className="text-base"><strong>{p.postCount}</strong> <span className="text-text-tertiary">{p.postCount === 1 ? "post" : "posts"}</span></span>
        </div>

        {p.bio && <p className="text-base text-text-primary leading-relaxed mt-3 select-text">{p.bio}</p>}

        <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-text-tertiary">
          {p.jobTitle && p.company && <span className="flex items-center gap-1"><Briefcase size={14} /> {p.jobTitle} at {p.company}</span>}
          {p.location && <span className="flex items-center gap-1"><MapPin size={14} /> {p.location}</span>}
          <span className="flex items-center gap-1"><CalendarBlank size={14} /> Joined {joinDate}</span>
        </div>

        {(p.website || p.linkedinUrl || p.twitterUrl) && (
          <div className="flex items-center gap-3 mt-2">
            {p.website && <a href={p.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-brand hover:underline"><Globe size={14} /> {p.website.replace(/^https?:\/\//, "").split("/")[0]}</a>}
            {p.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener" className="text-text-tertiary hover:text-brand transition-colors"><LinkedinLogo size={18} /></a>}
            {p.twitterUrl && <a href={p.twitterUrl} target="_blank" rel="noopener" className="text-text-tertiary hover:text-brand transition-colors"><XLogo size={18} /></a>}
          </div>
        )}

        {(p.availableForHire || p.isFreelancer) && (
          <div className="flex gap-2 mt-3">
            {p.availableForHire && <span className="text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Open to work</span>}
            {p.isFreelancer && <span className="text-sm font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">Freelancer</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["posts", "about"] as const).map((tab) => (
          <div key={tab} role="button" tabIndex={0} onClick={() => setActiveTab(tab)} onKeyDown={(e) => e.key === "Enter" && setActiveTab(tab)}
            data-active={activeTab === tab} className="tab-item">
            <span className={`tab-item-inner text-base font-semibold capitalize ${activeTab === tab ? "text-text-primary" : "text-text-tertiary"}`}>{tab}</span>
          </div>
        ))}
      </div>

      {activeTab === "posts" && (
        feedItems.length === 0 ? (
          <div className="py-16 text-center"><p className="text-base font-semibold text-text-primary mb-1">{isOwnProfile ? "Share your first post" : "No posts yet"}</p><p className="text-sm text-text-tertiary max-w-xs mx-auto">{isOwnProfile ? "Your posts will appear here. Start a discussion in any circle!" : `@${p.handle} hasn't posted anything yet.`}</p></div>
        ) : feedItems.map((item) =>
          item.type === "repost" ? <RepostCard key={`r-${item.data.documentId}`} repost={item.data as Repost} onDeleted={loadProfile} />
          : <PostCard key={`p-${item.data.documentId}`} post={item.data as Post} onDeleted={loadProfile} />
        )
      )}

      {activeTab === "about" && (
        <div className="px-4 py-5 space-y-5">
          {skills.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2">Skills</h3>
              <div className="flex gap-1.5 flex-wrap">{skills.map((s) => <span key={s} className="text-sm text-text-secondary bg-surface-secondary px-2.5 py-1 rounded-full">{s}</span>)}</div>
            </div>
          )}
          {verticals.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2">Verticals</h3>
              <div className="flex gap-1.5 flex-wrap">{verticals.map((v) => <span key={v} className="text-sm text-brand bg-brand-light px-2.5 py-1 rounded-full">{v}</span>)}</div>
            </div>
          )}
          {proofOfWorks.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2">Proof of Work</h3>
              <div className="space-y-2">{proofOfWorks.map((pow) => (
                <div key={pow.id} className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-sm">{pow.title}</p>
                  {pow.metric && <p className="text-sm text-brand">{pow.metric}</p>}
                  {pow.company && <p className="text-sm text-text-tertiary">{pow.company}</p>}
                  {pow.link && <a href={pow.link} target="_blank" rel="noopener" className="text-sm text-brand hover:underline">View</a>}
                </div>
              ))}</div>
            </div>
          )}
          {skills.length === 0 && verticals.length === 0 && proofOfWorks.length === 0 && (
            <p className="text-base text-text-tertiary text-center py-8">No details added yet</p>
          )}
        </div>
      )}

      {profile && <EditProfileModal profile={profile} isOpen={showEdit} onClose={() => setShowEdit(false)} onSaved={(updatedData) => {
            if (updatedData && profile) {
              setProfile({ ...profile, ...updatedData });
            }
            loadProfile();
          }} />}
    </div>
  );
}
