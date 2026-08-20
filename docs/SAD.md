# Software Architecture Document (SAD)

**Project:** Teacher Management System (TMS)
**Version:** 1.0
**Date:** August 2026

---

## 1. Architecture Overview

TMS follows a **monolithic full-stack architecture** using Next.js App Router, where the frontend and backend share a single deployment unit. The system uses a **layered architecture** with clear separation between presentation, business logic, and data access.

```
┌─────────────────────────────────────────────────┐
│                  Presentation                    │
│         Next.js App Router Pages + UI           │
│    React Components, shadcn/ui, Recharts        │
├─────────────────────────────────────────────────┤
│                  API Layer                       │
│         REST Route Handlers (/api/*)            │
│    asyncHandler, Zod validation, auth guards    │
├─────────────────────────────────────────────────┤
│               Service Layer                     │
│         Business Logic Services                 │
│    8 service files, ~30 functions               │
├─────────────────────────────────────────────────┤
│               Data Access Layer                 │
│         Mongoose Models + Connection            │
│    7 schemas, connection caching                │
├─────────────────────────────────────────────────┤
│               External Services                 │
│         MongoDB, Groq API (optional)            │
└─────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Runtime | Node.js | Required by Next.js |
| Framework | Next.js 16 (App Router) | Server-side rendering, API routes, file-based routing |
| Language | TypeScript 5 | Type safety across frontend and backend |
| UI Library | React 19 | Component-based UI with hooks |
| CSS | Tailwind CSS v4 | Utility-first styling, fast development |
| Component Library | shadcn/ui (base-nova) | Accessible, customizable, copy-paste components |
| Database | MongoDB | Document store for flexible schema |
| ODM | Mongoose 9 | Schema validation, middleware, query building |
| Auth | NextAuth.js v5 (beta) | JWT-based authentication with role support |
| Charts | Recharts 3 | Declarative React charting |
| Forms | React Hook Form + Zod | Performant forms with schema validation |
| AI | Groq API (llama-3.1-8b-instant) | Fast LLM inference for student insights |

### 2.2 Deployment Model

- **Single deployment unit** via Next.js (frontend + API in one process)
- **Self-hosted MongoDB** or MongoDB Atlas for data persistence
- **Vercel-compatible** (serverless functions) or Node.js server
- **No separate frontend/backend** deployments

---

## 3. Architectural Patterns

### 3.1 Service Layer Pattern

Every API route delegates business logic to a dedicated service function:

```
Route Handler → Service Function → Mongoose Model → MongoDB
```

Services are pure async functions (not classes) that:
- Accept typed parameters
- Use `connectDB()` for database access
- Throw `ApiError` for business rule violations
- Return typed data (never raw Mongoose documents — use `.lean()`)

### 3.2 API Envelope Pattern

All API responses follow a consistent envelope:

```typescript
// Success
{ success: true, data: T, message: string, errors: [] }

// Error
{ success: false, data: null, message: string, errors: string[] }
```

This enables uniform error handling on the frontend via `useFetch` and `useMutation` hooks.

### 3.3 Middleware/Proxy Pattern

Authentication and role-based routing are handled by a proxy middleware (`src/proxy.ts`):

1. Public routes bypass auth (`/login`, `/api/auth/*`, `/_next/*`)
2. Unauthenticated requests → redirect to `/login` (pages) or JSON 401 (API)
3. Role checks prevent cross-portal access (teacher routes blocked for students, and vice versa)

### 3.4 Role-Based Access Control (RBAC)

| Role | Accessible Routes | Capabilities |
|------|------------------|-------------|
| `teacher` | `/dashboard`, `/classes`, `/students`, `/attendance`, `/assignments`, `/reports`, `/insights` | Full CRUD + reports + AI |
| `student` | `/student/*` | Read-only + password change |

API routes enforce roles via `requireRole(request, "teacher")` or `requireRole(request, "student")` helper.

---

## 4. Component Architecture

### 4.1 Layout Hierarchy

```
RootLayout
└── Providers (SessionProvider, Toasters)
    ├── LoginPage (standalone, no shell)
    └── AppShell (Teacher: Sidebar + Header + Content)
    └── StudentShell (Student: StudentSidebar + Header + Content)
```

### 4.2 Component Inventory

| Category | Components | Count |
|----------|-----------|-------|
| Layout | AppShell, Sidebar, Header, StudentShell, StudentSidebar | 5 |
| UI (shadcn) | Button, Card, Dialog, Input, Select, Table, Tabs, etc. | 20 |
| Custom | DataTable, ConfirmDialog, Breadcrumb, PageLayout, Charts | 6 |
| Providers | Providers (Session + Toasters) | 1 |

### 4.3 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth()` | Wraps `useSession()`, exposes `isTeacher`, `isStudent`, `isAuthenticated` |
| `useFetch<T>(url)` | Auto-fetching GET requests with loading/error state |
| `useMutation<TBody, TResult>()` | POST/PUT/DELETE requests with loading/error state |
| `useForm<T>({ initialValues, validate, onSubmit })` | Form state management with validation |

---

## 5. Data Architecture

### 5.1 Entity Relationship Diagram

```
User (1) ──(optional)──> (1) Student
                               │
Class (1) ─────────────────> (N) Student
  │                               │
  ├──> (N) AttendanceSession ──> (N) AttendanceRecord <── (N) Student
  │
  └──> (N) Assignment ──> (N) AssignmentSubmission <── (N) Student
```

### 5.2 Database Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ID generation | MongoDB ObjectId | Native, unique, time-ordered |
| Timestamps | Mongoose `timestamps: true` | Automatic createdAt/updatedAt |
| References | ObjectId refs (not embedded) | Normalized for update performance |
| Queries | `.lean()` everywhere | 2-5x performance for read-heavy operations |
| Connection | Global cached singleton | Prevents multiple connections in dev hot-reload |

### 5.3 Indexes

| Collection | Index | Type |
|-----------|-------|------|
| User | `email` | Unique |
| Student | `classId + rollNumber` | Unique compound |
| Student | `userId`, `email` | Sparse |
| AttendanceSession | `classId + date` | Unique compound |
| AttendanceRecord | `sessionId + studentId` | Unique compound |
| AssignmentSubmission | `assignmentId + studentId` | Unique compound |

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
1. User submits email/password to POST /api/auth/callback/credentials
2. NextAuth Credentials provider validates against bcrypt hash
3. JWT token created with { id, role } payload
4. Token stored in HTTP-only cookie
5. Subsequent requests validated by getToken() in proxy + auth-helpers
```

### 6.2 Authorization Flow

```
Request → proxy.ts (role check) → Route Handler → requireRole() (double-check) → Service
```

Two-layer authorization ensures:
1. **Proxy layer** blocks unauthorized page/navigation access
2. **API layer** blocks unauthorized API calls (defense in depth)

### 6.3 Input Validation

All API inputs validated via Zod schemas in `src/lib/validations.ts`:
- Required field checks
- String length constraints
- Enum value validation
- Type coercion for numeric/boolean fields

### 6.4 Password Security

- Bcrypt hashing with 10 salt rounds
- Password change requires current password verification
- Passwords never returned in API responses

---

## 7. Error Handling Architecture

### 7.1 API Error Handling

```
Service throws ApiError → asyncHandler catches → sendError(statusCode, message, errors[])
Unknown error → asyncHandler catches → sendError(500, "Internal Server Error")
```

### 7.2 Frontend Error Handling

| Layer | Mechanism |
|-------|----------|
| API responses | `useFetch` / `useMutation` hooks expose `error` state |
| Route-level | `error.tsx` boundary with retry button |
| Loading states | `loading.tsx` and inline Skeleton components |
| Form validation | Zod schemas + `useForm` hook error display |

---

## 8. AI Integration Architecture

### 8.1 Data Flow

```
Teacher selects class → /api/ai?classId=X → getAIInsights(classId)
  → getClassDataForAI(classId) → Aggregates student attendance + submissions
  → callGroq(prompt) → Groq API (llama-3.1-8b-instant)
  → Parse response → ClassInsight with StudentInsight[] → Return to frontend
```

### 8.2 Risk Classification

| Risk Level | Criteria |
|-----------|----------|
| High | Attendance < 40% OR submission rate < 30% |
| Medium | Attendance < 60% OR submission rate < 50% |
| Low | All other students |

---

## 9. Scalability Considerations

| Concern | Current Approach | Future Improvement |
|---------|-----------------|-------------------|
| Student list pagination | Implemented | Already supports page/pageSize |
| DB queries | Indexed fields, `.lean()` | Consider read replicas for high load |
| API rate limiting | Not implemented | Add rate limiter middleware |
| Caching | DB connection caching only | Add Redis for session/dashboard caching |
| Frontend performance | SSR + client hydration | Implement ISR for static pages |

---

## 10. Known Limitations

1. **Single-tenant** — No multi-institution support
2. **No real-time** — No WebSocket subscriptions for live updates
3. **No file uploads** — Assignments are text-only; no file submission
4. **No audit trail** — No history of who changed what and when
5. **No soft delete** — Permanent deletion only
6. **AI depends on external API** — Groq API required for insights feature
7. **NextAuth v5 beta** — Using beta version with potential breaking changes
