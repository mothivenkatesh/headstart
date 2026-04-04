export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result || result.value !== 1) return; // Only notify on upvotes

    try {
      // Get the vote with relations
      const vote = await strapi.db.query('api::vote.vote').findOne({
        where: { id: result.id },
        populate: ['user', 'post', 'comment'],
      });
      if (!vote?.user || !vote?.post) return;

      // Get post author
      const post = await strapi.db.query('api::post.post').findOne({
        where: { id: vote.post.id },
        populate: ['author'],
      });
      if (!post?.author || post.author.id === vote.user.id) return; // Don't notify self

      await strapi.db.query('api::notification.notification').create({
        data: {
          user: post.author.id,
          actor: vote.user.id,
          actorName: vote.user.fullName || vote.user.username,
          type: 'post_upvote',
          category: 'engagement',
          priority: 'low',
          action: 'upvoted your post',
          targetText: post.title?.slice(0, 60),
          targetUrl: `/post/${post.documentId}`,
          isRead: false,
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.error('Vote notification error:', err);
    }
  },
};
