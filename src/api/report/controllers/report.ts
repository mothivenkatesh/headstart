import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::report.report', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { data } = ctx.request.body;
    const entry = await strapi.db.query('api::report.report').create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details || null,
        reporter: user.id,
        status: 'pending',
        publishedAt: new Date(),
      },
    });
    return { data: entry };
  },
}));
