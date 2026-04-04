export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result) return;

    try {
      const review = await strapi.db.query('api::product-review.product-review').findOne({
        where: { id: result.id },
        populate: ['user', 'product'],
      });
      if (!review?.user || !review?.product) return;

      const product = await strapi.db.query('api::product.product').findOne({
        where: { id: review.product.id },
        populate: ['submittedBy'],
      });
      if (!product?.submittedBy || product.submittedBy.id === review.user.id) return;

      await strapi.db.query('api::notification.notification').create({
        data: {
          user: product.submittedBy.id,
          actor: review.user.id,
          actorName: review.user.fullName || review.user.username,
          type: 'product_review',
          category: 'launchpad',
          priority: 'medium',
          action: 'reviewed your product',
          targetText: product.name?.slice(0, 60),
          targetUrl: `/launchpad/${product.documentId}`,
          isRead: false,
          publishedAt: new Date(),
        },
      });

      // Update review count and average rating on product
      const allReviews = await strapi.db.query('api::product-review.product-review').findMany({
        where: { product: product.id },
      });
      const avgRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length;
      await strapi.db.query('api::product.product').update({
        where: { id: product.id },
        data: { reviewCount: allReviews.length, rating: Math.round(avgRating * 10) / 10 },
      });
    } catch (err) {
      strapi.log.error('Review notification error:', err);
    }
  },
};
