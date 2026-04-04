import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product-review.product-review', ({ strapi }) => ({
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
    delete createData.user;
    delete createData.product;

    // user from authenticated user
    const userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: user.documentId },
    });
    if (userRecord) {
      createData.user = userRecord.id;
    }

    // product relation
    if (data.product?.connect?.[0]) {
      const productDocId = data.product.connect[0];
      const productRecord = await strapi.db.query('api::product.product').findOne({
        where: { documentId: productDocId },
      });
      if (productRecord) {
        createData.product = productRecord.id;
      }
    }

    const entry = await strapi.db.query('api::product-review.product-review').create({
      data: createData,
    });

    return { data: entry };
  },
}));
