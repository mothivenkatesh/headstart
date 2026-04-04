export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result) return;

    try {
      // Fetch the full message with relations
      const message = await strapi.db.query('api::message.message').findOne({
        where: { id: result.id },
        populate: ['sender', 'conversation'],
      });
      if (!message?.conversation) return;

      // Update lastMessageAt on the conversation
      await strapi.db.query('api::conversation.conversation').update({
        where: { id: message.conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Emit to conversation room via Socket.IO plugin
      const $io = (strapi as any).$io;
      if ($io) {
        $io.server.to(`conversation:${message.conversation.documentId}`).emit('message:new', {
          id: message.id,
          documentId: message.documentId,
          body: message.body,
          createdAt: message.createdAt,
          sender: message.sender
            ? {
                id: message.sender.id,
                documentId: message.sender.documentId,
                fullName: message.sender.fullName,
                handle: message.sender.handle,
                avatar: message.sender.avatar,
              }
            : null,
          conversation: {
            id: message.conversation.id,
            documentId: message.conversation.documentId,
          },
        });
      }
    } catch (err) {
      strapi.log.error('Message lifecycle error:', err);
    }
  },
};
