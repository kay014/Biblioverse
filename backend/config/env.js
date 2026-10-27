const requiredProductionEnv = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];

const validateEnv = () => {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (nodeEnv === "production") {
    for (const key of requiredProductionEnv) {
      if (!process.env[key]) {
        throw new Error(`Missing required production environment variable: ${key}`);
      }
    }
  }

  if (!process.env.PORT) {
    process.env.PORT = "5000";
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  if (!process.env.GOOGLE_BOOKS_API_KEY && nodeEnv === "production") {
    throw new Error("Missing required production environment variable: GOOGLE_BOOKS_API_KEY");
  }
};

module.exports = {
  validateEnv,
};
