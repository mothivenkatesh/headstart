import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::message.message', ({ strapi }) => ({
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
    delete createData.sender;
    delete createData.conversation;

    // sender from authenticated user
    const senderRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { documentId: user.documentId },
    });
    if (senderRecord) {
      createData.sender = senderRecord.id;
    }

    // conversation relation
    if (data.conversation?.connect?.[0]) {
      const convDocId = data.conversation.connect[0];
      const convRecord = await strapi.db.query('api::conversation.conversation').findOne({
        where: { documentId: convDocId },
      });
      if (convRecord) {
        createData.conversation = convRecord.id;
      }
    }

    const entry = await strapi.db.query('api::message.message').create({
      data: createData,
    });

    return { data: entry };
  },
}));
