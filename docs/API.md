# API Reference

**Base URL:** `http://localhost:3000/api`
**Content-Type:** `application/json`

---

## Authentication

All API endpoints (except `/api/auth/*`) require a valid JWT token in an HTTP-only cookie.

### Standard Response Envelope

```json
// Success
{
  "success": true,
  "data": "<payload>",
  "message": "Description of result",
  "errors": []
}

// Error
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

---

## Authentication Endpoints

### POST /api/auth/callback/credentials

Authenticate with email and password.

**Request:**
```json
{
  "email": "teacher@tms.edu",
  "password": "password123"
}
```

**Response:** Sets JWT cookie, returns 302 redirect.

---

### GET /api/auth/session

Get current session information.

**Response:**
```json
{
  "user": {
    "name": "Teacher",
    "email": "teacher@tms.edu",
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "role": "teacher"
  },
  "expires": "2026-09-19T16:30:19.631Z"
}
```

---

## Teacher Endpoints

All teacher endpoints require `role: "teacher"` in the JWT.

---

### GET /api/dashboard

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClasses": 3,
    "totalStudents": 15,
    "totalSessions": 5,
    "totalAssignments": 8,
    "recentAttendance": [
      {
        "_id": "...",
        "date": "2026-08-20T00:00:00.000Z",
        "classId": { "name": "Software Engineering" },
        "_count": { "records": 5 }
      }
    ],
    "classesWithStats": [
      {
        "id": "...",
        "name": "Software Engineering",
        "studentCount": 5,
        "sessionCount": 5,
        "averageAttendance": 85
      }
    ]
  }
}
```

---

### GET /api/classes

List all classes with student counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Software Engineering",
      "department": "Computer Science",
      "batch": "2024",
      "schedule": "Monday 10:00 AM",
      "studentCount": 5
    }
  ]
}
```

### POST /api/classes

Create a new class.

**Request:**
```json
{
  "name": "Software Engineering",
  "department": "Computer Science",
  "batch": "2024",
  "schedule": "Monday 10:00 AM"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|------------|
| name | string | Yes | min 1, max 100 |
| department | string | Yes | min 1, max 100 |
| batch | string | Yes | min 1, max 20 |
| schedule | string | No | max 100 |

**Response:** 201 with created class object.

---

### GET /api/classes/:id

Get a class with its student roster.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Software Engineering",
    "students": [
      { "_id": "...", "rollNumber": "CS-24-001", "name": "Ahmed Khan" }
    ]
  }
}
```

### PUT /api/classes/:id

Update a class. All fields optional.

**Request:** Same as POST but all fields optional.

### DELETE /api/classes/:id

Delete a class.

**Response:**
```json
{ "success": true, "data": { "deleted": true }, "message": "Class deleted" }
```

---

### GET /api/students

List students with pagination and filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|------------|
| classId | string | — | Filter by class ID |
| page | number | 1 | Page number (min 1) |
| pageSize | number | 20 | Items per page (1-200) |

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "...",
        "rollNumber": "CS-24-001",
        "name": "Ahmed Khan",
        "classId": { "_id": "...", "name": "Software Engineering" }
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

### POST /api/students

Create a student.

**Request:**
```json
{
  "rollNumber": "CS-24-001",
  "name": "Ahmed Khan",
  "classId": "class-object-id"
}
```

### GET /api/students/:id | PUT /api/students/:id | DELETE /api/students/:id

Standard CRUD operations for individual students.

### POST /api/students/bulk

Bulk import students.

**Request:**
```json
{
  "classId": "class-object-id",
  "students": [
    { "rollNumber": "CS-24-001", "name": "Ahmed Khan" },
    { "rollNumber": "CS-24-002", "name": "Fatima Ali" }
  ]
}
```

**Response:** 201 with `{ created: 2 }`.

---

### GET /api/attendance/sessions

List attendance sessions.

**Query:** `classId` (optional) — filter by class.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "date": "2026-08-20T00:00:00.000Z",
      "classId": { "_id": "...", "name": "Software Engineering" },
      "recordCount": 5
    }
  ]
}
```

### POST /api/attendance/sessions

Create an attendance session.

**Request:**
```json
{
  "classId": "class-object-id",
  "date": "2026-08-20"
}
```

**Error:** 409 if session already exists for same class + date.

### GET /api/attendance/sessions/:id

Get session with all attendance records.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "date": "2026-08-20T00:00:00.000Z",
    "classId": { "name": "Software Engineering" },
    "records": [
      {
        "studentId": { "name": "Ahmed Khan", "rollNumber": "CS-24-001" },
        "status": "PRESENT"
      }
    ]
  }
}
```

### DELETE /api/attendance/sessions/:id

Delete session and cascade-delete all records.

### POST /api/attendance/records

Save attendance for a session (upserts records).

**Request:**
```json
{
  "sessionId": "session-object-id",
  "records": [
    { "studentId": "student-id-1", "status": "PRESENT" },
    { "studentId": "student-id-2", "status": "ABSENT" },
    { "studentId": "student-id-3", "status": "LATE" }
  ]
}
```

| Status Values | Description |
|--------------|------------|
| `PRESENT` | Student was present |
| `ABSENT` | Student was absent |
| `LATE` | Student arrived late |

---

### GET /api/assignments

List assignments.

**Query:** `classId` (optional) — filter by class.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Final Project",
      "description": "Build a web app",
      "dueDate": "2026-09-01T00:00:00.000Z",
      "totalMarks": 100,
      "classId": "...",
      "submissionCount": 3
    }
  ]
}
```

### POST /api/assignments

Create assignment (auto-creates NOT_SUBMITTED for all class students).

**Request:**
```json
{
  "classId": "class-object-id",
  "title": "Final Project",
  "description": "Build a web app",
  "dueDate": "2026-09-01",
  "totalMarks": 100
}
```

### GET /api/assignments/:id

Get assignment with all submissions.

### PUT /api/assignments/:id | DELETE /api/assignments/:id

Update or delete assignment (cascade-delete submissions).

### POST /api/assignments/:id/submissions

Save/update submission records.

**Request:**
```json
{
  "submissions": [
    { "studentId": "id-1", "status": "SUBMITTED", "marks": 85 },
    { "studentId": "id-2", "status": "LATE", "marks": 70 },
    { "studentId": "id-3", "status": "NOT_SUBMITTED", "marks": null }
  ]
}
```

| Status Values | Description |
|--------------|------------|
| `SUBMITTED` | Turned in on time |
| `LATE` | Turned in after deadline |
| `NOT_SUBMITTED` | Not turned in |

---

### GET /api/reports

Generate attendance or submissions report.

**Query Parameters:**

| Param | Type | Required | Values |
|-------|------|----------|--------|
| classId | string | Yes | Class ID |
| type | string | Yes | `"attendance"` or `"submissions"` |

**Attendance Report Response:**
```json
{
  "success": true,
  "data": {
    "type": "attendance",
    "totalSessions": 10,
    "students": [
      {
        "rollNumber": "CS-24-001",
        "name": "Ahmed Khan",
        "totalSessions": 10,
        "presentCount": 9,
        "attendancePercentage": 90
      }
    ]
  }
}
```

**Submissions Report Response:**
```json
{
  "success": true,
  "data": {
    "type": "submissions",
    "totalAssignments": 5,
    "students": [
      {
        "rollNumber": "CS-24-001",
        "name": "Ahmed Khan",
        "submittedCount": 4,
        "notSubmittedCount": 1,
        "totalMarksObtained": 340,
        "totalPossibleMarks": 500,
        "averageMarks": 68
      }
    ]
  }
}
```

---

### GET /api/ai

Generate AI insights for a class.

**Query:** `classId` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "classId": "...",
    "className": "Software Engineering",
    "totalStudents": 5,
    "averageAttendance": 80,
    "averageSubmissionRate": 75,
    "atRiskStudents": 1,
    "cramStudents": [...],
    "students": [
      {
        "name": "Ahmed Khan",
        "rollNumber": "CS-24-001",
        "attendancePercentage": 90,
        "submissionRate": 100,
        "averageMarks": 85,
        "riskLevel": "low",
        "aiAnalysis": "Consistent performance..."
      }
    ]
  }
}
```

---

## Student Portal Endpoints

All student endpoints require `role: "student"` and are scoped to the authenticated user.

### GET /api/student/profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Ahmed Khan",
    "email": "ahmed@student.edu",
    "rollNumber": "CS-24-001",
    "class": { "name": "Software Engineering", "department": "Computer Science" }
  }
}
```

### GET /api/student/attendance

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [...],
    "summary": {
      "present": 8,
      "absent": 1,
      "late": 1,
      "totalDays": 10,
      "percentage": 80
    }
  }
}
```

### GET /api/student/assignments

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Final Project",
      "dueDate": "2026-09-01",
      "totalMarks": 100,
      "submission": { "status": "SUBMITTED", "marks": 85 }
    }
  ]
}
```

### GET /api/student/grades

**Response:**
```json
{
  "success": true,
  "data": {
    "grades": [
      { "title": "Final Project", "marks": 85, "totalMarks": 100, "percentage": 85 }
    ],
    "summary": {
      "totalMarksObtained": 340,
      "totalPossibleMarks": 500,
      "overallPercentage": 68
    }
  }
}
```

### PUT /api/student/password

**Request:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newsecurepass"
}
```

| Field | Type | Constraints |
|-------|------|------------|
| currentPassword | string | Required |
| newPassword | string | Required, min 6 characters |

**Response:**
```json
{ "success": true, "data": { "updated": true }, "message": "Password changed" }
```

**Error:** 401 if current password is incorrect.
