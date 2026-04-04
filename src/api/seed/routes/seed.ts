export default {
  routes: [
    {
      method: 'POST',
      path: '/seed/run',
      handler: 'seed.run',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
