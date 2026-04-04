export default {
  routes: [
    {
      method: 'POST',
      path: '/poll-vote',
      handler: 'poll-vote.vote',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
