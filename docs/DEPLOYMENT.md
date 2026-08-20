# Deployment Guide

**Project:** Teacher Management System (TMS)
**Version:** 1.0
**Date:** August 2026

---

## 1. Prerequisites

| Requirement | Minimum Version | Purpose |
|-------------|----------------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| MongoDB | 6+ | Database |
| Git | 2+ | Version control |

---

## 2. Environment Variables

Create a `.env` file in the project root:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/tms
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-32-char-random-string-here

# Optional (for AI insights feature)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Generating NEXTAUTH_SECRET

```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { [char]((Get-Random -Maximum 26) + 97) })
```

---

## 3. Local Development Setup

### 3.1 Clone and Install

```bash
git clone https://github.com/Qaziaaaa/tms-app.git
cd tms-app
npm install
```

### 3.2 Start MongoDB

```bash
# If using local MongoDB
mongod --dbpath /path/to/data

# If using Docker
docker run -d -p 27017:27017 --name tms-mongo mongo:7
```

### 3.3 Seed Database

```bash
npx tsx prisma/seed.ts
```

This creates:
- 1 teacher (`teacher@tms.edu` / `password123`)
- 15 students (5 per class, all use `password123`)
- 3 classes (Software Engineering, AI, International Relations)

### 3.4 Start Development Server

```bash
npm run dev
```

Access at `http://localhost:3000`.

---

## 4. Production Build

### 4.1 Build

```bash
npm run build
```

### 4.2 Start Production Server

```bash
npm run start
```

The production server runs on `http://localhost:3000` by default. Override with:

```bash
PORT=8080 npm run start
```

---

## 5. Deployment Options

### 5.1 Vercel (Recommended for Quick Deploy)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add GROQ_API_KEY
```

**Note:** Vercel serverless functions require MongoDB Atlas (not local MongoDB).

### 5.2 Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  tms:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/tms
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
      - GROQ_API_KEY=your-key-here
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### 5.3 Traditional Server (PM2)

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start npm --name "tms" -- start

# Save PM2 config
pm2 save
pm2 startup
```

---

## 6. Database Migration

### 6.1 Initial Setup

After deploying to a new MongoDB instance:

```bash
# Seed the database
npx tsx prisma/seed.ts
```

### 6.2 Backup

```bash
# Backup
mongodump --db tms --out /path/to/backup/

# Restore
mongorestore --db tms /path/to/backup/tms/
```

### 6.3 Atlas Migration

```bash
# Export from local
mongoexport --db tms --collection users --out users.json
mongoexport --db tms --collection students --out students.json
# ... repeat for all collections

# Import to Atlas
mongoimport --uri "mongodb+srv://..." --db tms --collection users --file users.json
```

---

## 7. Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| NEXTAUTH_SECRET is strong and unique | Required | 32+ random characters |
| NEXTAUTH_URL matches deployment URL | Required | No trailing slash |
| MongoDB requires authentication (production) | Required | Use auth credentials in URI |
| HTTPS enabled | Required | Use reverse proxy or managed platform |
| Environment variables not in code | Required | `.env` in `.gitignore` |
| GROQ_API_KEY kept secret | Required | Never expose in client code |

---

## 8. Monitoring

### 8.1 Health Check

```bash
# Test API availability
curl http://localhost:3000/api/auth/csrf
# Should return: {"csrfToken":"..."}
```

### 8.2 MongoDB Health

```bash
# Check MongoDB connection
mongosh --eval "db.stats()" mongodb://localhost:27017/tms
```

### 8.3 Logs

```bash
# PM2 logs
pm2 logs tms

# Docker logs
docker logs tms-app-tms-1
```

---

## 9. Troubleshooting

| Issue | Solution |
|-------|---------|
| `ECONNREFUSED` to MongoDB | Ensure MongoDB is running on the configured URI |
| `NEXTAUTH_SECRET` error | Set the environment variable before starting |
| 401 on all API routes | Check NEXTAUTH_URL matches your deployment URL |
| AI insights fail | Verify GROQ_API_KEY is valid and has quota |
| Build fails with type errors | Run `npm run build` and fix TypeScript errors |
| Seed fails | Ensure MongoDB is running and accessible |
| Port 3000 in use | Set `PORT=3080` or kill the existing process |

---

## 10. Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@tms.edu | password123 |
| Student | ahmed@student.edu | password123 |
| Student | fatima@student.edu | password123 |
| Student | hassan@student.edu | password123 |
| Student | sara@student.edu | password123 |
| Student | usman@student.edu | password123 |

**Warning:** Change all passwords before production use.
