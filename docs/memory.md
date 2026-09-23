# Project Memory & Decision Log

**Project:** Teacher Management System (TMS)
**Last updated:** September 23, 2026

---

## 1. What is this file

Working memory for the TMS project: environment, auth/deployment gotchas, decisions, and the current work state. Read this before starting any task; update it after anything meaningful changes. It is the single source of "how things are wired".

---

## 2. Environment

| Item | Value / Pointer |
|------|-----------------|
| Project root | `~`/…/`TMS/tms-app` |
| Stack | Next.js 16.2.10 · React 19 · TypeScript 5 · Tailwind v4 · shadcn/ui (base-nova) · Mongoose 9 · NextAuth v5 (beta.31) · Zod 4 · Recharts 3 · Playwright |
| Database | MongoDB Atlas (shared by local + prod). Real URI lives in `.env` (gitignored) — never paste into committed files or commit `.env`. |
| AI | Groq API. Model: `openai/gpt-oss-120b` (set in `src/lib/constants.ts` → `AI_CONFIG.MODEL`). Key lives in `.env` / Vercel env panel. |
| Scripts | `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` (tsc --noEmit) · `npm run db:seed` (tsx prisma/seed.ts) |

### Vercel production
- Vercel account `qaziaaaa`; project `tms-app` (linked via `.vercel/project.json`).
- **Production URL: `https://tms-app-psi-roan.vercel.app`** (alias target — always use this).
- `https://tms-app.vercel.app` is STALE and 404s — never use it.
- Redeploy with: `vercel --prod --yes` from the project dir.
- Env vars set on Vercel (Production): `MONGODB_URI`, `GROQ_API_KEY`, `NEXTAUTH_URL` (psi-roan), `AUTH_URL` (psi-roan), `AUTH_SECRET` (= NEXTAUTH_SECRET value), `NEXTAUTH_SECRET` (= same), `AUTH_TRUST_HOST=true`.

---

## 3. Credentials (demo/seed — safe to document)

| Role | Email | Password |
|------|-------|----------|
| Teacher | `teacher@tms.edu` | `password123` |
| Student | `firstname + last3-digits-of-roll + "@uop.edu"` | `student123`, `mustChangePassword: true` |

Examples: `fatima102@uop.edu`, `farhan301@uop.edu`, `ahmed101@uop.edu`.
⚠ `ahmed101@uop.edu` password was changed during an earlier test — no longer works with `student123`.
Roll patterns: `SE-01-01…` · `AI-02-01…` · `DS-03-01…`.

---

## 4. Auth & deployment gotchas (do not forget)

### 4.1 Secure session cookie
On HTTPS, NextAuth issues the cookie named **`__Secure-authjs.session-token`**. `getToken()` from `next-auth/jwt` defaults to the non-secure cookie name/salt, so callers MUST pass `secureCookie: true` when on HTTPS. This was the root cause of "login works but everything 401s" in prod.

- Fixed in `src/proxy.ts` (`authToken()` helper detects `__Secure-` cookie) and `src/lib/auth-helpers.ts` (`requireAuth`/`requireRole`). Refer to these patterns; never call `getToken()` without the secureCookie handling.

### 4.2 Secret resolution
`next-auth` v5 resolves the secret as `AUTH_SECRET ?? NEXTAUTH_SECRET`. Both are set to the same value in prod. `AUTH_TRUST_HOST=true` is required so redirects point to the right host.

### 4.3 Cross-env DB
Local and prod share the same Atlas DB. Anything you seed locally is visible in prod and vice versa. Be careful with destructive actions.

---

## 5. Attendance semantics (LOCKED, fixed Sep 2026)

- **Attendance % = PRESENT records ÷ recorded sessions.**
- "Recorded session" = a class session having ≥ 1 `AttendanceRecord`. Sessions created but never marked (0 records) are excluded from every percentage — they do not punish students.
- Applied consistently in: teacher class detail, class list average, dashboard averages, reports, AI insights, AND student portal.
- Helper: `src/lib/attendance.ts` → `getRecordedSessionIds(classId)` (distinct `sessionId`s from `AttendanceRecord` for that class's sessions).
- This made teacher and student views identical for the same student (verified: Farhan Ali = 100% in both).

---

## 6. Conventions

- **Colors:** keep TMS-native colors (`bg-muted`, `text-primary`, `gradient-primary`, hsl theme vars). DO NOT introduce SMIT blue/green accents. Student portal color reversion (`bg-clr-blue-bg` → `bg-muted`) is still pending on some pages.
- **API envelope:** `{ success, data, message, errors }` (see `docs/API.md`).
- **Validation:** Zod schemas in `src/lib/validations.ts`.
- **Errors:** `ApiError` + `asyncHandler` in `src/lib/api-utils.ts`.
- **Models:** Mongoose, uppercase first-letter models, re-exported via `src/models/index.ts`.
- **Verification for every change:** `npm run typecheck` && `npm run lint`. CI only runs `quality` (lint/typecheck/build) — Playwright E2E job was removed.

---

## 7. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| Sep 2026 | Teacher account = tenant; NO teams/orgs | Simplest model for <50 teachers |
| Sep 2026 | Per-teacher student portal maintained | No cross-teacher collaboration needed |
| Sep 2026 | Phase 1 (multi-tenancy) MUST ship before signup/billing/landing | Isolation is a prerequisite |
| Sep 2026 | DON'T give multiple teachers access until Phase 1 | App is still single-tenant |
| Sep 2026 | Attendance % uses recorded sessions only | Fixes teacher↔student mismatch |
| Sep 2026 | CI runs quality only (no Playwright) | User: "fully remove it" |
| Sep 2026 | Groq model = `openai/gpt-oss-120b` | Old `groq/compound-mini` invalid |

---

## 8. Work state

### Completed
- Deployment wired & verified on Vercel (psi-roan). Prod login (3 bugs) fixed: redirect host, secret mismatch, secure-cookie.
- Groq AI working. Attendance % consistency fix shipped (teacher == student views).
- Responsive mobile UI merged (PR #2). CI quality-only.

### Next up
1. **Phase 1 multi-tenancy** — see `docs/ROADMAP.md`. Start with schema (`ownerId`), then services, then routes, then seed/migration, then verify isolation.

### Blockers
- None currently.

---

## 9. Cross-references

- Product direction: `docs/PRD.md` 🔒 (decisions locked)
- Step-by-step tasks: `docs/ROADMAP.md`
- Functional requirements: `docs/SRS.md`
- Architecture: `docs/SAD.md` · API: `docs/API.md` · Schema: `docs/DATABASE.md` · Deploy: `docs/DEPLOYMENT.md` · Tests: `docs/TEST-PLAN.md`