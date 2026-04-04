export default () => ({
  io: {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: 'api::message.message',
          actions: ['create'],
          populate: ['sender', 'conversation'],
        },
        {
          uid: 'api::notification.notification',
          actions: ['create'],
          populate: ['actor'],
        },
      ],
      socket: {
        serverOptions: {
          cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
          },
        },
      },
      events: [
        {
          name: 'connection',
          handler: ({ strapi }, socket) => {
            strapi.log.info(`[Socket.IO] Client connected: ${socket.id}`);

            // Join user to their personal room for targeted messages
            socket.on('join:user', (userId: string) => {
              socket.join(`user:${userId}`);
              // Broadcast online status
              socket.broadcast.emit('user:online', { userId });
              strapi.log.info(`[Socket.IO] User ${userId} joined personal room`);
            });

            // Join a conversation room
            socket.on('join:conversation', (conversationId: string) => {
              socket.join(`conversation:${conversationId}`);
              strapi.log.info(`[Socket.IO] Socket ${socket.id} joined conversation:${conversationId}`);
            });

            // Leave a conversation room
            socket.on('leave:conversation', (conversationId: string) => {
              socket.leave(`conversation:${conversationId}`);
            });

            // Typing indicators
            socket.on('typing:start', (data: { conversationId: string; userId: string; userName: string }) => {
              socket.to(`conversation:${data.conversationId}`).emit('typing:indicator', {
                conversationId: data.conversationId,
                userId: data.userId,
                userName: data.userName,
                isTyping: true,
              });
            });

            socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
              socket.to(`conversation:${data.conversationId}`).emit('typing:indicator', {
                conversationId: data.conversationId,
                userId: data.userId,
                isTyping: false,
              });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
              socket.broadcast.emit('user:offline', { socketId: socket.id });
              strapi.log.info(`[Socket.IO] Client disconnected: ${socket.id}`);
            });
          },
        },
      ],
    },
  },
});
