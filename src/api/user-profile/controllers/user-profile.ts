import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async findByHandle(ctx) {
    const { handle } = ctx.params;

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { handle },
    });

    if (!user) return ctx.notFound('User not found');

    // Get post count
    const postCount = await strapi.db.query('api::post.post').count({ where: { author: user.id } });

    // Get follower and following counts (live)
    const followerCount = await strapi.db.query('api::follow.follow').count({ where: { following: user.id } });
    const followingCount = await strapi.db.query('api::follow.follow').count({ where: { follower: user.id } });

    // Get proof of works
    const proofOfWorks = await strapi.db.query('api::proof-of-work.proof-of-work').findMany({
      where: { user: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return ctx.send({
      data: {
        id: user.id,
        documentId: user.documentId,
        fullName: user.fullName,
        handle: user.handle,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        coverImage: user.coverImage,
        profileType: user.profileType,
        jobTitle: user.jobTitle,
        company: user.company,
        companyType: user.companyType,
        location: user.location,
        website: user.website,
        linkedinUrl: user.linkedinUrl,
        twitterUrl: user.twitterUrl,
        skills: user.skills,
        verticals: user.verticals,
        yearsOfExperience: user.yearsOfExperience,
        isFreelancer: user.isFreelancer,
        availableForHire: user.availableForHire,
        reputation: user.reputation,
        badge: user.badge,
        isVerified: user.isVerified,
        followerCount,
        followingCount,
        postCount,
        proofOfWorks,
        createdAt: user.createdAt,
      },
    });
  },

  async search(ctx) {
    const q = (ctx.query.q as string || '').trim();
    if (!q || q.length < 1) return ctx.send({ data: [] });

    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: {
        $or: [
          { handle: { $containsi: q } },
          { fullName: { $containsi: q } },
        ],
      },
      limit: 10,
    });

    return ctx.send({
      data: users
        .filter((u: any) => ctx.state.user ? u.id !== ctx.state.user.id : true)
        .map((u: any) => ({
          id: u.id,
          documentId: u.documentId,
          fullName: u.fullName,
          handle: u.handle,
          avatar: u.avatar,
          isVerified: u.isVerified,
        })),
    });
  },

  async updateMe(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const allowedFields = [
      'fullName', 'handle', 'bio', 'jobTitle', 'company', 'companyType',
      'location', 'website', 'linkedinUrl', 'twitterUrl', 'profileType',
      'skills', 'verticals', 'yearsOfExperience', 'isFreelancer', 'availableForHire',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (ctx.request.body[field] !== undefined) {
        updateData[field] = ctx.request.body[field];
      }
    }

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: updateData,
    });

    return ctx.send({
      data: {
        id: updated.id,
        documentId: updated.documentId,
        fullName: updated.fullName,
        handle: updated.handle,
        bio: updated.bio,
        jobTitle: updated.jobTitle,
        company: updated.company,
        location: updated.location,
        website: updated.website,
        linkedinUrl: updated.linkedinUrl,
        twitterUrl: updated.twitterUrl,
        profileType: updated.profileType,
        skills: updated.skills,
        verticals: updated.verticals,
        isVerified: updated.isVerified,
      },
    });
  },
});
