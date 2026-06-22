const configuredJwtSecret = String(process.env.JWT_SECRET || "").trim();

if (process.env.NODE_ENV === "production" && configuredJwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}

export const jwtSecret =
  configuredJwtSecret || "dev_servicehub_secret_change_me";
