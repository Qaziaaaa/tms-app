# Roadmap & Implementation Plan

**Project:** Teacher Management System (TMS)
**Version:** 2.0
**Date:** September 2026

Status legend: ✅ done · 🔲 pending · 🚧 in progress

---

## Phase 0 — Current State (single-tenant) ✅

Shipped and deployed to Vercel (see `docs/DEPLOYMENT.md` and `docs/PRD.md §4 Phase 0`).

| Area | Status | Notes |
|------|--------|-------|
| Teacher + student auth | ✅ | NextAuth v5 JWT, seed teacher + student users |
| Classes / Students / Attendance / Assignments | ✅ | Full CRUD, bulk import |
| Reports + AI insights | ✅ | Charts + Groq |
| Student portal | ✅ | Attendance %, assignments, grades, password |
| Responsive mobile UI | ✅ | Bottom nav added Sep 2026 |
| Attendance % consistency fix | ✅ | `getRecordedSessionIds` (Sep 2026) |

---

## Phase 1 — Multi-tenancy (`ownerId` scoping) 🔲 | **NEXT — must ship before Phase 2/3/4**

### 1.1 Schema & models
- [ ] Add `ownerId` (ObjectId, ref `User`) to: `Class`, `Student`, `Assignment`, `AttendanceSession`, `AttendanceRecord`.
- [ ] Index all by `{ ownerId: 1, <natural-key>: 1 }`.
- [ ] Update Mongoose model interfaces + schemas (`src/models/*.ts`).

### 1.2 Service layer (the source of truth — never trust client-supplied ownerId)
- [ ] `src/services/class.service.ts` — require `ownerId` on create; all queries filter `{ _id, ownerId }`; list filters by owner.
- [ ] `src/services/student.service.ts` — same; bulk import stamps owner from session.
- [ ] `src/services/attendance.service.ts` — sessions & records scoped via their class's owner.
- [ ] `src/services/assignment.service.ts` — scoped via class owner.
- [ ] `src/services/report.service.ts` — reports only over the teacher's classes.
- [ ] `src/services/ai.ts` — AI only sees the teacher's classes/data.
- [ ] `src/services/dashboard.service.ts` — all counts per teacher.
- [ ] `src/services/student-portal.service.ts` — resolve class ownership transitively (class → owner).

### 1.3 API routes
- [ ] Every route passes the authed teacher's id into the service (from token, not request body).
- [ ] No route should trust `classId`/`id` from body without owner validation.

### 1.4 UI/pages (no cross-tenant leakage)
- [ ] All pages already fetch per-item by id; re-verify each list page filters by owner.
- [ ] Student portal pages unaffected structurally (class resolves via student record).

### 1.5 Migration & seed
- [ ] One-time backfill: `ownerId = <seeded teacher id>` for all existing docs.
- [ ] Update `prisma/seed.ts` to stamp `ownerId` on everything it creates.
- [ ] Add `ownerId` to seed student users' `Student` docs.

### 1.6 Verification / DoD
- [ ] Create teacher B; confirm B sees zero data from A.
- [ ] Confirm guessing another teacher's object ids returns 404/403.
- [ ] Student of teacher A cannot view/patch anything via teacher B's session.

---

## Phase 2 — Signup + Admin 🔲

- [ ] `/signup` route + API: create teacher account (name, email, password), auto-tenant.
- [ ] Login links to signup; signup links to login.
- [ ] `/admin` route + role: list all teachers, suspend/activate.
- [ ] Admin gating: dedicated admin role (single platform owner) seeded via env (`ADMIN_EMAIL`).

---

## Phase 3 — Billing (Stripe) 🔲

- [ ] Stripe subscription for teachers (monthly + yearly).
- [ ] Free tier decision (open question).
- [ ] Graceful suspend for non-paying tenants (read-only or blocked).
- [ ] Webhooks: created/canceled/expired/updated.

---

## Phase 4 — Landing page + routes 🔲

- [ ] Marketing landing at `/` (features, pricing, CTA).
- [ ] App routes under `/app/...` or app gated while `/` is public.
- [ ] Design: keep TMS-native colors (do NOT add SMIT blue/green).

---

## Deferred / Backlog

- [ ] Finish TMS color reversion on student portal pages (`bg-clr-blue-bg` → `bg-muted`).
- [ ] Assignment late-penalty grading.
- [ ] Reports export (PDF/CSV).
- [ ] Attendance templates / reusable session profiles.