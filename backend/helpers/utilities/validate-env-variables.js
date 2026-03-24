module.exports = function validateEnvVariables(env) {
  const requiredVariables = [
    "PORT",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_SECURE",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MONGO_URI",
    "APP_NAME",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_OAUTH_REDIRECT_URL",
    "GITHUB_OAUTH_REDIRECT_URL",
    "REDIS_URI",
    "FRONTENTD_URL",
  ];
  const missingVariables = requiredVariables.filter(
    (variable) => !env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }
  return {
    PORT: parseInt(env.PORT, 10),
    JWT_SECRET: env.JWT_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    EMAIL_USER: env.EMAIL_USER,
    EMAIL_PASS: env.EMAIL_PASS,
    EMAIL_HOST: env.EMAIL_HOST,
    EMAIL_PORT: parseInt(env.EMAIL_PORT, 10),
    EMAIL_SECURE: env.EMAIL_SECURE === "true",
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URL: env.GOOGLE_OAUTH_REDIRECT_URL,
    MONGO_URI: env.MONGO_URI,
    APP_NAME: env.APP_NAME,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
    GITHUB_OAUTH_REDIRECT_URL: env.GITHUB_OAUTH_REDIRECT_URL,
    REDIS_URI: env.REDIS_URI,
    FRONTENTD_URL: env.FRONTENTD_URL,
  };
};
