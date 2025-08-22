export const environmentConfig = () => ({
  mercadoPago: {
    authApi: process.env.MP_AUTH_API,
    clientId: process.env.MP_CLIENT_ID,
    redirectUri: process.env.MP_REDIRECT_URI,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
});
