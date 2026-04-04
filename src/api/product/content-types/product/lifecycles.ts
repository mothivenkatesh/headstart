function calculateHotScore(upvoteCount: number, createdAt: string): number {
  try {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const votes = Math.max((upvoteCount || 0) - 1, 0);
    return Math.pow(votes, 0.8) / Math.pow(ageHours + 2, 1.8);
  } catch {
    return 0;
  }
}

let isUpdating = false;

export default {
  async afterCreate(event) {
    if (isUpdating) return;
    const { result } = event;
    if (!result?.id) return;
    try {
      isUpdating = true;
      const hotScore = calculateHotScore(result.upvoteCount || 0, result.createdAt);
      await strapi.db.query('api::product.product').update({
        where: { id: result.id },
        data: { hotScore },
      });
    } catch (err) {
      strapi.log.error('Product hotScore calc error:', err);
    } finally {
      isUpdating = false;
    }
  },
};
