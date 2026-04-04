import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
  async find(ctx) {
    const query: any = ctx.query || {};
    const filters = query.filters || {};
    const pagination = query.pagination || {};
    const pageSize = Number(pagination.pageSize) || 20;
    const page = Number(pagination.page) || 1;

    // Build where clause — handle nested relation filters
    const where: any = {};

    // Circle filter: filters[circle][documentId][$eq]
    if (filters.circle?.documentId?.$eq) {
      const circle = await strapi.db.query('api::circle.circle').findOne({ where: { documentId: filters.circle.documentId.$eq } });
      if (circle) where.circle = circle.id;
      else where.circle = -1; // No match
    }

    // Author handle filter: filters[author][handle][$eq]
    if (filters.author?.handle?.$eq) {
      const author = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { handle: filters.author.handle.$eq } });
      if (author) where.author = author.id;
      else where.author = -1;
    }

    // Author id filter: filters[author][id][$eq]
    if (filters.author?.id?.$eq) {
      where.author = Number(filters.author.id.$eq);
    }

    // Title search: filters[title][$containsi]
    if (filters.title?.$containsi) {
      where.title = { $containsi: filters.title.$containsi };
    }

    const posts = await strapi.db.query('api::post.post').findMany({
      where,
      orderBy: query.sort ? parseSort(query.sort) : { createdAt: 'desc' },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      populate: ['author', 'circle', 'images'],
    });

    const total = await strapi.db.query('api::post.post').count({ where });

    // Sanitize author data
    const data = posts.map(p => ({
      ...p,
      author: p.author ? {
        id: p.author.id,
        documentId: p.author.documentId,
        fullName: p.author.fullName,
        handle: p.author.handle,
        avatar: p.author.avatar,
        badge: p.author.badge,
        company: p.author.company,
        jobTitle: p.author.jobTitle,
        isVerified: p.author.isVerified,
      } : null,
    }));

    return {
      data,
      meta: { pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total } },
    };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const post = await strapi.db.query('api::post.post').findOne({
      where: { documentId: id },
      populate: ['author', 'circle', 'images'],
    });

    if (!post) return ctx.notFound('Post not found');

    return {
      data: {
        ...post,
        author: post.author ? {
          id: post.author.id,
          documentId: post.author.documentId,
          fullName: post.author.fullName,
          handle: post.author.handle,
          avatar: post.author.avatar,
          badge: post.author.badge,
          company: post.author.company,
          jobTitle: post.author.jobTitle,
          isVerified: post.author.isVerified,
        } : null,
      },
    };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { data } = ctx.request.body;

    // Circle is mandatory
    if (!data.circle?.connect?.[0]) {
      return ctx.badRequest('Circle is required. Choose a circle before posting.');
    }

    const createData: any = { ...data, publishedAt: new Date() };
    delete createData.author;
    delete createData.circle;

    createData.author = user.id;

    if (data.circle?.connect?.[0]) {
      const c = await strapi.db.query('api::circle.circle').findOne({ where: { documentId: data.circle.connect[0] } });
      if (c) createData.circle = c.id;
    }

    const entry = await strapi.db.query('api::post.post').create({ data: createData, populate: ['author', 'circle'] });

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

  async delete(ctx) {
    const { id } = ctx.params;
    const post = await strapi.db.query('api::post.post').findOne({ where: { documentId: id } });
    if (!post) return ctx.notFound('Post not found');
    await strapi.db.query('api::post.post').delete({ where: { id: post.id } });
    return { data: { documentId: id } };
  },
}));

function parseSort(sort: string | string[]): Record<string, string> {
  const s = Array.isArray(sort) ? sort[0] : sort;
  if (!s) return { createdAt: 'desc' };
  const [field, dir] = s.split(':');
  return { [field]: dir || 'asc' };
}
