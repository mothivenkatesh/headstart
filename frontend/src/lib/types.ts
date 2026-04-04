// Strapi response wrapper
export interface StrapiResponse<T> {
  data: T;
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

export interface StrapiItem {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
}

// User (extended Strapi user)
export interface User extends StrapiItem {
  username: string;
  email: string;
  handle: string;
  fullName: string;
  bio?: string;
  avatar?: StrapiMedia;
  coverImage?: StrapiMedia;
  profileType: "individual" | "company";
  jobTitle?: string;
  company?: string;
  companyType?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  skills?: string[];
  verticals?: string[];
  reputation: number;
  badge?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
}

export interface StrapiMedia {
  id: number;
  url: string;
  name: string;
  width?: number;
  height?: number;
  formats?: Record<string, { url: string; width: number; height: number }>;
}

// Circle
export interface Circle extends StrapiItem {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  memberCount: number;
}

// Post
export interface Post extends StrapiItem {
  title: string;
  body?: string;
  postType: "discussion" | "question" | "showcase" | "launch" | "poll" | "resource" | "job";
  author?: User;
  circle?: Circle;
  images?: StrapiMedia[];
  link?: string;
  tags?: string[];
  pollOptions?: { text: string; votes: number }[];
  pollEndsAt?: string;
  isAnonymous: boolean;
  isPinned: boolean;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  shareCount: number;
}

// Repost
export interface Repost extends StrapiItem {
  user?: User;
  originalPost?: Post;
  thoughts?: string;
}

// Comment
export interface Comment extends StrapiItem {
  body: string;
  author?: User;
  post?: Post;
  parent?: Comment;
  upvoteCount: number;
  downvoteCount: number;
  isHelpful: boolean;
  replies?: Comment[];
}

// Vote
export interface Vote extends StrapiItem {
  user?: User;
  post?: Post;
  comment?: Comment;
  value: number;
}

// Product (Launchpad)
export interface Product extends StrapiItem {
  name: string;
  slug: string;
  tagline: string;
  description?: string;
  pricing?: "free" | "freemium" | "paid" | "open_source" | "contact_sales";
  categories?: string[];
  links?: Record<string, string>;
  logo?: StrapiMedia;
  screenshots?: StrapiMedia[];
  status: "draft" | "pending" | "scheduled" | "launched" | "featured" | "archived" | "rejected";
  submittedBy?: User;
  launchDate?: string;
  upvoteCount: number;
  commentCount: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
  hotScore: number;
  weeklyRank?: number;
  badges?: { period: string; rank: number; label: string }[];
  makers?: User[];
  website?: string;
  tags?: string[];
}

// Product Review
export interface ProductReview extends StrapiItem {
  product?: Product;
  user?: User;
  rating: number;
  whatsGreat?: string;
  whatsBetter?: string;
}

// Job
export interface Job extends StrapiItem {
  title: string;
  company: string;
  description?: string;
  jobType?: "full_time" | "part_time" | "contract" | "internship" | "freelance";
  location?: string;
  isRemote: boolean;
  salaryRange?: string;
  vertical?: string;
  experience?: string;
  skills?: string[];
  applyUrl?: string;
  postedBy?: User;
}

// Job Application
export interface JobApplication extends StrapiItem {
  job?: Job;
  user?: User;
  note?: string;
}

// Conversation
export interface Conversation extends StrapiItem {
  participants?: User[];
  lastMessageAt?: string;
  messages?: Message[];
}

// Message
export interface Message extends StrapiItem {
  conversation?: Conversation;
  sender?: User;
  body: string;
}

// Notification
export interface Notification extends StrapiItem {
  user?: User;
  actor?: User;
  actorName?: string;
  type: string;
  category?: "social" | "engagement" | "launchpad" | "jobs" | "messaging" | "system" | "growth";
  priority?: "low" | "medium" | "high" | "urgent";
  action?: string;
  targetText?: string;
  targetUrl?: string;
  isRead: boolean;
}

// Follow
export interface Follow extends StrapiItem {
  follower?: User;
  following?: User;
}

// Proof of Work
export interface ProofOfWork extends StrapiItem {
  user?: User;
  title: string;
  metric?: string;
  company?: string;
  link?: string;
}

// Deal Signal
export interface DealSignal extends StrapiItem {
  user?: User;
  stage?: string;
  amountRange?: string;
  vertical?: string;
  pitch?: string;
  isActive: boolean;
}

// Marketplace Listing
export interface MarketplaceListing extends StrapiItem {
  user?: User;
  name: string;
  company?: string;
  providerType?: string;
  specialties?: string[];
  bio?: string;
  location?: string;
  hourlyRate?: number;
  status: "pending" | "verified" | "rejected";
}
