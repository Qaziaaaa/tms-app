# Teacher Management System (TMS)

A full-stack web application for managing educational workflows — attendance, assignments, marks, and AI-powered student insights.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Database | MongoDB (Mongoose ODM) |
| Auth | NextAuth.js v5 (JWT, Credentials) |
| Charts | Recharts 3 |
| Validation | Zod 4 |
| AI | Groq API (llama-3.1-8b-instant) |
| Testing | Playwright |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running on `localhost:27017`

### Setup

```bash
npm install
npm run seed
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@tms.edu | password123 |
| Student | ahmed@student.edu | password123 |

## Features

### Teacher Portal

- **Dashboard** — Overview stats, class summary, recent attendance sessions
- **Classes** — Create, edit, delete classes with department/batch/schedule
- **Students** — CRUD operations, CSV bulk import, class filtering
- **Attendance** — Create sessions, mark present/absent/late per student
- **Assignments** — Create assignments, grade submissions, track completion
- **Reports** — Attendance and submission reports per class with charts
- **AI Insights** — Risk analysis, cram student detection via Groq LLM

### Student Portal

- **Dashboard** — Profile overview, attendance summary, class info
- **Attendance** — Personal attendance history with percentage
- **Assignments** — View assignments, track submission status
- **Grades** — Grade breakdown with overall average
- **Password** — Change password (requires current password)

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/          # REST API endpoints (20 route files, 29 handlers)
│   ├── dashboard/    # Teacher dashboard
│   ├── classes/      # Class management
│   ├── students/     # Student management
│   ├── attendance/   # Attendance tracking
│   ├── assignments/  # Assignment management
│   ├── reports/      # Reports with charts
│   ├── insights/     # AI insights
│   ├── login/        # Authentication
│   └── student/      # Student portal (5 pages)
├── components/       # Reusable UI components
│   ├── layout/       # AppShell, Sidebar, Header, StudentShell
│   ├── ui/           # shadcn/ui components (20 components)
│   └── *.tsx         # Charts, DataTable, ConfirmDialog, PageLayout
├── hooks/            # useAuth, useFetch, useMutation, useForm
├── lib/              # Auth, API utils, DB connection, validations, constants
├── models/           # 7 Mongoose schemas
└── services/         # 8 service files with business logic
```

## Documentation

| Document | Description |
|----------|-------------|
| [SRS](docs/SRS.md) | Software Requirements Specification |
| [Architecture](docs/SAD.md) | Software Architecture Document |
| [API Reference](docs/API.md) | Complete API endpoint documentation |
| [Database Schema](docs/DATABASE.md) | MongoDB schema design and relationships |
| [Test Plan](docs/TEST-PLAN.md) | Testing strategy and test cases |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment instructions |

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/tms
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GROQ_API_KEY=your-groq-api-key  # Optional, for AI insights
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with demo data |
| `npm run lint` | Run ESLint |
