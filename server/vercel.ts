import express from "express";
import { configureApp } from "./app";

// Function entry point for Vercel (bundled by scripts/build-vercel.mjs). Unlike
// server/index.ts it never calls listen(): Vercel invokes the app per request.
const app = express();

// The build output routes /api/<rest> to this function as /server?__path=<rest>, with the slashes
// in <rest> percent-encoded (auth/login arrives as auth%2Flogin). Restore the real URL, minus that
// parameter, so Express routes it and req.query sees only the caller's own query.
app.use((req, _res, next) => {
  const queryStart = req.url.indexOf("?");
  if (queryStart !== -1) {
    const params = req.url.slice(queryStart + 1).split("&");
    const i = params.findIndex((param) => param.startsWith("__path="));
    if (i !== -1) {
      const encoded = params.splice(i, 1)[0].slice("__path=".length);
      let rest = encoded;
      try {
        rest = decodeURIComponent(encoded);
      } catch {
        // Malformed escape sequence: route it as received.
      }
      req.url = `/api/${rest}${params.length ? `?${params.join("&")}` : ""}`;
      req.originalUrl = req.url;
    }
  }
  next();
});

configureApp(app);

export default app;
