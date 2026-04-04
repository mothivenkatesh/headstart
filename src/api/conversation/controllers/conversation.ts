import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::conversation.conversation', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Get all conversations where this user is a participant via join table
    const knex = strapi.db.connection;
    const links = await knex('conversations_participants_lnk')
      .where('user_id', user.id)
      .select('conversation_id');

    const convoIds = links.map((l: any) => l.conversation_id);
    if (convoIds.length === 0) return { data: [], meta: { pagination: { total: 0 } } };

    // Fetch conversations
    const conversations = await strapi.db.query('api::conversation.conversation').findMany({
      where: { id: { $in: convoIds } },
      orderBy: { lastMessageAt: 'desc' },
    });

    // For each conversation, get participants with full user data
    const data = await Promise.all(
      conversations.map(async (convo: any) => {
        const participantLinks = await knex('conversations_participants_lnk')
          .where('conversation_id', convo.id)
          .select('user_id');

        const participantIds = participantLinks.map((l: any) => l.user_id);
        const participants = await strapi.db.query('plugin::users-permissions.user').findMany({
          where: { id: { $in: participantIds } },
        });

        // Get last message for preview
        const lastMessage = await strapi.db.query('api::message.message').findOne({
          where: { conversation: convo.id },
          orderBy: { createdAt: 'desc' },
          populate: ['sender'],
        });

        return {
          id: convo.id,
          documentId: convo.documentId,
          lastMessageAt: convo.lastMessageAt,
          createdAt: convo.createdAt,
          participants: participants.map((p: any) => ({
            id: p.id,
            documentId: p.documentId,
            fullName: p.fullName,
            handle: p.handle,
            avatar: p.avatar,
            isVerified: p.isVerified,
          })),
          lastMessage: lastMessage ? {
            body: lastMessage.body,
            sender: lastMessage.sender ? {
              id: lastMessage.sender.id,
              fullName: lastMessage.sender.fullName,
            } : null,
            createdAt: lastMessage.createdAt,
          } : null,
        };
      })
    );

    return { data, meta: { pagination: { total: data.length } } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { data } = ctx.request.body;
    const createData: any = { ...data, publishedAt: new Date(), lastMessageAt: new Date() };
    const participantDocIds: string[] = data.participants?.connect || [];
    delete createData.participants;

    const entry = await strapi.db.query('api::conversation.conversation').create({ data: createData });

    const knex = strapi.db.connection;
    for (const docId of participantDocIds) {
      const userRecord = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { documentId: docId } });
      if (userRecord) {
        await knex.raw('INSERT OR IGNORE INTO conversations_participants_lnk (conversation_id, user_id) VALUES (?, ?)', [entry.id, userRecord.id]);
      }
    }
    // Also add current user
    await knex.raw('INSERT OR IGNORE INTO conversations_participants_lnk (conversation_id, user_id) VALUES (?, ?)', [entry.id, user.id]);

    return { data: entry };
  },
}));
