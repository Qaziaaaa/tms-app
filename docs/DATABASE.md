# Database Schema Documentation

**Database:** MongoDB
**ODM:** Mongoose 9
**Connection:** `MONGODB_URI` environment variable (default: `mongodb://localhost:27017/tms`)

---

## 1. Entity Relationship Diagram

```
┌──────────────┐        ┌──────────────────┐
│     User      │        │      Class       │
├──────────────┤        ├──────────────────┤
│ _id (ObjectId)│        │ _id (ObjectId)   │
│ name          │        │ name             │
│ email         │◄────┐  │ department       │
│ passwordHash  │    │  │ batch            │
│ role          │    │  │ schedule         │
│ createdAt     │    │  │ createdAt        │
│ updatedAt     │    │  │ updatedAt        │
└──────────────┘    │  └──────┬───────────┘
                     │         │
                     │         │ 1:N
                     │  ┌──────┴───────────────────┐
                     │  │        Student            │
                     │  ├──────────────────────────┤
                     │  │ _id (ObjectId)            │
                     └──│ userId → User (optional)  │
                        │ email                     │
                        │ rollNumber                 │
                        │ name                       │
                        │ classId → Class            │
                        │ createdAt                  │
                        │ updatedAt                  │
                        └──────┬───────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │ N        │          │ N
            ┌───────┴───────┐  │  ┌───────┴──────────┐
            │ AttendanceRec  │  │  │ AssignmentSubmit  │
            ├───────────────┤  │  ├──────────────────┤
            │ sessionId →   │  │  │ assignmentId →   │
            │   AttendanceS  │  │  │   Assignment     │
            │ studentId →   │  │  │ studentId →      │
            │   Student     │  │  │   Student        │
            │ status        │  │  │ status           │
            └───────┬───────┘  │  │ marks            │
                    │ N        │  └───────┬──────────┘
            ┌───────┴───────┐  │          │ N
            │ AttendanceSe  │  │  ┌───────┴──────────┐
            ├───────────────┤  │  │   Assignment     │
            │ classId →     │  │  ├──────────────────┤
            │   Class       │◄─┘  │ classId → Class  │
            │ date          │     │ title            │
            │ createdAt     │     │ description      │
            └───────────────┘     │ dueDate          │
                                  │ totalMarks       │
                                  │ createdAt        │
                                  │ updatedAt        │
                                  └──────────────────┘
```

---

## 2. Collection Schemas

### 2.1 User

Stores authentication credentials and role information.

```typescript
{
  _id: ObjectId,              // Auto-generated
  name: String,               // Required
  email: String,              // Required, unique, lowercase, trimmed
  passwordHash: String,       // Required, bcrypt hash
  role: String,               // Required, enum: ["teacher", "student"], default: "teacher"
  createdAt: Date,            // Auto (timestamps)
  updatedAt: Date             // Auto (timestamps)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `email` | Unique | Login lookup, duplicate prevention |

**Constraints:** Email must be unique across all users.

---

### 2.2 Class

Represents a course section or class group.

```typescript
{
  _id: ObjectId,              // Auto-generated
  name: String,               // Required (e.g., "Software Engineering")
  department: String,         // Required (e.g., "Computer Science")
  batch: String,              // Required (e.g., "2024")
  schedule: String,           // Optional (e.g., "Monday 10:00 AM")
  createdAt: Date,            // Auto (timestamps)
  updatedAt: Date             // Auto (timestamps)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `department` | Standard | Filter by department |
| `batch` | Standard | Filter by batch |

---

### 2.3 Student

Student profile linked to a class and optionally to a user account.

```typescript
{
  _id: ObjectId,              // Auto-generated
  userId: ObjectId,           // Ref → User (sparse, nullable)
  email: String,              // Sparse, nullable, lowercase, trimmed
  rollNumber: String,         // Required
  name: String,               // Required
  classId: ObjectId,          // Ref → Class (required)
  createdAt: Date,            // Auto (timestamps)
  updatedAt: Date             // Auto (timestamps)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `classId` | Standard | Filter students by class |
| `rollNumber` | Standard | Sort by roll number |
| `userId` | Sparse | Link to User for portal access |
| `email` | Sparse | Lookup by email |
| `classId + rollNumber` | Unique compound | Prevent duplicate roll numbers within a class |

---

### 2.4 AttendanceSession

A single attendance tracking instance for a class on a specific date.

```typescript
{
  _id: ObjectId,              // Auto-generated
  classId: ObjectId,          // Ref → Class (required)
  date: Date,                 // Required
  createdAt: Date             // Auto (timestamps: createdAt only, no updatedAt)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `classId + date` | Unique compound | Prevent duplicate sessions per class per day |
| `classId` | Standard | Filter sessions by class |
| `date` | Standard | Sort by date |

---

### 2.5 AttendanceRecord

Individual student attendance for a specific session.

```typescript
{
  _id: ObjectId,              // Auto-generated
  sessionId: ObjectId,        // Ref → AttendanceSession (required)
  studentId: ObjectId,        // Ref → Student (required)
  status: String,             // Required, enum: ["PRESENT", "ABSENT", "LATE"]
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `sessionId + studentId` | Unique compound | One record per student per session |
| `sessionId` | Standard | Fetch all records for a session |
| `studentId` | Standard | Fetch all records for a student |
| `status` | Standard | Filter by attendance status |

**No timestamps** — this model does not use `createdAt`/`updatedAt`.

---

### 2.6 Assignment

A course assignment with due date and marking scheme.

```typescript
{
  _id: ObjectId,              // Auto-generated
  classId: ObjectId,          // Ref → Class (required)
  title: String,              // Required
  description: String,        // Optional
  dueDate: Date,              // Required
  totalMarks: Number,         // Required
  createdAt: Date,            // Auto (timestamps)
  updatedAt: Date             // Auto (timestamps)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `classId` | Standard | Filter assignments by class |
| `dueDate` | Standard | Sort by due date |

---

### 2.7 AssignmentSubmission

A student's submission record for a specific assignment.

```typescript
{
  _id: ObjectId,              // Auto-generated
  assignmentId: ObjectId,     // Ref → Assignment (required)
  studentId: ObjectId,        // Ref → Student (required)
  status: String,             // Required, enum: ["SUBMITTED", "LATE", "NOT_SUBMITTED"], default: "NOT_SUBMITTED"
  marks: Number,              // Optional (null if not graded)
  createdAt: Date,            // Auto (timestamps)
  updatedAt: Date             // Auto (timestamps)
}
```

**Indexes:**
| Field | Type | Purpose |
|-------|------|---------|
| `assignmentId + studentId` | Unique compound | One submission per student per assignment |
| `assignmentId` | Standard | Fetch all submissions for an assignment |
| `studentId` | Standard | Fetch all submissions for a student |
| `status` | Standard | Filter by submission status |

---

## 3. Relationships

| Parent | Child | Cardinality | FK Field | Cascade |
|--------|-------|-------------|----------|---------|
| User | Student | 1:1 (optional) | `Student.userId` | No |
| Class | Student | 1:N | `Student.classId` | No |
| Class | AttendanceSession | 1:N | `AttendanceSession.classId` | No |
| Class | Assignment | 1:N | `Assignment.classId` | No |
| AttendanceSession | AttendanceRecord | 1:N | `AttendanceRecord.sessionId` | Yes (on session delete) |
| Assignment | AssignmentSubmission | 1:N | `AssignmentSubmission.assignmentId` | Yes (on assignment delete) |
| Student | AttendanceRecord | 1:N | `AttendanceRecord.studentId` | No |
| Student | AssignmentSubmission | 1:N | `AssignmentSubmission.studentId` | No |

### 3.1 Cascade Delete Rules

- **Deleting an AttendanceSession** deletes all associated AttendanceRecords
- **Deleting an Assignment** deletes all associated AssignmentSubmissions
- **Deleting a Class** does NOT cascade — must delete students, sessions, assignments first
- **Deleting a Student** does NOT cascade — must delete records/submissions first

---

## 4. Seed Data

The `prisma/seed.ts` script creates:

| Entity | Count | Details |
|--------|-------|---------|
| Teachers | 1 | `teacher@tms.edu` / `password123` |
| Students | 15 | 5 per class, each with a User account for portal login |
| Classes | 3 | Software Engineering, Artificial Intelligence, International Relations |

**Note:** The seed script drops ALL collections before seeding. Run with `npx tsx prisma/seed.ts`.

---

## 5. Connection Management

```typescript
// src/lib/db.ts
let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  global.mongoose = cached;
  return cached.conn;
}
```

**Design decisions:**
- Global caching prevents multiple connections during Next.js hot-reload
- `serverExternalPackages: ["mongoose"]` in `next.config.ts` excludes Mongoose from bundling
- Connection is lazy — only established on first database operation
