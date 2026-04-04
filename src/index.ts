import type { Core } from '@strapi/strapi';

const SEED_CIRCLES = [
  { name: 'Enterprise', slug: 'enterprise', description: 'Enterprise SaaS, B2B sales, contracts, and scaling to large customers', icon: 'Buildings' },
  { name: 'Bootstrap', slug: 'bootstrap', description: 'Bootstrapped founders, profitability-first, no-VC path, and lean operations', icon: 'Plant' },
  { name: 'DevTool', slug: 'devtool', description: 'Developer tools, APIs, SDKs, CLIs, and infrastructure for developers', icon: 'Code' },
  { name: 'D2C', slug: 'd2c', description: 'Direct-to-consumer brands, e-commerce, supply chain, and brand building', icon: 'ShoppingCart' },
  { name: 'Early Stage', slug: 'early-stage', description: 'Pre-seed to seed stage — ideation, validation, first customers, and MVPs', icon: 'Seedling' },
  { name: 'Growth Stage', slug: 'growth-stage', description: 'Series A and beyond — scaling teams, unit economics, and market expansion', icon: 'TrendUp' },
  { name: 'Fintech', slug: 'fintech', description: 'Payments, lending, neobanking, insurance, and financial infrastructure', icon: 'CurrencyDollar' },
  { name: 'EdTech', slug: 'edtech', description: 'Education technology, online learning, upskilling, and ed-infra', icon: 'GraduationCap' },
  { name: 'Lending Tech', slug: 'lending-tech', description: 'Credit scoring, BNPL, microfinance, underwriting, and lending platforms', icon: 'Bank' },
  { name: 'AI & ML', slug: 'ai-ml', description: 'AI products, LLMs, agents, computer vision, and applied machine learning', icon: 'Brain' },
  { name: 'HealthTech', slug: 'healthtech', description: 'Digital health, telemedicine, health infra, and wellness platforms', icon: 'Heartbeat' },
  { name: 'Hiring & Culture', slug: 'hiring', description: 'Recruiting, team building, culture, ESOPs, and early-stage hiring', icon: 'Users' },
  { name: 'GTM & Marketing', slug: 'gtm', description: 'Go-to-market, growth hacking, content, SEO, paid ads, and launch playbooks', icon: 'Megaphone' },
  { name: 'Fundraising', slug: 'fundraising', description: 'Raising capital, pitch decks, investor updates, term sheets, and cap tables', icon: 'Rocket' },
  { name: 'Product & Design', slug: 'product-design', description: 'Product management, UX research, design systems, and shipping fast', icon: 'PaintBrush' },
  { name: 'Founder Life', slug: 'founder-life', description: 'Mental health, burnout, co-founder dynamics, and the real founder journey', icon: 'Heart' },
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Seed circles if none exist
    const existingCircles = await strapi.documents('api::circle.circle').findMany({ limit: 1 });
    if (existingCircles.length === 0) {
      strapi.log.info('Seeding 14 predefined circles...');
      for (const circle of SEED_CIRCLES) {
        await strapi.documents('api::circle.circle').create({
          data: circle,
        });
      }
      strapi.log.info('Circles seeded successfully.');
    }

    // Set public permissions for read access
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });
    if (publicRole) {
      const publicActions = [
        'api::circle.circle.find',
        'api::circle.circle.findOne',
        'api::post.post.find',
        'api::post.post.findOne',
        'api::comment.comment.find',
        'api::comment.comment.findOne',
        'api::product.product.find',
        'api::product.product.findOne',
        'api::product-review.product-review.find',
        'api::product-review.product-review.findOne',
        'api::job.job.find',
        'api::job.job.findOne',
        'api::proof-of-work.proof-of-work.find',
        'api::proof-of-work.proof-of-work.findOne',
      ];
      for (const action of publicActions) {
        const existing = await strapi.query('plugin::users-permissions.permission').findOne({
          where: { action, role: publicRole.id },
        });
        if (!existing) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action, role: publicRole.id },
          });
        }
      }
      strapi.log.info('Public permissions configured.');
    }

    // Set authenticated permissions for write access
    const authRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });
    if (authRole) {
      const authActions = [
        // All public read actions
        'api::circle.circle.find',
        'api::circle.circle.findOne',
        'api::post.post.find',
        'api::post.post.findOne',
        'api::post.post.create',
        'api::post.post.update',
        'api::post.post.delete',
        'api::comment.comment.find',
        'api::comment.comment.findOne',
        'api::comment.comment.create',
        'api::vote.vote.find',
        'api::vote.vote.create',
        'api::saved-post.saved-post.find',
        'api::saved-post.saved-post.create',
        'api::saved-post.saved-post.delete',
        'api::follow.follow.find',
        'api::follow.follow.create',
        'api::follow.follow.delete',
        'api::product.product.find',
        'api::product.product.findOne',
        'api::product.product.create',
        'api::product-review.product-review.find',
        'api::product-review.product-review.findOne',
        'api::product-review.product-review.create',
        'api::job.job.find',
        'api::job.job.findOne',
        'api::job.job.create',
        'api::job-application.job-application.create',
        'api::conversation.conversation.find',
        'api::conversation.conversation.create',
        'api::message.message.find',
        'api::message.message.create',
        'api::notification.notification.find',
        'api::notification.notification.update',
        'api::report.report.create',
        'api::proof-of-work.proof-of-work.find',
        'api::proof-of-work.proof-of-work.findOne',
        'api::repost.repost.find',
        'api::repost.repost.create',
        'api::repost.repost.delete',
        'api::poll-vote.poll-vote.vote',
        'api::user-profile.user-profile.updateMe',
        'api::post.post.delete',
        'api::vote.vote.delete',
        'plugin::upload.content-api.upload',
        'api::user-profile.user-profile.search',
      ];
      for (const action of authActions) {
        const existing = await strapi.query('plugin::users-permissions.permission').findOne({
          where: { action, role: authRole.id },
        });
        if (!existing) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action, role: authRole.id },
          });
        }
      }
      strapi.log.info('Authenticated permissions configured.');
    }

    // Hourly hot score recalculation for launched products
    setInterval(async () => {
      try {
        const products = await strapi.db.query('api::product.product').findMany({
          where: { status: 'launched' },
        });
        for (const product of products) {
          const ageMs = Date.now() - new Date(product.createdAt).getTime();
          const ageHours = ageMs / (1000 * 60 * 60);
          const votes = Math.max((product.upvoteCount || 0) - 1, 0);
          const hotScore = Math.pow(votes, 0.8) / Math.pow(ageHours + 2, 1.8);
          await strapi.db.query('api::product.product').update({
            where: { id: product.id },
            data: { hotScore },
          });
        }
        strapi.log.info(`Recalculated hotScore for ${products.length} products`);
      } catch (err) {
        strapi.log.error('HotScore recalculation error:', err);
      }
    }, 60 * 60 * 1000); // Every hour
  },
};
