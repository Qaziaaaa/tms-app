# Software Requirements Specification (SRS)

**Project:** Teacher Management System (TMS)
**Version:** 1.0
**Date:** August 2026

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for the Teacher Management System (TMS), a web application designed to streamline classroom management tasks for teachers and provide students with self-service access to their academic records.

### 1.2 Scope

TMS enables teachers to manage classes, track student attendance, create and grade assignments, generate performance reports, and receive AI-powered insights. Students can view their own attendance, assignments, grades, and manage their password through a dedicated portal.

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| Teacher | A user with full CRUD access to all system data |
| Student | A user with read-only access to their own data plus password management |
| Session | An attendance tracking instance for a specific class on a specific date |
| Submission | A student's record of turning in an assignment |

---

## 2. Overall Description

### 2.1 Product Perspective

TMS is a standalone web application built on Next.js 16 with a MongoDB backend. It operates as a single-tenant system where all data belongs to one educational institution.

### 2.2 User Classes

| Role | Capabilities | Access Level |
|------|-------------|-------------|
| Teacher | Full CRUD on classes, students, attendance, assignments; view reports; generate AI insights | All teacher portal features |
| Student | View own profile, attendance, assignments, grades; change own password | Student portal only |

### 2.3 Operating Environment

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ runtime
- MongoDB 6+ database

### 2.4 Constraints

- Single-tenant architecture (one institution per deployment)
- No offline capability
- No mobile native apps (responsive web only)
- AI insights require Groq API key

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-01 | Users shall authenticate via email and password | Must |
| FR-AUTH-02 | Passwords shall be hashed using bcrypt (10 rounds) | Must |
| FR-AUTH-03 | JWT tokens shall be used for session management | Must |
| FR-AUTH-04 | The system shall redirect unauthenticated users to `/login` | Must |
| FR-AUTH-05 | Teachers shall only access teacher portal routes | Must |
| FR-AUTH-06 | Students shall only access student portal routes | Must |
| FR-AUTH-07 | Authenticated users visiting `/login` shall be redirected to their dashboard | Should |

### 3.2 Class Management (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-CLS-01 | Teacher shall create classes with name, department, batch, and optional schedule | Must |
| FR-CLS-02 | Teacher shall view all classes with student counts | Must |
| FR-CLS-03 | Teacher shall view a class's student roster | Must |
| FR-CLS-04 | Teacher shall update class details | Must |
| FR-CLS-05 | Teacher shall delete a class | Must |

### 3.3 Student Management (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-STU-01 | Teacher shall create students with roll number, name, and class | Must |
| FR-STU-02 | Teacher shall view paginated student list with class filtering | Must |
| FR-STU-03 | Teacher shall update student details | Must |
| FR-STU-04 | Teacher shall delete a student | Must |
| FR-STU-05 | Teacher shall bulk-import students via JSON array | Should |
| FR-STU-06 | Roll numbers shall be unique within a class | Must |

### 3.4 Attendance Management (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-ATT-01 | Teacher shall create attendance sessions per class and date | Must |
| FR-ATT-02 | Duplicate sessions for the same class and date shall be rejected | Must |
| FR-ATT-03 | Teacher shall mark each student as PRESENT, ABSENT, or LATE | Must |
| FR-ATT-04 | Teacher shall view attendance history per session | Must |
| FR-ATT-05 | Teacher shall delete attendance sessions (cascading to records) | Must |

### 3.5 Assignment Management (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-ASG-01 | Teacher shall create assignments with title, description, due date, and total marks | Must |
| FR-ASG-02 | Creating an assignment shall auto-generate NOT_SUBMITTED records for all class students | Must |
| FR-ASG-03 | Teacher shall grade submissions with marks and status | Must |
| FR-ASG-04 | Teacher shall view submission counts per assignment | Must |
| FR-ASG-05 | Teacher shall delete assignments (cascading to submissions) | Must |

### 3.6 Reports (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RPT-01 | Teacher shall view attendance reports per class with per-student statistics | Must |
| FR-RPT-02 | Teacher shall view submission reports per class with per-student averages | Must |
| FR-RPT-03 | Reports shall display data in tabular format | Should |
| FR-RPT-04 | Reports shall include visual charts (bar, pie) | Should |

### 3.7 AI Insights (Teacher)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AI-01 | Teacher shall request AI analysis for a specific class | Should |
| FR-AI-02 | System shall identify at-risk students based on attendance and submission data | Should |
| FR-AI-03 | System shall identify "cram students" who may be at risk | Should |
| FR-AI-04 | Each student shall receive a risk level (low/medium/high) and AI-generated analysis | Should |

### 3.8 Student Portal

| ID | Requirement | Priority |
|----|------------|----------|
| FR-STP-01 | Student shall view own profile (name, email, roll number, class) | Must |
| FR-STP-02 | Student shall view own attendance history with summary statistics | Must |
| FR-STP-03 | Student shall view assignments with submission status | Must |
| FR-STP-04 | Student shall view own grades with overall percentage | Must |
| FR-STP-05 | Student shall change own password (requires current password) | Must |

### 3.9 Dashboard

| ID | Requirement | Priority |
|----|------------|----------|
| FR-DSH-01 | Teacher dashboard shall display total counts (classes, students, sessions, assignments) | Must |
| FR-DSH-02 | Teacher dashboard shall show classes with student count and average attendance | Must |
| FR-DSH-03 | Teacher dashboard shall show recent attendance sessions | Must |
| FR-DSH-04 | Student dashboard shall display profile and attendance summary | Must |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-PERF-01 | API responses shall return within 2 seconds under normal load | Must |
| NFR-PERF-02 | Dashboard shall load within 3 seconds | Should |
| NFR-PERF-03 | Database queries shall use proper indexes | Must |

### 4.2 Security

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-SEC-01 | All passwords shall be hashed with bcrypt (10 salt rounds) | Must |
| NFR-SEC-02 | API routes shall validate JWT tokens | Must |
| NFR-SEC-03 | Role-based access control shall be enforced on all routes | Must |
| NFR-SEC-04 | Input validation shall be performed using Zod schemas | Must |
| NFR-SEC-05 | Environment secrets shall not be exposed in client-side code | Must |

### 4.3 Usability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-USE-01 | Application shall be responsive (mobile + desktop) | Must |
| NFR-USE-02 | Forms shall display validation errors inline | Must |
| NFR-USE-03 | Loading states shall be shown during async operations | Should |
| NFR-USE-04 | 404 pages shall provide navigation back to dashboard | Should |

### 4.4 Reliability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-REL-01 | Database connection shall use connection pooling | Must |
| NFR-REL-02 | API errors shall return structured JSON error responses | Must |
| NFR-REL-03 | Unhandled errors shall be caught by asyncHandler wrapper | Must |

### 4.5 Scalability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-SCA-01 | Student list endpoint shall support pagination | Must |
| NFR-SCA-02 | MongoDB indexes shall cover common query patterns | Must |
| NFR-SCA-03 | Database connection shall be cached in development | Should |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity | Description | Volume Estimate |
|--------|------------|----------------|
| User | Teacher and student accounts | 100-500 |
| Student | Student profiles linked to users | 100-2000 |
| Class | Course sections | 10-50 |
| AttendanceSession | Daily attendance instances | 1000-10000/year |
| AttendanceRecord | Individual student attendance | 50000-200000/year |
| Assignment | Course assignments | 100-500/year |
| AssignmentSubmission | Student submission records | 5000-20000/year |

### 5.2 Data Retention

- All data shall be retained indefinitely unless explicitly deleted by a teacher
- Soft delete is not implemented; deletions are permanent
- Attendance and submission records cascade-delete with their parent sessions/assignments

---

## 6. External Interfaces

### 6.1 API

- RESTful JSON API under `/api/` prefix
- Standard response envelope: `{ success, data, message, errors }`
- Authentication via JWT in HTTP-only cookies

### 6.2 Third-Party Services

| Service | Purpose | Required |
|---------|---------|----------|
| Groq API | AI-powered student risk analysis | No |
| MongoDB | Primary data store | Yes |
| Google Fonts | Poppins font loading | No |

---

## 7. Assumptions

1. MongoDB is available and accessible at the configured URI
2. Teachers have valid credentials provisioned before using the system
3. Students are created by teachers (no self-registration)
4. The system serves a single educational institution per deployment
5. Internet access is available for font loading and optional AI features
