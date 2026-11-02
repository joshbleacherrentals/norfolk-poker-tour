import express from "express";
import { configureApp } from "./app";

// Function entry point for Vercel (bundled by scripts/build-vercel.mjs). Unlike
// server/index.ts it never calls listen(): Vercel invokes the app per request.
const app = express();
configureApp(app);

export default app;
