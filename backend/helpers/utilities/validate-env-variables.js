module.exports = function validateEnvVariables(env) {
  const requiredVariables = ["PORT", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  const missingVariables = requiredVariables.filter(
    (variable) => !env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }
  return {
    PORT: env.PORT,
  };
};
