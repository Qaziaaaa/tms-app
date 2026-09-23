# Product Requirements Document (PRD)

**Project:** Teacher Management System (TMS)
**Version:** 2.0 (product direction decided in planning)
**Date:** September 2026
**Author:** Product + Engineering (Qazi)

---

## 1. Product Overview

### 1.1 Vision

TMS is a lightweight classroom-management web app that lets **individual teachers** master their own classes: attendance, assignments, grades, reports, and AI insights — plus a self-service student portal per teacher. It is a SaaS-productizable tool where **each teacher account is its own tenant**.

### 1.2 Mission

Give one teacher complete ownership of their classroom data with zero setup friction, a focus on speed (<50 teachers scale), and clear monetization path (Stripe billing) once multi-tenancy ships.

### 1.3 Problem Statement

Currently the app is single-tenant: all data (classes, students, attendance) is global and belongs to one hardcoded institution. Any second teacher who logs in would see each other's data. This blocks:
- Multiple teachers using the product
- Self-serve signup
- Billing
- A public landing page

---

## 2. Tenancy & Scaling Decisions (LOCKED)

These were explicitly decided in planning. Do not re-litigate without a product change.

| Decision | Chosen model | Why |
|----------|-------------|-----|
| Tenancy model | **Teacher Account = the tenant** (per-teacher `ownerId` scoping) | Simplest correct model |
| Teams / org model | **NO** teams, orgs, workspaces | Out of scope; over-engineering |
| Multi-teacher student portal | **Keep per-teacher portal** (each teacher runs their own students) | No cross-teacher collaboration |
| Target scale | **<50 teachers** per instance | Justifies simple `ownerId` scoping; no sharding or org admin needed |
| Data ownership | Teacher owns all records they create (`ownerId` on every record) | Enables deletion, reporting, billing |
| Migration path | Current single-tenant data adopts the seeded teacher's `ownerId` | Zero data loss on rollout |

### 2.1 Guardrails

- **DO NOT** give multiple teachers access to the app until Phase 1 (multi-tenancy) ships.
- **Phase 1 MUST ship before** billing, signup, admin, or landing page.
- The live seeded teacher (`teacher@tms.edu`) is the implicit owner of all existing data.

---

## 3. Personas

### 3.1 Primary Persona — Teacher

- Age 25–50, university instructor or college lecturer.
- Manages 1–5 classes, 5–150 students total.
- Wants: mark attendance fast, grade assignments, see who is at risk.
- Pain point: spreadsheets and paper registers.
- **Per-teacher plan:** all features (classes, students, attendance, assignments, reports, AI).

### 3.2 Secondary Persona — Student

- Reads own attendance %, assignments, submissions, grades.
- Forced password change on first login.
- **Per-teacher scope:** only sees their own teacher's class.

### 3.3 Future Persona — Site Admin (after Phase 2)

- Sees all tenants (teachers), can block/suspend, manage platform.
- Sees billing status per teacher.

---

## 4. Feature Phases

### Phase 0 — Current (shipped, single-tenant)
- Teacher login (seeded account only)
- Classes CRUD, Students CRUD + bulk import, Attendance sessions/records
- Assignments + grading, Reports, AI insights
- Student portal (per-class), password change
- Responsive mobile UI (bottom nav)

### Phase 1 — Multi-tenancy (`ownerId` scoping) — **NEXT, MUST SHIP BEFORE ALL ELSE**

Goal: every teacher sees only their own data.

| # | Requirement |
|---|-------------|
| 1.1 | Add `ownerId` (ref User, teacher) to: Class, Student, Assignment, AttendanceSession, AttendanceRecord |
| 1.2 | Every create writes `ownerId` from the authed teacher |
| 1.3 | Every read/update/delete filters by `ownerId` AND (where relevant) ID for object-level safety |
| 1.4 | All service-layer functions take/validate the current teacher (no trusting client-supplied ownerId) |
| 1.5 | All API routes resolve the teacher from the session, not from the body/query |
| 1.6 | AI insights and reports are scoped to the teacher's classes |
| 1.7 | Student portal resolves its class via the student's `classId`, which must belong to the student's teacher |
| 1.8 | Global/system counters (dashboard "total classes" etc.) become per-teacher counts |
| 1.9 | Migration: backfill existing docs with the seeded teacher's `ownerId` |
| 1.10 | Seed script creates `ownerId` going forward |
| 1.11 | Lists/pages (classes, students, attendance, assignments, reports, dashboard) filter by `ownerId` |

**Definition of done:** two distinct teacher accounts see disjoint dashboards; student A of teacher B cannot be read by teacher C even by guessing IDs.

### Phase 2 — Self-serve signup + Admin + Public product
- Teacher self-signup at `/signup` (name, email, password) → becomes a tenant.
- `/admin` dashboard (single platform owner): list teachers, activate/suspend.
- Optional: `/admin` is gated by role, created via env-configured admin email(s) initially.

### Phase 3 — Billing (Stripe) + Monetization
- Stripe subscription per teacher (e.g., monthly/yearly plan).
- Free tier optional. Suspend non-paying tenants gracefully.
- Webhooks for lifecycle events (created/canceled/expired).

### Phase 4 — Landing page & routes restructure
- Public marketing landing at `/`.
- Move the app under `/app/...` (or keep `/dashboard` etc. gated while landing lives at `/`).
- Marketing sections: features, pricing, signup CTA.

---

## 5. Functional Requirements by Domain

See `docs/SRS.md` for the full ID-tagged requirements. This section records the **decisions and priorities** only.

| Domain | Must (P0) | Should (P1) |
|--------|-----------|-------------|
| Auth | Teacher+student login, bcrypt, roles, forced-password-change | Self-signup (Phase 2), rate limiting |
| Classes | CRUD, roster, per-class stats | Schedule range |
| Students | CRUD, bulk JSON import, unique roll per class | CSV export |
| Attendance | Sessions, mark P/A/L, history, delete cascade | Reusable templates |
| Assignments | CRUD, auto NOT_SUBMITTED, grading | Late-with-penalty |
| Reports | Attendance + submission reports per class | Export PDF/CSV |
| AI insights | Risk analysis, cram detection (Groq) | Scheduled digests |
| Student portal | Own attendance/assignments/grades/password | Notifications |

---

## 6. Attendance Semantics (LOCKED — bug fixed Sep 2026)

- **Attendance % = PRESENT records ÷ recorded sessions.**
- A "recorded session" = a class session that has ≥ 1 `AttendanceRecord`.
- Sessions created but never marked (0 records) do **not** count against students and are excluded from every percentage (teacher detail, class list, dashboard average, reports, AI insights, student portal).
- Implemented via `src/lib/attendance.ts` → `getRecordedSessionIds(classId)`.
- This made teacher and student portals agree (e.g. Farhan Ali = 100% in both).

---

## 7. Non-Goals

- NO teams/orgs/workspaces/multi-class-per-student collaboration
- NO mobile native apps
- NO offline mode
- NO LMS integrations (Moodle/Canvas)
- NO cross-teacher student sharing
- NO role hierarchies beyond teacher/student/admin

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Time from signup → first class created | < 2 min (Phase 2) |
| Teachers per instance | up to 50 supported |
| Attendance % consistency teacher↔student | always identical |
| Page load (dashboard) | < 3 s |

---

## 9. Open Questions (for later)

- Free tier vs paid-only for Stripe (Phase 3)
- Whether `/admin` needs a dedicated role or env-var email allowlist
- Landing page copy/branding (Phase 4)