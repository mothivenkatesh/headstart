import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job.job', ({ strapi }) => ({
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
    delete createData.postedBy;

    // postedBy from authenticated user
    const userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: user.documentId },
    });
    if (userRecord) {
      createData.postedBy = userRecord.id;
    }

    const entry = await strapi.db.query('api::job.job').create({
      data: createData,
    });

    return { data: entry };
  },
}));
