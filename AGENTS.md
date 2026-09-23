# AGENTS.md — Guidance for AI coding agents

This file tells code assistants how to work in this repo. Read it at the start of every session.

## Before you start

1. Read `docs/memory.md` — environment, auth/deployment gotchas, decisions, and current work state.
2. Read `docs/PRD.md` — locked product direction & tenancy model.
3. Read `docs/ROADMAP.md` — phased tasks and checkboxes to tick as you complete work.

## Non-negotiables

- **Do not give multiple teachers access until Phase 1 multi-tenancy lands.** The app is currently single-tenant.
- **Never trust a client-supplied `ownerId`/`classId` for authorization.** The teacher must come from the session token.
- **Never commit `.env` or real secrets.** Real connection strings/keys live in the local `.env` (gitignored) and the Vercel env panel.
- **Attendance % = PRESENT ÷ recorded sessions** (see `docs/memory.md` §5). Use `getRecordedSessionIds` from `src/lib/attendance.ts`; do not re-implement or revert to "÷ all sessions".

## Verification commands (always run after changes)

| Task | Command |
|------|---------|
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Full check | `npm run typecheck && npm run lint` |

CI runs `quality` only (lint/typecheck/build). There is no Playwright in CI.

## Conventions

- TMS-native colors only (`bg-muted`, `text-primary`, `gradient-primary`). No SMIT blue/green accents.
- API envelope: `{ success, data, message, errors }`. Zod in `src/lib/validations.ts`. `ApiError` + `asyncHandler` in `src/lib/api-utils.ts`.
- Mongoose models in `src/models/*.ts`, exported via `src/models/index.ts`.
- On HTTPS, NextAuth `getToken()` needs `secureCookie` handling — see `src/lib/auth-helpers.ts`.

## Deployment

- Prod: `https://tms-app-psi-roan.vercel.app` (NOT `tms-app.vercel.app` — stale).
- Redeploy: `vercel --prod --yes` from project root.