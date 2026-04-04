export default {
  routes: [
    {
      method: 'POST',
      path: '/auth-sync',
      handler: 'auth-sync.sync',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
