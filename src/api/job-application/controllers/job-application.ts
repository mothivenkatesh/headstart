import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job-application.job-application', ({ strapi }) => ({
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
    delete createData.job;

    // user from authenticated user
    const userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: user.documentId },
    });
    if (userRecord) {
      createData.user = userRecord.id;
    }

    // job relation
    if (data.job?.connect?.[0]) {
      const jobDocId = data.job.connect[0];
      const jobRecord = await strapi.db.query('api::job.job').findOne({
        where: { documentId: jobDocId },
      });
      if (jobRecord) {
        createData.job = jobRecord.id;
      }
    }

    const entry = await strapi.db.query('api::job-application.job-application').create({
      data: createData,
    });

    return { data: entry };
  },
}));
