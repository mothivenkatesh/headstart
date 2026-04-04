import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::poll-vote.poll-vote', ({ strapi }) => ({
  async vote(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { postDocumentId, optionIndex } = ctx.request.body;
    if (!postDocumentId || optionIndex === undefined) {
      return ctx.badRequest('postDocumentId and optionIndex are required');
    }

    // Find the post
    const post = await strapi.db.query('api::post.post').findOne({
      where: { documentId: postDocumentId },
    });
    if (!post || post.postType !== 'poll' || !post.pollOptions) {
      return ctx.badRequest('Post is not a poll');
    }

    const options = post.pollOptions as { text: string; votes: number }[];
    if (optionIndex < 0 || optionIndex >= options.length) {
      return ctx.badRequest('Invalid option index');
    }

    // Check if user already voted on this poll
    const existing = await strapi.db.query('api::poll-vote.poll-vote').findOne({
      where: { post: post.id, user: user.id },
    });

    if (existing) {
      // Already voted — switch vote
      const oldIndex = existing.optionIndex as number;
      if (oldIndex === optionIndex) {
        return ctx.send({ data: { pollOptions: options, userVotedIndex: optionIndex } });
      }
      // Decrement old, increment new
      if (oldIndex >= 0 && oldIndex < options.length) {
        options[oldIndex].votes = Math.max((options[oldIndex].votes || 0) - 1, 0);
      }
      options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;

      await strapi.db.query('api::poll-vote.poll-vote').update({
        where: { id: existing.id },
        data: { optionIndex },
      });
    } else {
      // New vote
      options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;

      await strapi.db.query('api::poll-vote.poll-vote').create({
        data: { post: post.id, user: user.id, optionIndex, publishedAt: new Date() },
      });
    }

    // Update the post's pollOptions
    await strapi.db.query('api::post.post').update({
      where: { id: post.id },
      data: { pollOptions: options },
    });

    return ctx.send({ data: { pollOptions: options, userVotedIndex: optionIndex } });
  },
}));
