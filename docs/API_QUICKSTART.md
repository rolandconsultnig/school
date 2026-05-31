# API Quickstart (Phase A delivered)

Base URL: `http://localhost:3900/api/v1`

## 1. Database setup

```sh
npm install
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET_KEY
npm run db:migrate
npm run db:seed
npm run dev
```

## 2. First admin (choose one)

**Option A — Bootstrap (empty database)**

```http
POST /api/v1/admin/setup
Content-Type: application/json

{
  "name": "Super Admin",
  "email": "admin@school.ng",
  "password": "ChangeMe@123"
}
```

Returns JWT in `data.token`.

**Option B — Seed**

Run `npm run db:seed`, then sign in with:

| Portal | Email | Password |
|--------|-------|----------|
| Staff (admin) | `superadmin@school.local` | `SuperAdmin@123` |
| Staff (teacher) | `teacher@school.local` | `Teacher@123` |
| Student | `student@school.local` | `Student@123` |
| Parent | `parent@school.local` | `Parent@123` |

The demo parent is linked to the demo student. Override emails/passwords via `SEED_*` env vars in `.env` (see `prisma/seed.js`).

## 3. Tenant headers (optional)

```http
X-Campus-Id: <campus-uuid-from-seed>
X-Tier: PRIMARY
```

## 4. Key flows

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| Unified login | POST | `/auth/login` | Public |
| Login admin | POST | `/admin/login` | Public |
| Parent login | POST | `/parents/login` | Public |
| Register student | POST | `/students/admin/register` | `sis.student.manage` |
| Create class | POST | `/class-levels` | `sis.class.allocate` |
| Suspend teacher | PUT | `/admins/suspend/teacher/:id` | `hr.staff.manage` |
| Publish results | PUT | `/admins/publish/result/:examId` | `lms.grade.publish` |
| List tiers | GET | `/foundation/tiers` | Public |

Authorization header on protected routes:

```http
Authorization: Bearer <token>
```

## 5. Student registration body (tier-aware)

```json
{
  "name": "Ada Okafor",
  "email": "ada@student.school.ng",
  "password": "Student@123",
  "tier": "PRIMARY",
  "campusId": "<campus-uuid>",
  "gradeLevelId": "<grade-uuid-for-primary-3>",
  "section": "A"
}
```

## 6. Paystack fees (demo without keys)

```http
POST /api/v1/students/portal/fees/:feeId/payments/paystack/initialize
Authorization: Bearer <student-token>

{ "callbackUrl": "http://localhost:3905/paystack/callback" }
```

```http
GET /api/v1/finance/payments/paystack/verify/:reference
```

Set `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` in `.env` for live checkout.

## 7. OpenAPI

`GET http://localhost:3900/api/v1/openapi.yaml`
