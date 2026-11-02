import express, { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Server } from "http";
import passport from "./auth";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { log } from "./log";

let ready: Promise<void> | undefined;

// Seeds an empty database once per process. If it fails (e.g. the database is
// unreachable) the next call retries.
export function prepareApp(): Promise<void> {
  ready ??= (async () => {
    if ("seedInitialData" in storage) {
      await storage.seedInitialData();
    }
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}

// Adds all middleware and routes to `app`. Shared by the local/Node server
// (server/index.ts) and the Vercel entry (index.ts), which must not call listen().
export function configureApp(app: Express): Server {
  // Trust proxy for secure cookies to work behind a reverse proxy (Replit, Vercel)
  app.set("trust proxy", 1);

  // Serverless processes can handle a request before anyone has called prepareApp().
  app.use(async (_req, _res, next) => {
    try {
      await prepareApp();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "npt-poker-tour-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  return server;
}
