import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { processWorkspaceReviewReminders } from "../reviewReminders";
import { ENV } from "./env";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  registerStorageProxy(app);
  registerLocalAuthRoutes(app);

  app.post("/api/scheduled/workspace-review-reminders", async (req, res) => {
    const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    if (!ENV.cronSecret || supplied !== ENV.cronSecret) return res.status(403).json({ error: "forbidden" });
    try {
      return res.json({ ok: true, ...(await processWorkspaceReviewReminders()) });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled-task-failed" });
    }
  });

  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  server.listen(port, "0.0.0.0", () => console.log(`Server running on http://0.0.0.0:${port}/`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
