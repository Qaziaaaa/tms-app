# Test Plan

**Project:** Teacher Management System (TMS)
**Version:** 1.0
**Date:** August 2026

---

## 1. Testing Strategy

### 1.1 Test Levels

| Level | Tool | Scope | Status |
|-------|------|-------|--------|
| Unit Tests | — | Individual functions | Not implemented |
| API Integration | Playwright | Full HTTP request/response lifecycle | Implemented (15 spec files) |
| E2E UI Tests | Playwright | Browser-based user workflows | Implemented (7 spec files) |
| Manual Testing | Browser | Visual/UX verification | Recommended |

### 1.2 Test Environment

- **Framework:** Playwright 1.62
- **Browser:** Chromium only (single browser for speed)
- **Server:** Next.js dev server on port 3000
- **Database:** MongoDB `tms` database (cleared before each test run)
- **Retry:** 2 retries on failure
- **Workers:** 1 (sequential execution)

---

## 2. Test Scenarios

### 2.1 Authentication Tests (`auth.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| AUTH-01 | Login with valid teacher credentials | 200, session cookie set |
| AUTH-02 | Login with valid student credentials | 200, session cookie set |
| AUTH-03 | Login with invalid password | 401 error |
| AUTH-04 | Login with non-existent email | 401 error |
| AUTH-05 | Access protected route without auth | Redirect to /login |
| AUTH-06 | Access teacher route as student | Redirect to /login |
| AUTH-07 | Access student route as teacher | Redirect to /login |
| AUTH-08 | Sign out | Session cookie cleared |

### 2.2 Class Management Tests (`classes.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| CLS-01 | GET /api/classes returns all classes | 200, array of classes |
| CLS-02 | POST /api/classes creates a class | 201, class object returned |
| CLS-03 | POST /api/classes with missing fields | 400 validation error |
| CLS-04 | GET /api/classes/:id returns class with students | 200, class object |
| CLS-05 | PUT /api/classes/:id updates class | 200, updated class |
| CLS-06 | DELETE /api/classes/:id deletes class | 200, success |
| CLS-07 | DELETE non-existent class | 404 error |

### 2.3 Student Management Tests (`students.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| STU-01 | GET /api/students returns paginated list | 200, paginated response |
| STU-02 | GET /api/students?classId=X filters by class | 200, filtered results |
| STU-03 | POST /api/students creates student | 201, student object |
| STU-04 | POST /api/students with duplicate roll number in class | 409 or error |
| STU-05 | PUT /api/students/:id updates student | 200, updated student |
| STU-06 | DELETE /api/students/:id deletes student | 200, success |
| STU-07 | POST /api/students/bulk imports multiple students | 201, import count |

### 2.4 Attendance Tests (`attendance.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| ATT-01 | GET /api/attendance/sessions returns sessions | 200, array |
| ATT-02 | POST /api/attendance/sessions creates session | 201, session object |
| ATT-03 | POST duplicate session (same class + date) | 409 error |
| ATT-04 | POST /api/attendance/records saves attendance | 200, updated records |
| ATT-05 | GET /api/attendance/sessions/:id returns session with records | 200 |
| ATT-06 | DELETE /api/attendance/sessions/:id cascades to records | 200 |

### 2.5 Assignment Tests (`assignments.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| ASG-01 | GET /api/assignments returns assignments | 200, array |
| ASG-02 | POST /api/assignments creates assignment + NOT_SUBMITTED records | 201 |
| ASG-03 | POST /api/assignments/:id/submissions saves grades | 200 |
| ASG-04 | PUT /api/assignments/:id updates assignment | 200 |
| ASG-05 | DELETE /api/assignments/:id cascades to submissions | 200 |

### 2.6 Report Tests (`reports.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| RPT-01 | GET /api/reports?type=attendance&classId=X | 200, attendance report |
| RPT-02 | GET /api/reports?type=submissions&classId=X | 200, submissions report |
| RPT-03 | GET /api/reports with missing params | 400 error |
| RPT-04 | GET /api/reports with invalid type | 400 error |

### 2.7 API Integration Tests (`api.spec.ts`)

Full CRUD lifecycle tests that exercise multiple endpoints in sequence:
- Create class → create students → create session → mark attendance → create assignment → grade → report

### 2.8 E2E UI Tests

| Test File | Scenario |
|-----------|----------|
| `e2e-classes.spec.ts` | Login → navigate to classes → create/edit/delete class via UI |
| `e2e-students.spec.ts` | Login → navigate to students → create/edit/delete student via UI |
| `e2e-attendance.spec.ts` | Login → create session → mark attendance → verify records |
| `e2e-assignments.spec.ts` | Login → create assignment → grade submissions → verify |
| `e2e-reports.spec.ts` | Login → navigate to reports → view attendance/submission reports |
| `e2e-insights.spec.ts` | Login → navigate to insights → request AI analysis |
| `e2e-edge-cases.spec.ts` | Edge cases: empty states, error states, boundary conditions |

### 2.9 Navigation Tests (`navigation.spec.ts`)

| Test ID | Scenario | Expected Result |
|---------|----------|----------------|
| NAV-01 | Click each sidebar link | Correct page loads |
| NAV-02 | Browser back button | Previous page loads |
| NAV-03 | Direct URL access | Correct page loads (with auth) |

---

## 3. Test Data Setup

### 3.1 Global Setup (`tests/globalSetup.ts`)

- Connects to test database
- Clears all collections
- Seeds test data (teacher, students, classes)
- Currently uses Prisma/SQLite — needs migration to Mongoose/MongoDB

### 3.2 Test Fixtures (`tests/fixtures.ts`)

```typescript
// Login via API and return session cookie
loginAPI(email, password) → request.cookieJar()

// Login via browser and return authenticated page
loginBrowser(page, email, password) → void
```

---

## 4. Running Tests

### 4.1 Prerequisites

1. MongoDB running locally
2. `npm install` completed
3. Seed the database: `npx tsx prisma/seed.ts`

### 4.2 Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

### 4.3 CI Configuration

```bash
# Environment variables
CI=true PORT=3000

# Playwright config (playwright.config.ts)
- testDir: ./tests
- retries: 2
- workers: 1
- browser: Chromium only
```

---

## 5. Test Coverage Matrix

| Feature | API Tests | E2E Tests | Manual |
|---------|-----------|-----------|--------|
| Authentication | Yes | Partial | Yes |
| Class CRUD | Yes | Yes | Yes |
| Student CRUD | Yes | Yes | Yes |
| Bulk Import | Yes | No | Yes |
| Attendance | Yes | Yes | Yes |
| Assignments | Yes | Yes | Yes |
| Reports | Yes | Yes | Yes |
| AI Insights | No | Yes | Yes |
| Student Portal | No | No | Yes |
| Dashboard | No | No | Yes |

---

## 6. Known Test Issues

1. **globalSetup.ts uses Prisma/SQLite** — The test setup was written for a previous Prisma-based architecture. It needs to be migrated to use Mongoose/MongoDB to match the current application.

2. **Student portal not covered** — No API or E2E tests exist for the student portal endpoints (`/api/student/*`).

3. **AI insights tests depend on Groq API** — E2E tests for AI features require a valid `GROQ_API_KEY` and internet access.

---

## 7. Test Quality Criteria

| Criterion | Target | Current |
|-----------|--------|---------|
| API endpoint coverage | 100% | ~90% (missing student portal) |
| E2E critical path coverage | 80% | ~70% |
| Auth flow coverage | 100% | Yes |
| CRUD operation coverage | 100% | Yes |
| Error state coverage | 80% | Partial |
| Edge case coverage | 60% | Partial |
