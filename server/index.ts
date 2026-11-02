import express from "express";
import { configureApp, prepareApp } from "./app";
import { log } from "./log";
import { setupVite, serveStatic } from "./vite";

const app = express();

(async () => {
  const server = configureApp(app);
  await prepareApp();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    // SO_REUSEPORT isn't supported on macOS (listen fails with ENOTSUP).
    ...(process.platform === "linux" ? { reusePort: true } : {}),
  }, () => {
    log(`serving on port ${port}`);
  });
})();
