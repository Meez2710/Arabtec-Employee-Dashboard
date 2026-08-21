import express, { type Express } from "express";
import path from "node:path";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  const root = path.resolve(ENV.uploadDir);
  const options = { fallthrough: false, immutable: true, maxAge: "7d" as const, dotfiles: "deny" as const };
  app.use("/uploads", express.static(root, options));
  // Compatibility path for files restored from the former deployment.
  app.use("/manus-storage", express.static(root, options));
}
