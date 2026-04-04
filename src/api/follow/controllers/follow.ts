import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::follow.follow', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const query: any = ctx.query || {};
    const filters = query.filters || {};
    const where: any = {};
    if (filters.follower?.id?.$eq) where.follower = Number(filters.follower.id.$eq);
    if (filters.following?.id?.$eq) where.following = Number(filters.following.id.$eq);
    if (filters.follower?.documentId?.$eq) {
      const u = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { documentId: filters.follower.documentId.$eq } });
      if (u) where.follower = u.id; else where.follower = -1;
    }
    if (filters.following?.documentId?.$eq) {
      const u = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { documentId: filters.following.documentId.$eq } });
      if (u) where.following = u.id; else where.following = -1;
    }
    const entries = await strapi.db.query('api::follow.follow').findMany({ where, limit: 50 });
    return { data: entries, meta: { pagination: { total: entries.length } } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { data } = ctx.request.body;
    const createData: any = { ...data, publishedAt: new Date() };
    delete createData.follower; delete createData.following;
    createData.follower = user.id;
    if (data.following?.connect?.[0]) {
      const u = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { documentId: data.following.connect[0] } });
      if (u) createData.following = u.id;
    }
    const entry = await strapi.db.query('api::follow.follow').create({ data: createData });
    return { data: entry };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const entry = await strapi.db.query('api::follow.follow').findOne({ where: { documentId: id } });
    if (entry) await strapi.db.query('api::follow.follow').delete({ where: { id: entry.id } });
    return { data: { documentId: id } };
  },
}));
