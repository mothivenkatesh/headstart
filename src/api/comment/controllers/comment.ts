import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({
  async find(ctx) {
    const query: any = ctx.query || {};
    const filters = query.filters || {};
    const pageSize = Number(query.pagination?.pageSize) || 100;

    const comments = await strapi.db.query('api::comment.comment').findMany({
      where: filters,
      orderBy: { createdAt: 'asc' },
      limit: pageSize,
      populate: ['author', 'post', 'parent'],
    });

    const total = await strapi.db.query('api::comment.comment').count({ where: filters });

    const data = comments.map((c: any) => ({
      ...c,
      author: c.author ? {
        id: c.author.id,
        documentId: c.author.documentId,
        fullName: c.author.fullName,
        handle: c.author.handle,
        avatar: c.author.avatar,
        badge: c.author.badge,
        isVerified: c.author.isVerified,
      } : null,
      parent: c.parent ? { id: c.parent.id, documentId: c.parent.documentId } : null,
    }));

    return {
      data,
      meta: { pagination: { page: 1, pageSize, pageCount: 1, total } },
    };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { data } = ctx.request.body;
    const createData: any = { ...data, publishedAt: new Date() };
    delete createData.author;
    delete createData.post;
    delete createData.parent;

    createData.author = user.id;

    if (data.post?.connect?.[0]) {
      const p = await strapi.db.query('api::post.post').findOne({ where: { documentId: data.post.connect[0] } });
      if (p) createData.post = p.id;
    }
    if (data.parent?.connect?.[0]) {
      const p = await strapi.db.query('api::comment.comment').findOne({ where: { documentId: data.parent.connect[0] } });
      if (p) createData.parent = p.id;
    }

    const entry = await strapi.db.query('api::comment.comment').create({
      data: createData,
      populate: ['author'],
    });

    return {
      data: {
        ...entry,
        author: entry.author ? {
          id: entry.author.id,
          documentId: entry.author.documentId,
          fullName: entry.author.fullName,
          handle: entry.author.handle,
        } : null,
      },
    };
  },
}));
