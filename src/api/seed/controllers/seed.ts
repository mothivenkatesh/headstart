import type { Core } from '@strapi/strapi';

function daysAgo(n: number) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString(); }
function randomInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const PROFILES = [
  { email: 'arjun.mehta@example.com', fullName: 'Arjun Mehta', handle: 'arjunmehta', bio: 'Building developer tools for startups. Ex-Razorpay. Obsessed with DX and API design.', jobTitle: 'Founder & CEO', company: 'DevKit', location: 'Bangalore, India', skills: ['APIs','Developer Tools','Go','TypeScript'], verticals: ['DevTool','Early Stage'] },
  { email: 'priya.sharma@example.com', fullName: 'Priya Sharma', handle: 'priyasharma', bio: 'Product leader turned founder. Building an AI-powered hiring platform for early-stage startups.', jobTitle: 'Co-founder', company: 'HireLoop', location: 'Mumbai, India', skills: ['Product Management','Hiring','Growth','SQL'], verticals: ['AI & ML','Hiring & Culture'] },
  { email: 'vikram.iyer@example.com', fullName: 'Vikram Iyer', handle: 'vikramiyer', bio: 'Serial entrepreneur. 2x exits. Currently building a D2C brand in sustainable fashion. Bootstrapped and profitable.', jobTitle: 'Founder', company: 'GreenThread', location: 'Pune, India', skills: ['D2C','E-commerce','Brand Building','Operations'], verticals: ['D2C','Bootstrap'] },
  { email: 'neha.gupta@example.com', fullName: 'Neha Gupta', handle: 'nehagupta', bio: 'GTM strategist helping SaaS startups go from 0 to 1. Previously scaled marketing at Freshworks.', jobTitle: 'Head of Growth', company: 'LaunchCraft', location: 'Delhi, India', skills: ['GTM','Content Marketing','SEO','PLG'], verticals: ['GTM & Marketing'] },
  { email: 'rahul.krishnan@example.com', fullName: 'Rahul Krishnan', handle: 'rahulk', bio: 'Full-stack engineer building open-source tools for the Indian startup ecosystem.', jobTitle: 'CTO', company: 'OpenStack Labs', location: 'Chennai, India', skills: ['React','Node.js','PostgreSQL','Open Source'], verticals: ['DevTool','Early Stage'] },
  { email: 'deepa.nair@example.com', fullName: 'Deepa Nair', handle: 'deepanair', bio: 'Design leader. Helping early-stage founders build products users love.', jobTitle: 'Head of Design', company: 'PixelCraft', location: 'Hyderabad, India', skills: ['UX Design','Figma','User Research','Design Systems'], verticals: ['Product & Design'] },
  { email: 'karthik.rajan@example.com', fullName: 'Karthik Rajan', handle: 'karthikr', bio: 'Enterprise SaaS founder. Building compliance automation for regulated industries. Series A.', jobTitle: 'CEO', company: 'ComplianceAI', location: 'Bangalore, India', skills: ['Enterprise Sales','SaaS','Compliance','AI'], verticals: ['Enterprise','Growth Stage'] },
  { email: 'ananya.patel@example.com', fullName: 'Ananya Patel', handle: 'ananyap', bio: 'EdTech founder building the future of skill-based learning for Tier 2/3 India.', jobTitle: 'Founder', company: 'SkillBridge', location: 'Ahmedabad, India', skills: ['EdTech','Mobile','Growth','Community'], verticals: ['EdTech','Early Stage'] },
  { email: 'siddharth.joshi@example.com', fullName: 'Siddharth Joshi', handle: 'sidjoshi', bio: 'AI/ML engineer turned founder. Building LLM-powered customer support for startups.', jobTitle: 'Founder & CTO', company: 'SupportAI', location: 'Bangalore, India', skills: ['AI','LLMs','Python','Machine Learning'], verticals: ['AI & ML','DevTool'] },
  { email: 'meera.reddy@example.com', fullName: 'Meera Reddy', handle: 'meerareddy', bio: 'VC at SeedFund. Investing in pre-seed and seed stage startups across India. Always looking for bold founders.', jobTitle: 'Principal', company: 'SeedFund Ventures', location: 'Mumbai, India', skills: ['Venture Capital','Due Diligence','Fundraising','Strategy'], verticals: ['Fundraising','Early Stage'] },
];

const POST_DATA = [
  { title: 'How we got our first 100 paying customers without spending a dollar on ads', body: 'When we launched DevKit 8 months ago, we had zero budget for marketing. Here is what worked.\n\nPhase 1: Technical tutorials on Dev.to and Hashnode. 12K visits.\nPhase 2: Product Hunt launch. #3 PotD, 800 signups, 12 converted.\nPhase 3: Cold outreach on Twitter. Helping developers, not pitching. 40 customers.\nPhase 4: Referral program. Give friend 3 months free, get 1 month free. 48 customers.\n\n100 customers x $29/month = $2,900 MRR. Enough to build full-time.', circle: 'early-stage', link: 'https://picsum.photos/seed/customers/800/400' },
  { title: 'We raised a $2M seed round. Here is our entire pitch deck annotated', body: 'After 47 investor meetings and 44 rejections, we closed a $2M seed round for HireLoop.\n\nThe deck that worked: Problem (1 slide), Solution (1 slide), Traction (2 slides), Market (1 slide), Business model (1 slide), Team (1 slide), Ask (1 slide).\n\nInvestors spent 80% of the meeting on traction and team. The TAM slide got zero questions.\n\nBiggest mistake: Leading with a product demo instead of the problem story. When we switched to leading with a real founder story, engagement went up dramatically.', circle: 'fundraising', link: 'https://picsum.photos/seed/pitchdeck/800/400' },
  { title: 'Bootstrapped to $50K MRR: Why I turned down VC money', body: 'GreenThread hit $50K MRR last month. 100% bootstrapped.\n\nThe numbers: $50K MRR, 12 people, $35K burn, $15K profit/month. Profitable in 14 months.\n\nWhy no VC: Taking money meant optimizing for growth over profitability, hiring faster than we could absorb, and losing the ability to say no to bad deals.\n\nThe honest downside: Growth is slower. Competitors outspend us. Some enterprise deals need proof of funding.', circle: 'bootstrap', link: 'https://picsum.photos/seed/bootstrap/800/400' },
  { title: 'The GTM playbook that took us from $0 to $10K MRR in 90 days', body: 'LaunchCraft GTM motion:\n\nWeek 1-2: 30 customer discovery calls. Found founders spend 15hr/week on marketing tasks they hate.\nWeek 3-4: MVP landing page + waitlist. 500 signups from LinkedIn.\nWeek 5-8: Beta with 50 users. Found aha moment: AI content calendar.\nWeek 9-12: Public launch. $49/mo startups, $149/mo scale-ups. Hit $10K MRR.\n\nChannels that worked: LinkedIn organic (40%), Product Hunt (25%), cold email to YC startups (20%), referrals (15%).', circle: 'gtm', link: 'https://picsum.photos/seed/gtm/800/400' },
  { title: 'Open-sourcing our codebase: lessons from going public with our code', body: 'We open-sourced OpenStack Labs core. 2,400 stars in the first week.\n\nWhy: Developers trust open source. Removed biggest sales objection. Enterprise customers can audit code.\n\nBusiness model: Open-source core + paid cloud + enterprise features. Like GitLab and Supabase.\n\nSurprise: Contributors fixed bugs we did not know about. Docs improved from strangers asking questions. 3 engineers applied saying they loved the codebase.\n\nThe moat is not in the code. It is in community, cloud infra, and shipping velocity.', circle: 'devtool', link: 'https://picsum.photos/seed/opensource/800/400' },
  { title: 'Design system from zero: 48 components in 3 weeks', body: 'PixelCraft shipped our design system. 48 components, dark mode, accessible, built in 3 weeks.\n\nStack: Figma tokens, Tailwind CSS, Radix UI, Storybook.\n\nWeek 1: Audit. Found 14 button styles, 8 input styles, 3 modal patterns.\nWeek 2: Foundation. Color tokens, typography, spacing, radius, shadows.\nWeek 3: Components by usage frequency. Button, Input, Modal, Card, Avatar, Badge.\n\nResult: New features ship 2x faster. Designers and engineers speak the same language.', circle: 'product-design', link: 'https://picsum.photos/seed/designsystem/800/400' },
  { title: 'Enterprise sales as a first-time founder: everything I wish I knew', body: 'ComplianceAI sells to enterprises. Avg deal: $80K/year. Cycle: 3-6 months.\n\n5 lessons:\n1. Enterprises buy risk reduction, not products.\n2. The person who loves your demo never signs the check. Find the economic buyer.\n3. Security questionnaires take 10x longer than expected. Get SOC 2 early.\n4. Never discount. You train them to always ask.\n5. First 3 enterprise customers need custom features. Build generalizable ones.\n\n$0 to $500K ARR in 18 months from 6 customers.', circle: 'enterprise', link: 'https://picsum.photos/seed/enterprise/800/400' },
  { title: 'Building for Tier 2/3 India: the EdTech opportunity', body: 'SkillBridge: 50K active learners. 80% from cities you have never heard of.\n\n400M people aged 18-35 in India. 300M are NOT in metros. They have smartphones, cheap data, and burning desire to upskill.\n\nWhat they want: Practical skills leading to jobs. Video editing, digital marketing, Tally accounting, spoken English.\n\nPricing: Rs 299/month. 4% free-to-paid conversion. Unit economics work at scale.\n\nDistribution hack: WhatsApp groups run by local influencers with referral commissions. CAC: Rs 15.', circle: 'edtech', link: 'https://picsum.photos/seed/edtech/800/400' },
  { title: 'We replaced customer support with an AI agent. Here is what happened.', body: 'SupportAI results after 6 months:\n- 78% tickets resolved without humans\n- Response time: 8 seconds (was 4 hours)\n- CSAT: 4.2/5 (was 3.8 with humans)\n- Support cost: reduced 65%\n\nHow: Fine-tuned LLaMA 3 on docs + ticket history. RAG for real-time knowledge. Escalation when confidence below 80%.\n\nWhat AI cannot do: Empathy in emotional situations, complex refunds, edge cases needing engineering.\n\nPricing: $0.03 per resolved ticket. 1000 tickets/month = $30 vs $3000 for a human hire.', circle: 'ai-ml', link: 'https://picsum.photos/seed/aiagent/800/400' },
  { title: 'What I look for in a seed-stage pitch as a VC', body: 'After 2,000+ decks and 15 checks this year at SeedFund:\n\nGreen flags: Founder-market fit, clear why-now, evidence of velocity, intellectual honesty about failures.\n\nRed flags: TAM copied from Google, no customer conversations, co-founder met 2 weeks ago, $50M year-3 projections with no explanation.\n\nSingle biggest predictor: Rate of learning. Founders who iterate fastest win.\n\nHot take: At seed, I bet on the founder, not the idea. Ideas change. Founders do not.', circle: 'fundraising', link: 'https://picsum.photos/seed/vcpitch/800/400' },
  { title: 'Hiring your first 10 employees: mistakes that almost killed us', body: 'HireLoop has 25 employees now. First 10 nearly destroyed us.\n\nMistake 1: Hired VP Sales from Series C company. He built processes for 50-person team. We had 3 customers. Quit in 4 months.\n\nMistake 2: No trial project. Two engineers interviewed brilliantly, could not ship independently.\n\nMistake 3: Waited 6 months to fire a bad hire. 4 months of lost productivity + morale damage.\n\nWhat works now: Hire for learning speed. Paid trial for every candidate. 90-day evaluation with clear criteria.', circle: 'hiring', link: 'https://picsum.photos/seed/hiring/800/400' },
  { title: 'The founder mental health crisis nobody talks about', body: 'I burned out 8 months into GreenThread. Stopped sleeping. Snapped at my co-founder.\n\nTrigger: Lost our biggest customer (30% revenue) same week lead engineer quit.\n\nWhat helped: 1) Therapy with a licensed professional. 2) Non-negotiable 30min exercise daily. 3) No Slack after 8pm, no work Sundays. 4) Monthly founder peer group.\n\nStartup culture glorifies suffering. The 4-hour sleep founder is celebrated. The vacationing founder is seen as uncommitted. This is broken.\n\nIf you are struggling: you are not alone.', circle: 'founder-life', link: 'https://picsum.photos/seed/mentalhealth/800/400' },
  { title: 'Our lending tech stack: 10K applications per day', body: 'Processing 10,000 loan applications daily. 47-second average decision time.\n\nStack: Next.js frontend, Go microservices, gRPC. Kafka streaming, Redis feature store, PostgreSQL. LightGBM for credit scoring (89% AUC), ensemble fraud detection.\n\nInfra: AWS EKS, Terraform, DataDog, PagerDuty.\n\nKey insight: Every second added to decision time loses 3% of applicants. We obsess over latency.', circle: 'lending-tech', link: 'https://picsum.photos/seed/lendingtech/800/400' },
  { title: 'SaaS pricing: the framework that doubled our ARPU', body: 'ComplianceAI doubled ARPU from $400 to $800/month.\n\nOld: Feature-based tiers. Customers always chose cheapest tier with their one needed feature.\n\nNew: Usage-based + platform fee. $200/month platform + $0.10 per compliance check. Average: 6,000 checks/month = $800.\n\nWhy it works: Customers pay proportional to value received. High-usage pays more. Low-usage has low entry point.\n\nPricing page A/B test winner had: calculator, social proof logos, money-back guarantee.', circle: 'growth-stage', link: 'https://picsum.photos/seed/saas/800/400' },
  { title: 'HealthTech regulatory compliance: a practical guide', body: 'Building in healthcare means regulations that can kill your startup.\n\nTier 1 (Day 1): Data encryption, patient consent, audit logs.\nTier 2 (Before scale): HIPAA, DPDP Act, ISO 27001.\nTier 3 (Before enterprise): SOC 2 Type II, NABH standards.\n\nShortcut: Use compliance-as-a-service (Vanta, Drata). SOC 2 ready in weeks not months.\n\nCounterintuitive: Regulation is a moat. Once compliant, new entrants struggle to catch up.', circle: 'healthtech', link: 'https://picsum.photos/seed/healthtech/800/400' },
  { title: 'YC just published their most-requested startup advice', body: 'Y Combinator dropped their updated startup playbook. Key takeaways for early-stage founders: launch fast, talk to users, iterate weekly. The section on pricing strategy alone is worth reading twice.', circle: 'early-stage', link: 'https://picsum.photos/seed/ycadvice/800/400', postType: 'resource' },
  { title: 'This open-source alternative to Vercel just crossed 10K stars', body: 'Coolify is an open-source, self-hostable alternative to Vercel/Netlify/Heroku. Just crossed 10K GitHub stars. If you are bootstrapping and want to cut your hosting costs by 80%, this is worth checking out.', circle: 'devtool', link: 'https://picsum.photos/seed/coolify/800/400', postType: 'resource' },
  { title: 'The best fundraising memo template I have ever seen', body: 'Notion just released a fundraising memo template used by 50+ YC companies. Covers problem, solution, traction, market, team, financials, and ask. Clean, no-BS format that investors actually read.', circle: 'fundraising', link: 'https://picsum.photos/seed/fundraisingmemo/800/400', postType: 'resource' },
  { title: 'Thread: 15 lessons from scaling a D2C brand to 10 Cr revenue', body: 'Compiled from 6 months of founder interviews. The biggest insight: your first 1000 customers should come from communities, not ads. Performance marketing only works after product-market fit.', circle: 'd2c', link: 'https://picsum.photos/seed/d2cthread/800/400' },
    { title: 'From idea to MVP in 2 weeks: our rapid prototyping process', body: 'At DevKit we validate ideas in 14 days. No traction = kill it.\n\nDay 1-2: 10 problem interviews. Record everything.\nDay 3-5: Figma wireframes, share with interviewees.\nDay 6-10: Build MVP. One dev, one designer. No auth, no billing.\nDay 11-14: Distribution test. Communities, interviewees, $100 ad budget.\n\nSuccess: 50 signups AND 5 willing to pay before seeing the product.\n\nRun this 7 times. 2 became products. 5 killed. Right ratio.', circle: 'early-stage', link: 'https://picsum.photos/seed/mvp/800/400' },
];

const COMMENTS = [
  "Great insights! We've seen similar trends at our end.",
  "This is exactly what we needed. Thanks for sharing!",
  "Interesting approach. How does this handle edge cases?",
  "We implemented something similar. Happy to share learnings.",
  "The regulatory landscape on this is still evolving.",
  "Have you benchmarked this against the traditional approach?",
  "Solid analysis. The data is eye-opening.",
  "We're exploring similar architecture. Would love to connect.",
  "This deserves more visibility. Sharing with my network.",
  "What's your tech stack for this?",
  "Impressive results! What was the training data size?",
  "This is the kind of content that makes this community valuable.",
  "Can you elaborate on the security considerations?",
  "Love the transparency. More founders should share real numbers.",
  "Bookmarking this for our next planning session.",
];

const PRODUCTS = [
  { name: 'DevKit', tagline: 'API development toolkit for startups', description: 'Build, test, and ship APIs 10x faster. Auto-generated docs, mock servers, SDKs.', pricing: 'freemium', categories: ['Developer Tools'], website: 'https://devkit.dev' },
  { name: 'HireLoop', tagline: 'AI-powered hiring for early-stage startups', description: 'Find your first 10 hires from a curated talent pool. AI-matched, culture-fit scored.', pricing: 'paid', categories: ['AI & ML'], website: 'https://hireloop.in' },
  { name: 'LaunchCraft', tagline: 'GTM autopilot for SaaS founders', description: 'AI content calendars, landing pages, email sequences. Ship marketing in hours.', pricing: 'freemium', categories: ['SaaS'], website: 'https://launchcraft.io' },
  { name: 'ComplianceAI', tagline: 'Compliance automation for regulated industries', description: 'SOC 2, HIPAA, DPDP automated. 200+ rules, real-time monitoring, audit-ready.', pricing: 'paid', categories: ['Enterprise','Security'], website: 'https://complianceai.dev' },
  { name: 'SupportAI', tagline: 'AI customer support agent for startups', description: 'Resolve 78% of tickets automatically. $0.03/ticket. 8-second response.', pricing: 'freemium', categories: ['AI & ML'], website: 'https://supportai.dev' },
  { name: 'SkillBridge', tagline: 'Skill-based learning for Tier 2/3 India', description: 'Practical skills at Rs 299/month. 50K learners. Video editing, marketing, accounting.', pricing: 'paid', categories: ['Edtech'], website: 'https://skillbridge.in' },
  { name: 'OpenStack Labs', tagline: 'Open-source developer infrastructure', description: 'Self-hostable platform. Auth, databases, storage, functions. All open source.', pricing: 'open_source', categories: ['Developer Tools'], website: 'https://openstacklabs.dev' },
  { name: 'GreenThread', tagline: 'Sustainable fashion D2C brand', description: 'Eco-friendly clothing from recycled materials. D2C. Profitable from month 14.', pricing: 'paid', categories: ['E-commerce'], website: 'https://greenthread.in' },
];

const JOBS = [
  { title: 'Founding Engineer', company: 'DevKit', jobType: 'full_time', location: 'Bangalore', isRemote: true, salaryRange: '25-40 LPA', vertical: 'DevTool', skills: ['Go','TypeScript','PostgreSQL','APIs'], description: 'First engineering hire. Build the core API platform.' },
  { title: 'Head of Growth', company: 'HireLoop', jobType: 'full_time', location: 'Mumbai', isRemote: false, salaryRange: '20-30 LPA', vertical: 'Growth', skills: ['Growth Marketing','SEO','Analytics','PLG'], description: 'Own the growth engine from content to conversion.' },
  { title: 'AI/ML Engineer', company: 'SupportAI', jobType: 'full_time', location: 'Bangalore', isRemote: true, salaryRange: '30-45 LPA', vertical: 'AI & ML', skills: ['Python','LLMs','RAG','Fine-tuning'], description: 'Build LLM agents for customer support automation.' },
  { title: 'Product Designer', company: 'LaunchCraft', jobType: 'full_time', location: 'Remote', isRemote: true, salaryRange: '15-25 LPA', vertical: 'Design', skills: ['Figma','User Research','Design Systems'], description: 'Design GTM automation for SaaS founders.' },
  { title: 'Frontend Developer', company: 'SkillBridge', jobType: 'full_time', location: 'Ahmedabad', isRemote: true, salaryRange: '12-20 LPA', vertical: 'EdTech', skills: ['React','Next.js','Tailwind','Mobile-first'], description: 'Build learning experiences for 50K+ learners.' },
  { title: 'Enterprise Sales Lead', company: 'ComplianceAI', jobType: 'full_time', location: 'Bangalore', isRemote: false, salaryRange: '30-50 LPA', vertical: 'Enterprise', skills: ['Enterprise Sales','SaaS','Solution Selling'], description: 'Close $80K+ ACV deals with enterprises.' },
  { title: 'Content Marketer', company: 'GreenThread', jobType: 'full_time', location: 'Pune', isRemote: false, salaryRange: '8-14 LPA', vertical: 'D2C', skills: ['Content Writing','Social Media','Storytelling'], description: 'Build brand voice for sustainable fashion D2C.' },
  { title: 'DevRel Intern', company: 'OpenStack Labs', jobType: 'internship', location: 'Remote', isRemote: true, salaryRange: '30-50K/month', vertical: 'Open Source', skills: ['Technical Writing','GitHub','Community'], description: 'Build developer community around open-source platform.' },
];

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async run(ctx) {
    const db = strapi.db;
    const log = strapi.log;

    log.info('🌱 Starting seed...');

    // Get circles
    const circles = await db.query('api::circle.circle').findMany({});
    const circleMap: Record<string, number> = {};
    for (const c of circles) circleMap[c.slug] = c.id;
    log.info(`Found ${circles.length} circles`);

    // Get auth role
    const authRole = await db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });

    // Create users
    log.info('Creating users...');
    const users: any[] = [];
    for (const p of PROFILES) {
      let user = await db.query('plugin::users-permissions.user').findOne({ where: { email: p.email } });
      if (!user) {
        user = await db.query('plugin::users-permissions.user').create({
          data: {
            email: p.email, username: p.handle, handle: p.handle, fullName: p.fullName,
            provider: 'local', confirmed: true, blocked: false, role: authRole?.id,
            password: 'Demo1234!',
            bio: p.bio, jobTitle: p.jobTitle, company: p.company, location: p.location,
            profileType: 'individual', skills: p.skills, verticals: p.verticals,
            reputation: randomInt(50, 500), followerCount: randomInt(10, 200), followingCount: randomInt(5, 100),
            isVerified: Math.random() > 0.5, isAdmin: false,
          },
        });
      }
      users.push(user);
      log.info(`  ✓ ${p.fullName} (@${p.handle})`);
    }

    // Create follows
    log.info('Creating follows...');
    let followCount = 0;
    for (let i = 0; i < users.length; i++) {
      const targets = users.filter((_, j) => j !== i).sort(() => Math.random() - 0.5).slice(0, randomInt(3, 5));
      for (const t of targets) {
        const exists = await db.query('api::follow.follow').findOne({ where: { follower: users[i].id, following: t.id } });
        if (!exists) {
          await db.query('api::follow.follow').create({ data: { follower: users[i].id, following: t.id, publishedAt: new Date() } });
          followCount++;
        }
      }
    }
    log.info(`  Created ${followCount} follows`);

    // Create posts
    log.info('Creating posts...');
    const createdPosts: any[] = [];
    for (let i = 0; i < POST_DATA.length; i++) {
      const p = POST_DATA[i];
      const author = users[i % users.length];
      const circleId = circleMap[p.circle];
      if (!circleId) continue;
      const post = await db.query('api::post.post').create({
        data: {
          title: p.title, body: p.body,
          postType: (p as any).postType || 'discussion',
          author: author.id, circle: circleId,
          link: (p as any).link || null,
          tags: null,
          upvoteCount: randomInt(5, 80), downvoteCount: randomInt(0, 5),
          commentCount: 0, shareCount: 0,
          isPinned: false, isAnonymous: false,
          createdAt: daysAgo(randomInt(1, 90)), publishedAt: new Date(),
        },
      });
      createdPosts.push(post);
      log.info(`  ✓ "${p.title.slice(0, 50)}..."`);
    }

    // Create comments
    log.info('Creating comments...');
    let totalComments = 0;
    for (const post of createdPosts) {
      const numComments = randomInt(2, 5);
      for (let i = 0; i < numComments; i++) {
        const commenter = pick(users);
        await db.query('api::comment.comment').create({
          data: {
            body: pick(COMMENTS), post: post.id, author: commenter.id,
            upvoteCount: randomInt(0, 15), downvoteCount: 0, isHelpful: Math.random() > 0.8,
            createdAt: daysAgo(randomInt(0, 60)), publishedAt: new Date(),
          },
        });
        totalComments++;
      }
      // Update comment count for THIS post only
      await db.query('api::post.post').update({ where: { id: post.id }, data: { commentCount: numComments } });
    }
    log.info(`  Created ${totalComments} comments`);

    // Create votes
    log.info('Creating votes...');
    let voteCount = 0;
    for (const post of createdPosts) {
      const voters = users.sort(() => Math.random() - 0.5).slice(0, randomInt(3, 8));
      for (const v of voters) {
        const exists = await db.query('api::vote.vote').findOne({ where: { user: v.id, post: post.id } });
        if (!exists) {
          await db.query('api::vote.vote').create({
            data: { value: 1, user: v.id, post: post.id, publishedAt: new Date() },
          });
          voteCount++;
        }
      }
    }
    log.info(`  Created ${voteCount} votes`);

    // Create products
    log.info('Creating products...');
    const createdProducts: any[] = [];
    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      const maker = users[i % users.length];
      const launchDay = randomInt(5, 60);
      const upvotes = randomInt(15, 120);
      const ageHours = launchDay * 24;
      const hotScore = Math.pow(Math.max(upvotes - 1, 0), 0.8) / Math.pow(ageHours + 2, 1.8);
      const product = await db.query('api::product.product').create({
        data: {
          name: p.name, slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''), tagline: p.tagline,
          description: p.description, pricing: p.pricing, categories: p.categories,
          website: p.website, status: 'launched', submittedBy: maker.id,
          submittedAt: daysAgo(launchDay + 5), launchDate: daysAgo(launchDay).split('T')[0],
          upvoteCount: upvotes, commentCount: randomInt(3, 20), reviewCount: 0, rating: 0,
          hotScore, viewCount: randomInt(100, 2000), publishedAt: new Date(),
        },
      });
      createdProducts.push(product);
      log.info(`  ✓ ${p.name}`);
    }

    // Create reviews
    log.info('Creating reviews...');
    let reviewCount = 0;
    const reviewTexts = ["Clean API, easy integration", "Excellent documentation", "Solved a real pain point", "Great UX", "Reliable in production"];
    const improveTexts = ["More pricing tiers", "Dashboard customization", "Webhook support", "Mobile app", "More SDKs"];
    for (const product of createdProducts) {
      const reviewers = users.sort(() => Math.random() - 0.5).slice(0, randomInt(2, 4));
      let totalRating = 0;
      for (const r of reviewers) {
        const rating = randomInt(3, 5);
        totalRating += rating;
        await db.query('api::product-review.product-review').create({
          data: { product: product.id, user: r.id, rating, whatsGreat: pick(reviewTexts), whatsBetter: pick(improveTexts), publishedAt: new Date() },
        });
        reviewCount++;
      }
      const avgRating = Math.round((totalRating / reviewers.length) * 10) / 10;
      await db.query('api::product.product').update({ where: { id: product.id }, data: { reviewCount: reviewers.length, rating: avgRating } });
    }
    log.info(`  Created ${reviewCount} reviews`);

    // Create jobs
    log.info('Creating jobs...');
    for (let i = 0; i < JOBS.length; i++) {
      const j = JOBS[i];
      const poster = users[i % users.length];
      await db.query('api::job.job').create({
        data: { ...j, postedBy: poster.id, createdAt: daysAgo(randomInt(1, 45)), publishedAt: new Date() },
      });
      log.info(`  ✓ ${j.title} at ${j.company}`);
    }

    // Create conversations + messages
    log.info('Creating conversations...');
    const convoPairs = [[0,1],[0,6],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]];
    const chatMsgs = [
      ["Hey! Saw your post about UPI 3.0. Really insightful.", "Thanks! We've been deep in the new guidelines."],
      ["Are you hiring for the backend role?", "Yes! Send me your resume."],
      ["Congrats on the launch! How's traction?", "200 signups first week, mostly organic."],
      ["Would love to collaborate on the compliance toolkit.", "Let's set up a call this week."],
      ["Quick question about your fraud detection approach.", "Sure, what specifically?"],
      ["Your talk at FinTech Summit was great!", "Thank you! Slides are on my profile."],
      ["Interested in the neobank API. Demo?", "I'll send a Calendly link."],
      ["Loved the open-source KYC toolkit.", "Thanks! Check CONTRIBUTING.md."],
      ["Any advice for someone entering InsurTech?", "Start with claims — biggest pain points."],
      ["Cross-border payments space is heating up!", "UPI-PayNow is a game-changer for APAC."],
    ];
    for (let i = 0; i < convoPairs.length; i++) {
      const [a, b] = convoPairs[i];
      const convo = await db.query('api::conversation.conversation').create({
        data: { lastMessageAt: daysAgo(randomInt(1, 20)), publishedAt: new Date() },
      });
      // Link participants via junction table
      await db.connection.raw(`INSERT INTO conversations_participants_lnk (conversation_id, user_id) VALUES (?, ?), (?, ?)`, [convo.id, users[a].id, convo.id, users[b].id]).catch(() => {
        // Try alternative table name
        return db.connection.raw(`INSERT INTO conversations_participants_links (conversation_id, user_id) VALUES (?, ?), (?, ?)`, [convo.id, users[a].id, convo.id, users[b].id]);
      }).catch((e) => log.warn(`  Conversation link failed: ${e.message}`));

      const msgs = chatMsgs[i];
      for (let m = 0; m < msgs.length; m++) {
        await db.query('api::message.message').create({
          data: { body: msgs[m], conversation: convo.id, sender: m % 2 === 0 ? users[a].id : users[b].id, publishedAt: new Date() },
        });
      }
      log.info(`  ✓ ${users[a].fullName} ↔ ${users[b].fullName}`);
    }

    // Create saved posts
    log.info('Creating bookmarks...');
    for (const user of users) {
      const postsToSave = createdPosts.sort(() => Math.random() - 0.5).slice(0, randomInt(2, 4));
      for (const post of postsToSave) {
        await db.query('api::saved-post.saved-post').create({
          data: { user: user.id, post: post.id, publishedAt: new Date() },
        }).catch(() => {});
      }
    }

    const summary = {
      users: users.length,
      posts: createdPosts.length,
      comments: totalComments,
      votes: voteCount,
      products: createdProducts.length,
      reviews: reviewCount,
      jobs: JOBS.length,
      conversations: convoPairs.length,
      follows: followCount,
    };
    log.info('✅ Seed complete!');
    log.info(JSON.stringify(summary, null, 2));

    ctx.send({ success: true, summary });
  },
});
