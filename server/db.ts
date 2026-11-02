import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Shared by Drizzle and the express-session store.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless platforms run many short-lived instances; keep each one's pool small.
  max: process.env.VERCEL ? 3 : 10,
});

// A connection dropped by the database pooler emits 'error' on the idle client;
// unhandled, that would crash the process.
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export const db = drizzle(pool, { schema });
