export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "Workspace Administrator",
  uploadDir: process.env.UPLOAD_DIR ?? "data/uploads",
  cronSecret: process.env.CRON_SECRET ?? "",
};
