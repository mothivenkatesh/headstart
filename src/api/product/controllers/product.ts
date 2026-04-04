import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { data } = ctx.request.body;

    const createData: any = {
      ...data,
      publishedAt: new Date(),
    };

    // Remove relation objects before create
    delete createData.submittedBy;

    // Auto-generate slug from name if missing
    if (!createData.slug && createData.name) {
      createData.slug = createData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // submittedBy from authenticated user
    const userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: user.documentId },
    });
    if (userRecord) {
      createData.submittedBy = userRecord.id;
    }

    const entry = await strapi.db.query('api::product.product').create({
      data: createData,
    });

    return { data: entry };
  },
}));
