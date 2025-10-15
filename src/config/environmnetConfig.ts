export const environmentConfig = () => ({
  mercadoPago: {
    mpApi: process.env.MP_API,
    authApi: process.env.MP_AUTH_API,
    clientId: process.env.MP_CLIENT_ID,
    clientSecret: process.env.MP_CLIENT_SECRET,
    redirectUri: process.env.MP_REDIRECT_URI,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
});
