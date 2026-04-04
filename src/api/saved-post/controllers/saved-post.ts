import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::saved-post.saved-post', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const query: any = ctx.query || {};
    const filters = query.filters || {};

    const savedPosts = await strapi.db.query('api::saved-post.saved-post').findMany({
      where: filters,
      populate: ['user', 'post'],
      orderBy: { createdAt: 'desc' },
      limit: Number(query.pagination?.pageSize) || 50,
    });

    // Deep-populate post.author and post.circle for each saved post
    const data = await Promise.all(
      savedPosts.map(async (sp: any) => {
        if (!sp.post) return { ...sp, post: null };

        const fullPost = await strapi.db.query('api::post.post').findOne({
          where: { id: sp.post.id },
          populate: ['author', 'circle'],
        });

        return {
          id: sp.id,
          documentId: sp.documentId,
          createdAt: sp.createdAt,
          post: fullPost ? {
            ...fullPost,
            author: fullPost.author ? {
              id: fullPost.author.id,
              documentId: fullPost.author.documentId,
              fullName: fullPost.author.fullName,
              handle: fullPost.author.handle,
              avatar: fullPost.author.avatar,
              badge: fullPost.author.badge,
              isVerified: fullPost.author.isVerified,
            } : null,
          } : null,
        };
      })
    );

    const total = await strapi.db.query('api::saved-post.saved-post').count({ where: filters });

    return {
      data,
      meta: { pagination: { page: 1, pageSize: 50, pageCount: 1, total } },
    };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { data } = ctx.request.body;
    const createData: any = { ...data, publishedAt: new Date() };
    delete createData.user;
    delete createData.post;

    createData.user = user.id;

    if (data.post?.connect?.[0]) {
      const p = await strapi.db.query('api::post.post').findOne({ where: { documentId: data.post.connect[0] } });
      if (p) createData.post = p.id;
    }

    const entry = await strapi.db.query('api::saved-post.saved-post').create({ data: createData });
    return { data: entry };
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const entry = await strapi.db.query('api::saved-post.saved-post').findOne({ where: { documentId: id } });
    if (entry) await strapi.db.query('api::saved-post.saved-post').delete({ where: { id: entry.id } });
    return { data: { documentId: id } };
  },
}));
