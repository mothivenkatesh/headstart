import type {
  StrapiResponse,
  Circle,
  Post,
  Comment,
  Product,
  ProductReview,
  Job,
  JobApplication,
  Conversation,
  Repost,
  Message,
  Notification,
  Follow,
  Vote,
  ProofOfWork,
} from "./types";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function fetchStrapi<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, token, params } = options;

  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Strapi error: ${res.status}`);
  }

  return res.json();
}

// Helper to build populate params
function withPopulate(fields: string[]): Record<string, string> {
  return fields.reduce((acc, field, i) => {
    acc[`populate[${i}]`] = field;
    return acc;
  }, {} as Record<string, string>);
}

// ─── Circles ─────────────────────────────────────────────
export const circles = {
  list: () =>
    fetchStrapi<StrapiResponse<Circle[]>>("/circles", {
      params: { "pagination[pageSize]": "50", sort: "name:asc" },
    }),
  get: (documentId: string) =>
    fetchStrapi<StrapiResponse<Circle>>(`/circles/${documentId}`),
};

// ─── Posts ───────────────────────────────────────────────
export const posts = {
  list: (params?: Record<string, string>) =>
    fetchStrapi<StrapiResponse<Post[]>>("/posts", {
      params: {
        ...withPopulate(["author", "circle", "images"]),
        sort: "createdAt:desc",
        "pagination[pageSize]": "20",
        ...params,
      },
    }),
  get: (documentId: string) =>
    fetchStrapi<StrapiResponse<Post>>(`/posts/${documentId}`, {
      params: withPopulate(["author", "circle", "images", "comments"]),
    }),
  create: (data: Partial<Post>, token: string) =>
    fetchStrapi<StrapiResponse<Post>>("/posts", { method: "POST", body: { data }, token }),
  update: (documentId: string, data: Partial<Post>, token: string) =>
    fetchStrapi<StrapiResponse<Post>>(`/posts/${documentId}`, { method: "PUT", body: { data }, token }),
  delete: (documentId: string, token: string) =>
    fetchStrapi<StrapiResponse<Post>>(`/posts/${documentId}`, { method: "DELETE", token }),
};

// ─── Comments ────────────────────────────────────────────
export const comments = {
  list: (postDocumentId: string) =>
    fetchStrapi<StrapiResponse<Comment[]>>("/comments", {
      params: {
        "filters[post][documentId][$eq]": postDocumentId,
        ...withPopulate(["author", "parent"]),
        sort: "createdAt:asc",
        "pagination[pageSize]": "100",
      },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Comment>>("/comments", { method: "POST", body: { data }, token }),
};

// ─── Votes ───────────────────────────────────────────────
export const votes = {
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Vote>>("/votes", { method: "POST", body: { data }, token }),
  find: (params: Record<string, string>, token: string) =>
    fetchStrapi<StrapiResponse<Vote[]>>("/votes", { params, token }),
  delete: (documentId: string, token: string) =>
    fetchStrapi(`/votes/${documentId}`, { method: "DELETE", token }),
};

// ─── Saved Posts ─────────────────────────────────────────
export const savedPosts = {
  list: (token: string, params?: Record<string, string>) =>
    fetchStrapi<StrapiResponse<{ id: number; documentId: string; post?: Post }[]>>("/saved-posts", {
      token,
      params: { ...withPopulate(["post", "post.author", "post.circle"]), ...params },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<{ id: number; documentId: string }>>("/saved-posts", { method: "POST", body: { data }, token }),
  delete: (documentId: string, token: string) =>
    fetchStrapi(`/saved-posts/${documentId}`, { method: "DELETE", token }),
};

// ─── Products (Launchpad) ────────────────────────────────
export const products = {
  list: (params?: Record<string, string>) =>
    fetchStrapi<StrapiResponse<Product[]>>("/products", {
      params: {
        ...withPopulate(["submittedBy", "logo"]),
        sort: "createdAt:desc",
        "pagination[pageSize]": "20",
        ...params,
      },
    }),
  get: (documentId: string) =>
    fetchStrapi<StrapiResponse<Product>>(`/products/${documentId}`, {
      params: withPopulate(["submittedBy", "logo", "screenshots", "makers", "reviews"]),
    }),
  create: (data: Partial<Product>, token: string) =>
    fetchStrapi<StrapiResponse<Product>>("/products", { method: "POST", body: { data }, token }),
};

// ─── Product Reviews ─────────────────────────────────────
export const productReviews = {
  list: (productDocumentId: string) =>
    fetchStrapi<StrapiResponse<ProductReview[]>>("/product-reviews", {
      params: {
        "filters[product][documentId][$eq]": productDocumentId,
        ...withPopulate(["user"]),
        sort: "createdAt:desc",
      },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<ProductReview>>("/product-reviews", { method: "POST", body: { data }, token }),
};

// ─── Jobs ────────────────────────────────────────────────
export const jobs = {
  list: (params?: Record<string, string>) =>
    fetchStrapi<StrapiResponse<Job[]>>("/jobs", {
      params: {
        ...withPopulate(["postedBy"]),
        sort: "createdAt:desc",
        "pagination[pageSize]": "20",
        ...params,
      },
    }),
  get: (documentId: string) =>
    fetchStrapi<StrapiResponse<Job>>(`/jobs/${documentId}`, {
      params: withPopulate(["postedBy", "applications"]),
    }),
  create: (data: Partial<Job>, token: string) =>
    fetchStrapi<StrapiResponse<Job>>("/jobs", { method: "POST", body: { data }, token }),
};

// ─── Job Applications ────────────────────────────────────
export const jobApplications = {
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<JobApplication>>("/job-applications", { method: "POST", body: { data }, token }),
};

// ─── Conversations & Messages ────────────────────────────
export const conversations = {
  list: (token: string) =>
    fetchStrapi<StrapiResponse<Conversation[]>>("/conversations", {
      token,
      params: {
        ...withPopulate(["participants"]),
        sort: "lastMessageAt:desc",
      },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Conversation>>("/conversations", { method: "POST", body: { data }, token }),
};

export const messages = {
  list: (conversationDocumentId: string, token: string) =>
    fetchStrapi<StrapiResponse<Message[]>>("/messages", {
      token,
      params: {
        "filters[conversation][documentId][$eq]": conversationDocumentId,
        ...withPopulate(["sender"]),
        sort: "createdAt:asc",
        "pagination[pageSize]": "100",
      },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Message>>("/messages", { method: "POST", body: { data }, token }),
};

// ─── Notifications ───────────────────────────────────────
export const notifications = {
  list: (token: string) =>
    fetchStrapi<StrapiResponse<Notification[]>>("/notifications", {
      token,
      params: {
        ...withPopulate(["actor"]),
        sort: "createdAt:desc",
        "pagination[pageSize]": "50",
      },
    }),
  markRead: (documentId: string, token: string) =>
    fetchStrapi(`/notifications/${documentId}`, {
      method: "PUT",
      body: { data: { isRead: true } },
      token,
    }),
};

// ─── Follows ─────────────────────────────────────────────
export const follows = {
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Follow>>("/follows", { method: "POST", body: { data }, token }),
  delete: (documentId: string, token: string) =>
    fetchStrapi(`/follows/${documentId}`, { method: "DELETE", token }),
  find: (params: Record<string, string>, token: string) =>
    fetchStrapi<StrapiResponse<Follow[]>>("/follows", { params, token }),
};

// ─── Proof of Work ───────────────────────────────────────
export const proofOfWorks = {
  list: (userDocumentId: string) =>
    fetchStrapi<StrapiResponse<ProofOfWork[]>>("/proof-of-works", {
      params: {
        "filters[user][documentId][$eq]": userDocumentId,
        sort: "createdAt:desc",
      },
    }),
};

// ─── Poll Votes ──────────────────────────────────────────
export const pollVotes = {
  vote: (postDocumentId: string, optionIndex: number, token: string) =>
    fetchStrapi<{ data: { pollOptions: { text: string; votes: number }[]; userVotedIndex: number } }>("/poll-vote", {
      method: "POST",
      body: { postDocumentId, optionIndex },
      token,
    }),
};

// ─── Reposts ─────────────────────────────────────────────
export const reposts = {
  list: (token: string, params?: Record<string, string>) =>
    fetchStrapi<StrapiResponse<Repost[]>>("/reposts", {
      token,
      params: { sort: "createdAt:desc", "pagination[pageSize]": "50", ...params },
    }),
  create: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<StrapiResponse<Repost>>("/reposts", { method: "POST", body: { data }, token }),
  find: (params: Record<string, string>, token: string) =>
    fetchStrapi<StrapiResponse<Repost[]>>("/reposts", { params, token }),
  delete: (documentId: string, token: string) =>
    fetchStrapi(`/reposts/${documentId}`, { method: "DELETE", token }),
};

// ─── User Profile ────────────────────────────────────────
export const userProfile = {
  getByHandle: (handle: string) =>
    fetchStrapi<{ data: Record<string, unknown> }>(`/user-profile/${handle}`),
  updateMe: (data: Record<string, unknown>, token: string) =>
    fetchStrapi<{ data: Record<string, unknown> }>("/user-profile/me", { method: "PUT", body: data, token }),
};

// ─── Media helper ────────────────────────────────────────
export function strapiMedia(media?: { url: string } | null): string {
  if (!media?.url) return "";
  if (media.url.startsWith("http")) return media.url;
  return `${STRAPI_URL}${media.url}`;
}
