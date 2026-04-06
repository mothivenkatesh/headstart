# Headstart Frontend

Next.js 16 frontend for Headstart — the professional network for early stage founders.

Built with React 19, Tailwind CSS v3, Clerk auth, and Socket.IO for real-time messaging. Design inspired by Bluesky's open-source application layout framework (ALF).

## Pages

```
src/app/
├── layout.tsx                          # Root: ClerkProvider, Inter font, dark mode
├── globals.css                         # Design tokens, dark theme, mobile CSS
├── sign-in/[[...sign-in]]/page.tsx     # Clerk sign-in
├── sign-up/[[...sign-up]]/page.tsx     # Clerk sign-up
├── (app)/                              # Authenticated shell
│   ├── layout.tsx                      # 3-column layout + StrapiProvider + SocketProvider
│   ├── page.tsx                        # Feed (For You / Trending / Following)
│   ├── post/[id]/page.tsx              # Post detail + threaded comments
│   ├── circle/[slug]/page.tsx          # Circle category page
│   ├── launchpad/
│   │   ├── page.tsx                    # Product listing with hot/new/top sort
│   │   └── [slug]/page.tsx             # Product detail + reviews
│   ├── jobs/page.tsx                   # Job board with filters
│   ├── inbox/page.tsx                  # Real-time messaging
│   ├── notifications/page.tsx          # Activity notifications
│   ├── bookmarks/page.tsx              # Saved posts
│   ├── profile/[handle]/page.tsx       # User profile + posts + about
│   ├── settings/page.tsx               # Account, notifications, privacy
│   └── onboarding/page.tsx             # Profile completion form
```

## Components

```
src/components/
├── layout/
│   ├── GlobalHeader.tsx      # Fixed header with global search
│   ├── Sidebar.tsx           # Left nav (Bluesky LeftNav pattern)
│   ├── RightPanel.tsx        # Trending posts + circles
│   └── BottomNav.tsx         # Mobile nav with hide-on-scroll
├── feed/
│   ├── PostCard.tsx          # Post with votes, comments, repost, bookmark (memoized)
│   ├── Composer.tsx          # Post creator with polls, image upload, circle picker, drafts
│   ├── FeedTabs.tsx          # For You / Trending / Following tabs
│   ├── RepostCard.tsx        # Repost with embedded original post
│   ├── RepostModal.tsx       # Quick repost or quote with thoughts
│   └── EmbeddedPost.tsx      # Quoted post card
├── launchpad/
│   ├── SubmitProductModal.tsx  # 3-step product submission
│   └── ReviewForm.tsx          # Star rating + review text
├── jobs/
│   ├── PostJobModal.tsx      # Job posting form
│   └── JobDetailModal.tsx    # Job detail + apply flow
├── messaging/                # (integrated into inbox/page.tsx)
├── profile/
│   └── EditProfileModal.tsx  # Edit profile with all fields
└── ui/
    ├── Avatar.tsx            # Sizes: xs/sm/md/lg/xl, gradient fallback
    ├── Badge.tsx             # Merchant/partner/verified badges
    ├── Button.tsx            # Primary/outline/ghost with active scale
    ├── Card.tsx              # Bordered card container
    ├── EmptyState.tsx        # Icon + title + description + action
    ├── FollowButton.tsx      # Follow/unfollow with optimistic UI
    ├── Lightbox.tsx          # Full-screen image viewer
    └── PullToRefresh.tsx     # Touch pull-to-refresh
```

## Library

```
src/lib/
├── strapi.ts               # Typed API client for all 21 Strapi content types
├── types.ts                 # TypeScript interfaces (Post, User, Product, Job, etc.)
├── useStrapi.tsx            # React context: Clerk→Strapi auth sync + JWT storage
├── useSocket.tsx            # React context: Socket.IO connection + online status
├── useScrollDirection.ts    # Hide-on-scroll hook (Bluesky MinimalShellTransform)
├── drafts.ts                # localStorage draft auto-save/restore
└── utils.ts                 # timeAgo, formatCount, cn (classname merge)
```

## Key Patterns

### Auth Flow (Clerk → Strapi)
1. User signs up/in via Clerk
2. `StrapiProvider` calls `POST /api/auth-sync` with Clerk email/name
3. Strapi creates user if new, returns JWT + user data
4. All subsequent API calls use Strapi JWT
5. No webhook needed — client-side sync on every page load

### Optimistic Updates (Read-After-Write)
Every write action updates local React state instantly before the API call returns:
- **New post** → prepends to feed array
- **Vote** → toggles icon + adjusts count
- **Bookmark** → toggles filled icon
- **Comment** → appends to list with temp ID, background refetch replaces with real data
- **Follow** → toggles button + updates follower count on profile
- **Profile edit** → applies form data to displayed profile immediately

### Strapi v5 Relation Handling
Strapi v5 REST API rejects relation fields in request body. All create operations use custom controllers that:
1. Extract `{ connect: [documentId] }` from request data
2. Look up the related record by documentId via `strapi.db.query`
3. Set the numeric ID on the create data
4. Create via `strapi.db.query` (bypasses REST sanitization)

### Design System (Bluesky-Matched)
All colors use CSS custom properties for dark mode:

```css
:root { --surface: #FFFFFF; --border: #E5E5E5; --text-primary: #171717; }
.dark { --surface: #151D28; --border: #2C3A4E; --text-primary: #F1F3F5; }
```

Tailwind references these via `bg-surface`, `border-border`, `text-text-primary`.

**Single border color** everywhere. **No shadows on content** — only dropdowns/modals. **3 font sizes** — 13px, 15px, 17px.

### Mobile Patterns (Bluesky Reference)
- `viewport-fit: cover` + `maximum-scale: 1.00001` — notch-safe, no zoom
- `env(safe-area-inset-bottom)` on bottom nav
- `touch-action: manipulation` on all interactive elements
- `@media (hover: none)` disables hover effects on touch devices
- Bottom nav + header hide on scroll down, show on scroll up
- Modals become bottom-sheets on mobile (`items-end` + `rounded-t-2xl`)
- Thread indent reduces from 52px to 32px on mobile

## Environment Variables

```bash
# Required
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Development

```bash
npm install
npm run dev          # Webpack mode (Tailwind v3 compatible)
npm run build        # Production build
npm run start        # Production server
```

**Note:** Uses `--webpack` flag because Tailwind CSS v3 + Turbopack has CSS generation issues in Next.js 16.

## Performance

- `React.memo` on PostCard (heaviest component in feed)
- `loading="lazy"` on all post images
- `requestAnimationFrame` for 60fps scroll detection
- 250ms debounced search
- Optimistic state updates (zero-latency UI)
- Auto-save drafts to localStorage every 2s
- Keyboard shortcut: press `R` to refresh feed
