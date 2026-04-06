# Deployment Guide

Step-by-step instructions to deploy Headstart to production.

## Prerequisites

You need accounts on:
1. **[Clerk](https://clerk.com)** — free plan works (handles auth)
2. **[Strapi Cloud](https://cloud.strapi.io)** — Pro plan recommended (backend + PostgreSQL + CDN)
3. **[Vercel](https://vercel.com)** — free plan works (frontend hosting)

---

## Option A: Strapi Cloud + Vercel (Recommended)

Simplest path to production. ~5 minutes total.

### Step 1: Deploy Backend to Strapi Cloud

1. Go to [cloud.strapi.io](https://cloud.strapi.io) and create a project
2. Connect your GitHub repo
3. Set the **base directory** to `/` (root)
4. Strapi Cloud auto-provisions PostgreSQL, media storage, and CDN
5. No extra env vars needed — Strapi Cloud generates all secrets automatically
6. Click Deploy. Wait ~3-5 minutes
7. Note your URL: `https://your-project.strapiapp.com`
8. Create your admin account at `https://your-project.strapiapp.com/admin`

### Step 2: Seed Sample Data (Optional)

```bash
curl -X POST https://your-project.strapiapp.com/api/seed/run
```

This creates 10 founder profiles, 20 posts, 8 products, 8 jobs, and conversations.

### Step 3: Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create an application
2. Choose "Email" as sign-in method
3. Go to **API Keys** and copy your Publishable Key and Secret Key
4. Go to **Customization > Theme** and select **Dark** (matches the UI)

### Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import the same GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework: Next.js (auto-detected)
4. Add these environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_STRAPI_URL` | `https://your-project.strapiapp.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (from Clerk dashboard) |
| `CLERK_SECRET_KEY` | `sk_live_...` (from Clerk dashboard) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

5. Deploy. Takes ~1 minute
6. Note your URL: `https://headstart-xyz.vercel.app`

### Step 5: Configure CORS

Update `config/middlewares.ts` in your repo with your Vercel domain:

```typescript
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',
        'https://headstart-xyz.vercel.app',
        'https://yourdomain.com',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

Commit and push — Strapi Cloud auto-redeploys.

### Step 6: Custom Domain (Optional)

- **Vercel:** Project Settings > Domains > Add `app.yourdomain.com`
- **Strapi Cloud:** Project Settings > Domains > Add `api.yourdomain.com`
- Update `NEXT_PUBLIC_STRAPI_URL` in Vercel to `https://api.yourdomain.com`

---

## Option B: AWS (Full Control)

For teams that want full infrastructure ownership.

### Architecture

```
Route 53 (DNS)
    |
    +-- app.headstart.com --> CloudFront --> Vercel (or S3 + Lambda@Edge)
    |
    +-- api.headstart.com --> ALB --> ECS Fargate (Strapi)
                                        |
                                   +----+----+
                                   |         |
                                  RDS       S3
                              (PostgreSQL) (Media)
```

### Step 1: Database

Create an RDS PostgreSQL instance:
- Engine: PostgreSQL 15
- Instance: db.t3.micro (dev) or db.t3.medium (prod)
- Storage: 20GB
- Note the endpoint URL

### Step 2: Media Storage

Create an S3 bucket for uploads. Install the Strapi S3 provider:

```bash
npm install @strapi/provider-upload-aws-s3
```

Add to `config/plugins.ts`:
```typescript
upload: {
  config: {
    provider: '@strapi/provider-upload-aws-s3',
    providerOptions: {
      s3Options: {
        region: process.env.AWS_REGION,
        params: { Bucket: process.env.AWS_BUCKET },
      },
    },
  },
},
```

### Step 3: Deploy Backend

**Using Docker (ECS Fargate):**

Create a `Dockerfile` at the project root:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 1337
CMD ["npm", "run", "start"]
```

Push to ECR, create ECS service with ALB.

**Using EC2 (simpler):**

```bash
ssh ec2-user@your-instance
git clone https://github.com/YOUR_USER/headstart.git
cd headstart
npm install && npm run build
# Set env vars for PostgreSQL, S3, etc.
npx pm2 start npm --name headstart-api -- run start
```

### Step 4: Deploy Frontend

Vercel is still easiest even with AWS backend. Just set `NEXT_PUBLIC_STRAPI_URL` to your ALB endpoint.

### Step 5: Environment Variables for AWS

```bash
# Strapi backend
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:pass@your-rds:5432/headstart
AWS_REGION=ap-south-1
AWS_BUCKET=headstart-uploads
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Option C: Railway (Budget)

Best for indie hackers. ~$15-20/month total.

```bash
# Install CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd headstart
railway init
railway add --plugin postgresql
railway variables set NODE_ENV=production
railway up

# Deploy frontend (separate service)
cd frontend
railway init
railway variables set NEXT_PUBLIC_STRAPI_URL=https://your-backend.railway.app
railway up
```

---

## Post-Deployment Checklist

- [ ] Backend `/api/circles` returns 200
- [ ] Frontend loads at your domain
- [ ] Clerk sign-in/sign-up works
- [ ] User syncs to Strapi after Clerk login (check Strapi admin > Users)
- [ ] Creating a post works (must select circle)
- [ ] Image upload works in post composer
- [ ] Seed data visible (if seeded)
- [ ] CORS configured (no errors in browser console)
- [ ] Custom domain + SSL working
- [ ] Socket.IO connection established (check "Live" badge in Inbox)

## Capacity Estimates

| Setup | Cost/month | Concurrent Users |
|---|---|---|
| Strapi Cloud Essential + Vercel Free | ~$20 | 500-1,000 |
| Strapi Cloud Pro + Vercel Pro | ~$110 | 2,000-5,000 |
| Railway (self-hosted) | ~$15-20 | 1,000-3,000 |
| AWS (ECS + RDS + S3 + CloudFront) | ~$50-100 | 10,000-50,000 |
| AWS (multi-AZ + Redis + CDN) | ~$200+ | 100,000+ |

## Troubleshooting

**"Failed to fetch" errors on frontend:**
- Check CORS config in Strapi — your frontend domain must be in the allowed origins
- Check `NEXT_PUBLIC_STRAPI_URL` — must include `https://` and no trailing slash

**Clerk sign-in works but posts fail:**
- The Clerk-to-Strapi sync happens on first page load. Check browser console for auth-sync errors
- Verify the auth-sync endpoint works: `POST /api/auth-sync` with email + fullName

**Images not uploading:**
- Check that `plugin::upload.content-api.upload` permission is set for Authenticated role
- On AWS: check S3 bucket policy and IAM permissions

**Socket.IO not connecting:**
- The `@strapi-community/plugin-io` requires WebSocket support
- Strapi Cloud supports this. On AWS, ensure your ALB allows WebSocket upgrade
- Check browser console for WebSocket connection errors
