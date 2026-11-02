# Threat Model

## Project Overview

NPT (Norfolk Poker Tour) is a tournament registration platform. Stack: React 18 + Vite + Wouter frontend, Express.js + TypeScript backend, PostgreSQL (Neon serverless) via Drizzle ORM. Admin authentication uses Passport.js local strategy with bcrypt password hashing and PostgreSQL-backed express-session. Deployed publicly on Replit autoscale at https://Norfolkpoker.replit.app.

Users: public visitors browse tournaments and register (name/email/phone). Admins manage tournaments, rules, chip structure, registrations, results, and subscribers.

## Assets

- **Registrant PII** — names, emails, phone numbers in `registrations` and `notification_subscribers`. Public endpoints expose only names; full PII is admin-only.
- **Admin credentials & sessions** — bcrypt password hashes in `admin_users`, session cookies signed with `SESSION_SECRET`.
- **Application secrets** — `SESSION_SECRET`, `DATABASE_URL`.
- **Business data** — tournaments, results, leaderboard, chip structure, rules.

## Trust Boundaries

- **Browser → Express API** — all requests untrusted; validated with Zod schemas.
- **API → PostgreSQL** — Drizzle ORM parameterized queries (no raw string concatenation observed).
- **Public → Admin boundary** — `requireAuth` middleware (server/auth.ts) gates all `/api/admin/*` routes and session check. Public routes: tournaments (read), registrations (read names only), results (read names/placement), leaderboard, rules, chip-structure (read), registration/bulk-registration/notification-subscriber (create).

## Scan Anchors

- Production entry points: `server/routes.ts` (all HTTP routes), `server/index.ts` (session/middleware setup), `server/auth.ts` (passport), `server/storage.ts` (data layer, `DatabaseStorage` is production), `shared/schema.ts` (validation).
- Highest-risk areas: admin auth/credential seeding (`seedInitialData`/`seedAdminUser` in storage.ts), session config (index.ts line 29), login endpoint (routes.ts line 193).
- Public vs admin: single admin role; all admins equal privilege (no multi-tenant / per-object ownership, so IDOR on raw IDs within admin scope is not a cross-tenant concern).
- Dev-only: `MemStorage` is used for in-memory/dev; `DatabaseStorage` is production. Vite dev server only in development. `attached_assets`, `tests/`, `scripts/` are non-production.

## Threat Categories

### Spoofing / Improper Authentication

Admin access depends entirely on the login credential and signed session cookie. Current weaknesses: a hardcoded default admin credential is seeded into the production DB (CRITICAL), and the session secret falls back to a committed constant when `SESSION_SECRET` is unset (HIGH). Guarantees required: no hardcoded credentials, mandatory `SESSION_SECRET`, forced rotation of seeded accounts.

### Elevation of Privilege

All sensitive mutations are behind `requireAuth`, which is correctly applied to every `/api/admin/*` route. No missing function-level checks were found. Single-role model means no horizontal privilege boundaries to cross. Main escalation path is authentication compromise (above) rather than broken function-level authz.

### Information Disclosure

Public registration/results endpoints correctly project to names only, withholding emails/phones. Admin PII endpoints (`/api/admin/registrations/:id`, `/api/admin/all-emails`, `/api/admin/notifications`) are gated. Residual risk: 400 error responses echo the full Zod `error` object (minor internal detail leakage). Password hashes are stripped from admin responses.

### Denial of Service

No rate limiting on authentication or public create endpoints (`/api/registrations`, `/api/registrations/bulk`, `/api/notification-subscribers`). Enables brute-force on login (MEDIUM) and registration spam. Guarantee required: per-IP/per-account rate limiting on auth and public write endpoints.

### Tampering

Inputs validated via Zod; Drizzle parameterizes queries. No SQL/command injection paths observed. Bulk registration uses `SELECT ... FOR UPDATE` transactions to avoid race conditions.
