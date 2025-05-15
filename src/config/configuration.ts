export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
  },
  apiKey: {
    defaultExpirationDays: parseInt(process.env.API_KEY_DEFAULT_EXPIRATION_DAYS || '365', 10),
  }
});