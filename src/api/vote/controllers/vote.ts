import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vote.vote', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const query: any = ctx.query || {};
    const filters = query.filters || {};
    const where: any = {};
    if (filters.user?.id?.$eq) where.user = Number(filters.user.id.$eq);
    if (filters.post?.documentId?.$eq) {
      const p = await strapi.db.query('api::post.post').findOne({ where: { documentId: filters.post.documentId.$eq } });
      if (p) where.post = p.id; else where.post = -1;
    }
    const entries = await strapi.db.query('api::vote.vote').findMany({ where, limit: 50 });
    return { data: entries, meta: { pagination: { total: entries.length } } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { data } = ctx.request.body;
    const createData: any = { ...data, publishedAt: new Date() };
    delete createData.user; delete createData.post; delete createData.comment;
    createData.user = user.id;
    if (data.post?.connect?.[0]) { const p = await strapi.db.query('api::post.post').findOne({ where: { documentId: data.post.connect[0] } }); if (p) createData.post = p.id; }
    if (data.comment?.connect?.[0]) { const c = await strapi.db.query('api::comment.comment').findOne({ where: { documentId: data.comment.connect[0] } }); if (c) createData.comment = c.id; }
    const entry = await strapi.db.query('api::vote.vote').create({ data: createData });
    return { data: entry };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const entry = await strapi.db.query('api::vote.vote').findOne({ where: { documentId: id } });
    if (entry) await strapi.db.query('api::vote.vote').delete({ where: { id: entry.id } });
    return { data: { documentId: id } };
  },
}));
