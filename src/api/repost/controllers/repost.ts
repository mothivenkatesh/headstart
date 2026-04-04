import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::repost.repost', ({ strapi }) => ({
  async find(ctx) {
    const query: any = ctx.query || {};
    const filters = query.filters || {};
    const pageSize = Number(query.pagination?.pageSize) || 50;

    // Build where clause for nested relations
    const where: any = {};
    if (filters.user?.handle?.$eq) {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { handle: filters.user.handle.$eq } });
      if (user) where.user = user.id;
      else where.user = -1;
    }
    if (filters.user?.id?.$eq) {
      where.user = Number(filters.user.id.$eq);
    }

    const reposts = await strapi.db.query('api::repost.repost').findMany({
      where,
      orderBy: { createdAt: 'desc' },
      limit: pageSize,
      populate: ['user', 'originalPost'],
    });

    // Deep-populate originalPost.author and originalPost.circle
    const data = await Promise.all(
      reposts.map(async (r: any) => {
        let fullPost = null;
        if (r.originalPost) {
          fullPost = await strapi.db.query('api::post.post').findOne({
            where: { id: r.originalPost.id },
            populate: ['author', 'circle'],
          });
          if (fullPost?.author) {
            fullPost.author = {
              id: fullPost.author.id,
              documentId: fullPost.author.documentId,
              fullName: fullPost.author.fullName,
              handle: fullPost.author.handle,
              avatar: fullPost.author.avatar,
              isVerified: fullPost.author.isVerified,
            };
          }
        }
        return {
          id: r.id,
          documentId: r.documentId,
          thoughts: r.thoughts,
          createdAt: r.createdAt,
          user: r.user ? {
            id: r.user.id,
            documentId: r.user.documentId,
            fullName: r.user.fullName,
            handle: r.user.handle,
            avatar: r.user.avatar,
            isVerified: r.user.isVerified,
          } : null,
          originalPost: fullPost,
        };
      })
    );

    const total = await strapi.db.query('api::repost.repost').count({ where });

    return {
      data,
      meta: { pagination: { page: 1, pageSize, pageCount: 1, total } },
    };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { data } = ctx.request.body;
    const createData: any = { publishedAt: new Date() };

    if (data.thoughts) createData.thoughts = data.thoughts;
    createData.user = user.id;

    if (data.originalPost?.connect?.[0]) {
      const p = await strapi.db.query('api::post.post').findOne({ where: { documentId: data.originalPost.connect[0] } });
      if (p) {
        createData.originalPost = p.id;
        // Increment shareCount on original post
        await strapi.db.query('api::post.post').update({
          where: { id: p.id },
          data: { shareCount: (p.shareCount || 0) + 1 },
        });
      }
    }

    const entry = await strapi.db.query('api::repost.repost').create({ data: createData });
    return { data: entry };
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const repost = await strapi.db.query('api::repost.repost').findOne({
      where: { documentId: id },
      populate: ['originalPost'],
    });

    if (repost) {
      // Decrement shareCount on original post
      if (repost.originalPost) {
        await strapi.db.query('api::post.post').update({
          where: { id: repost.originalPost.id },
          data: { shareCount: Math.max((repost.originalPost.shareCount || 0) - 1, 0) },
        });
      }
      await strapi.db.query('api::repost.repost').delete({ where: { id: repost.id } });
    }

    return { data: { documentId: id } };
  },
}));
