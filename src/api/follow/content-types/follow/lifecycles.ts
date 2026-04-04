export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result) return;

    try {
      const follow = await strapi.db.query('api::follow.follow').findOne({
        where: { id: result.id },
        populate: ['follower', 'following'],
      });
      if (!follow?.follower || !follow?.following) return;
      if (follow.follower.id === follow.following.id) return;

      await strapi.db.query('api::notification.notification').create({
        data: {
          user: follow.following.id,
          actor: follow.follower.id,
          actorName: follow.follower.fullName || follow.follower.username,
          type: 'new_follower',
          category: 'social',
          priority: 'low',
          action: 'started following you',
          targetUrl: `/profile/${follow.follower.handle}`,
          isRead: false,
          publishedAt: new Date(),
        },
      });

      // Update follower counts
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: follow.following.id },
        data: { followerCount: (follow.following.followerCount || 0) + 1 },
      });
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: follow.follower.id },
        data: { followingCount: (follow.follower.followingCount || 0) + 1 },
      });
    } catch (err) {
      strapi.log.error('Follow notification error:', err);
    }
  },

  async afterDelete(event) {
    const { result } = event;
    if (!result) return;

    try {
      const follow = await strapi.db.query('api::follow.follow').findOne({
        where: { id: result.id },
        populate: ['follower', 'following'],
      });
      if (!follow?.follower || !follow?.following) return;

      // Decrement follower counts
      const following = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: follow.following.id } });
      const follower = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: follow.follower.id } });
      if (following) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: following.id },
          data: { followerCount: Math.max((following.followerCount || 0) - 1, 0) },
        });
      }
      if (follower) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: follower.id },
          data: { followingCount: Math.max((follower.followingCount || 0) - 1, 0) },
        });
      }
    } catch (err) {
      strapi.log.error('Unfollow count error:', err);
    }
  },
};
