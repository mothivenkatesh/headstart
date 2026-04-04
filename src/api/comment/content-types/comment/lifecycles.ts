export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result) return;

    try {
      const comment = await strapi.db.query('api::comment.comment').findOne({
        where: { id: result.id },
        populate: ['author', 'post'],
      });
      if (!comment?.author || !comment?.post) return;

      const post = await strapi.db.query('api::post.post').findOne({
        where: { id: comment.post.id },
        populate: ['author'],
      });
      if (!post?.author || post.author.id === comment.author.id) return;

      await strapi.db.query('api::notification.notification').create({
        data: {
          user: post.author.id,
          actor: comment.author.id,
          actorName: comment.author.fullName || comment.author.username,
          type: 'post_comment',
          category: 'engagement',
          priority: 'medium',
          action: 'commented on your post',
          targetText: post.title?.slice(0, 60),
          targetUrl: `/post/${post.documentId}`,
          isRead: false,
          publishedAt: new Date(),
        },
      });

      // Increment comment count on post
      await strapi.db.query('api::post.post').update({
        where: { id: post.id },
        data: { commentCount: (post.commentCount || 0) + 1 },
      });
    } catch (err) {
      strapi.log.error('Comment notification error:', err);
    }
  },
};
