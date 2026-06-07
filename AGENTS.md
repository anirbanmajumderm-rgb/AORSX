<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Next.js 16 Key Differences From Training Data
- Middleware is now called Proxy: use `src/proxy.ts` instead of `src/middleware.ts`
  - Export a named `proxy` function (async if needed)
  - Use `export const config = { matcher: [...] }` for path matching
- **Webpack is the default bundler** (Turbopack disabled — unstable on this Windows system).
  - Dev: `next dev --webpack` (set as default in package.json)
  - Build: `next build --webpack` (via `npm run build:webpack`; default `npm run build` uses plain `next build`)
  - Turbopack available via `next dev --turbopack` but NOT recommended (crashes)
  - HMR is slower (~500-800ms) but stable
  - Webpack filesystem cache enabled (gzip, 7-day TTL)
- Use `proxy` instead of `middleware` when adding route protection

# Stable Development System (Webpack-only, no Turbopack)

## LAUNCH COMMANDS

| Command | Purpose |
|---|---|
| `.\start.bat` | **One-click** — double-click from Explorer. Kills orphans, starts Webpack. |
| `.\start.ps1` | **PowerShell daily driver** — auto-cleanup + server launch |
| `.\startup.ps1` | **Full diagnostics** — 7-phase orchestration with health monitoring |
| `.\cleanup.ps1` | **Standalone cleanup** — kill zombies, free port, clear cache |
| `npm run dev` | **Fast** — predev hook auto-kills orphans, then starts Webpack |
| `npm run fresh` | **Nuke & rebuild** — kill + clean + db:sync + dev |
| `npm run build` | **Production build** — plain `next build`, no `--webpack` |
| `npm run build:webpack` | **Local build** — `next build --webpack` (not for Vercel) |

## Optimization Details

### next.config.ts
- Webpack filesystem cache enabled (7 days, gzip compression)
- Reduced `onDemandEntries` watcher settings for Windows
- `serverExternalPackages` for Prisma + bcryptjs

### Root Layout
- `BackgroundEffects` → lazy loaded via `next/dynamic` with `ssr: false`
- `AIAssistant` → lazy loaded via `next/dynamic` with `ssr: false`
- Navbar and Footer remain server components

### Prisma Schema Hash Cache
- `check-prisma.js` computes SHA-256 hash of `schema.prisma` and `seed.ts`
- Cached in `prisma/.schema-hash` and `prisma/.seed-hash`
- `npm run db:sync:fast` skips generate if hash unchanged
- Hash auto-updated after successful generate

# Prisma
- Singleton client at `src/lib/prisma.ts` with query timeout, auto-retry, auto-reconnect
- Automatic reconnection on connection loss (5 attempts with exponential jitter backoff)
- HMR-safe via `globalThis` caching with initialization tracking
- `prisma db push --accept-data-loss` for schema sync (not migrations)
- Database is **PostgreSQL** on Neon (not SQLite)
- Seed file at `prisma/seed.ts` (idempotent - skips if already seeded)
- `npm run db:sync` - Push schema + generate + seed

# Health & Diagnostics
- Health endpoint: `GET /api/health` - full system diagnostics with DB, auth, env, proxy, system checks
  - Returns 200 for healthy, 503 for degraded, 500 for unhealthy
  - Headers: `x-health-status`, `x-health-latency`, `x-app-version`
  - Checks: DB tables, auth config, env vars, system resources, proxy config
- `npm run diagnose` - Run CLI diagnostics (JSON output)
- `npm run diagnose:full` - Run diagnostics + health check
- `npm run health:check` - Quick health check against running server
- Runtime monitoring via `src/lib/startup-monitor.ts` (used by startup.ps1)
- Automatic crash detection and server restart (up to 3 times)

# Core Libraries
| File | Purpose |
|---|---|
| `src/lib/retry.ts` | Generic retry with exponential/jitter backoff |
| `src/lib/app-logger.ts` | Structured logging with levels, contexts, timing |
| `src/lib/startup-monitor.ts` | Runtime health monitor with crash detection |
| `src/lib/prisma.ts` | Singleton PrismaClient with middleware, timeout, auto-retry, auto-reconnect |
| `src/lib/diagnostics.ts` | Full system diagnostics report |
| `src/lib/api-utils.ts` | API utilities with logging, timing, error handling |
| `src/lib/env.ts` | Environment validation |
| `src/lib/auth.ts` | NextAuth v5 configuration with JWT |

# Known Stable Patterns
- proxy.ts for auth route protection (not middleware.ts)
- Webpack-based dev server with `next dev --webpack`
- Singleton PrismaClient via globalThis with query middleware and initialization tracking
- Prisma auto-reconnect on connection failure (5 attempts, jitter backoff)
- JWT-based auth sessions via next-auth v5 beta
- Auto-retry data fetching in useAdmin hook (3 retries, ref-based to avoid stale closures)
- Dashboard error boundaries with reload/re-login options
- AdminErrorBoundary class component wrapping admin layout
- Health check at `/api/health` returns 200/503/500 status
- Structured API errors with `serverErrorResponse` for dev/prod-safe stack traces

# API Patterns
- Use `apiHandler(handler, context)` or `withErrorHandling(handler, context)` for route handlers
- Use `requireAuth()` for protected routes (returns null or 401/500 response)
- Use `successResponse(data)` and `errorResponse(message, status, details)`
- Use `serverErrorResponse(err, context)` for internal errors (hides details in production)
- Use `safeQuery(queryFn, fallback, context)` for safe Prisma queries with fallback
- All routes use structured logging via `logger`

# Troubleshooting
If the dev server fails:
1. Run `.\startup.ps1` - full diagnostic startup with auto-recovery
2. Run `npm run fresh` - automatic cleanup + restart
3. Check `dev-startup.log` for startup errors
4. Check `http://localhost:3000/api/health` for system status
5. Run `npm run diagnose` for full system diagnostics

If database errors occur (P2021, drift):
1. Run `npm run db:sync` - regenerates everything
2. Run `.\startup.ps1 -SkipDev` to verify DB
3. Check that `prisma/dev.db` exists and is not corrupted

If auth issues (redirect loops, blank admin):
1. Clear cookies for localhost
2. Run `.\startup.ps1` to restart clean
3. Check proxy.ts configuration

# Auto-Recovery
- startup.ps1 automatically cleans stale lockfiles (`.next/lock`, `prisma/*.db-journal`)
- startup.ps1 automatically restarts server on crash (up to 3 attempts)
- Prisma client auto-retries failed queries with jitter backoff
- Prisma client auto-reconnects on connection loss (up to 5 attempts)
- Runtime monitor detects crashes and logs events
- Port 3000 is automatically freed on every startup
- All zombie node.exe processes are killed on every startup
- Server health polling with 75s timeout before failure declaration

# Database
- **Neon PostgreSQL** — production database at `ep-rough-lab-ao9rybtf.c-2.ap-southeast-1.aws.neon.tech`
- `DATABASE_URL` in `.env` points to Neon (NOT local SQLite)
- Schema provider: `postgresql` (NOT `sqlite`)
- Raw SQL queries use PostgreSQL syntax (quoted `"Table"`/`"column"`, `$1` params, `::type` casts, `to_char`/`::date` date functions)
- No local SQLite file — `prisma/dev.db` and journal files are removed
- `prisma db push --accept-data-loss` for schema sync (no migration files)
- Seed: `npm run db:seed` (idempotent)
- `check-prisma.js` hashes updated for PostgreSQL schema

# Vercel Deployment
- `vercel.json` created — Next.js framework preset
- Set these env vars in Vercel dashboard:
  - `DATABASE_URL` — Neon connection string
  - `NEXTAUTH_SECRET` — generate a secure random string
  - `NEXTAUTH_URL` — your Vercel deployment URL
- Build command: `npm run build` (plain `next build` — `--webpack` flag not supported on Vercel's Next.js 15.3.0)

# AI Assistant System (Redesigned Jun 2026)
- New Prisma models: `Package`, `KnowledgeItem`, `Inquiry`
- AI chat engine (`src/app/api/ai/chat/route.ts`): fetches 13 DB entities in parallel, classifies queries into 12 categories, smart retrieval with TF-IDF scoring + fuzzy matching + cross-referencing (service ↔ package), collects client inquiries via regex
- Smart retrieval system: `tokenize()` with stop word removal, `computeTfScore()` for term-frequency weighting, `levenshtein()` + `fuzzyMatch()` for typo-tolerant matching, `findRelevantService()` + `findRelevantPackage()` for cross-referencing
- Zero external AI dependencies — no OpenAI, Claude, Gemini, Pinecone, or any paid API/SDK. Pure PostgreSQL + Next.js
- Policy data fetched from `Setting` model (key-value pairs `company_policy`, `company_rules`, `company_commitment`) and used by `buildPoliciesResponse()`
- AI responses update automatically when dashboard data changes — no retraining required
- Admin pages: `/admin/ai` (dashboard), `/admin/ai/inquiries`, `/admin/ai/knowledge`, `/admin/ai/packages`, `/admin/ai/policies`, `/admin/ai-training`
- API routes: `/api/admin/inquiries`, `/api/admin/knowledge`, `/api/admin/packages`, `/api/admin/policies` (via `/api/settings`), `/api/admin/ai-config` (all with `[id]` variants where needed)
- `whitelistFields()` returns `Record<string, unknown>` — use `as any` when passing to `prisma.create()` (TS strictness)
- AI Assistant frontend (`src/components/AIAssistant.tsx`) unchanged — handles responses generically
- Sidebar: AI Assistant section includes Control Center, Inquiries, Knowledge Base, Packages, Policies, AI Settings
- Build verified: 90 pages, all routes generated, 0 errors

# Security Notes
- Never commit `.env` or secrets
- Admin credentials: anirban / Admin@123
- JWT sessions expire after 24 hours
- Protected routes redirect to /admin/login
- Health endpoint available without auth
- Session cookies: httpOnly, sameSite=lax, secure in production