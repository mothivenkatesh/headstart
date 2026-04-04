export default {
  routes: [
    {
      method: 'GET',
      path: '/user-profile/:handle',
      handler: 'user-profile.findByHandle',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/user-profile/me',
      handler: 'user-profile.updateMe',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/user-profile-search',
      handler: 'user-profile.search',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
