import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async sync(ctx) {
    const { email, fullName, handle, clerkId } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      // Check if user exists
      const existingUsers = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { email: email.toLowerCase() },
        limit: 1,
      });

      let user;
      if (existingUsers.length > 0) {
        user = existingUsers[0];
      } else {
        // Get the authenticated role
        const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
        });

        // Create user
        const username = handle || email.split('@')[0] + '_' + Date.now().toString(36);
        user = await strapi.db.query('plugin::users-permissions.user').create({
          data: {
            email: email.toLowerCase(),
            username,
            handle: handle || username,
            fullName: fullName || email.split('@')[0],
            provider: 'clerk',
            confirmed: true,
            blocked: false,
            role: authRole?.id,
            profileType: 'individual',
            reputation: 0,
            followerCount: 0,
            followingCount: 0,
            isVerified: false,
            isAdmin: false,
            password: clerkId || ('clerk_' + Date.now().toString(36)),
          },
        });
      }

      // Issue Strapi JWT
      const jwt = strapi.plugin('users-permissions').service('jwt').issue({
        id: user.id,
      });

      return ctx.send({
        jwt,
        user: {
          id: user.id,
          documentId: user.documentId,
          email: user.email,
          username: user.username,
          handle: user.handle,
          fullName: user.fullName,
          bio: user.bio,
          profileType: user.profileType,
          jobTitle: user.jobTitle,
          company: user.company,
          location: user.location,
          reputation: user.reputation,
          badge: user.badge,
          isVerified: user.isVerified,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
          skills: user.skills,
          verticals: user.verticals,
        },
      });
    } catch (error) {
      strapi.log.error('Auth sync error:', error);
      return ctx.internalServerError('Failed to sync user');
    }
  },
});
