# Phase C+ — Promotion, uploads, parents, unified auth

## Unified auth

```http
POST /api/v1/auth/login
{ "email": "...", "password": "..." }
```

Resolves `UserAccount`, Admin, Teacher, Student, or Parent. Returns `profileType`, `roleCode`, `token`.

SSO: `GET /api/v1/auth/sso/status` — configure `GOOGLE_CLIENT_ID` / `MICROSOFT_CLIENT_ID` for future OAuth.

## File uploads (local disk)

Files stored under `uploads/`, served at `/uploads/<filename>`.

| Endpoint | Field |
|----------|-------|
| `POST /sis/students/:studentId/documents/upload` | `file` (multipart) + `title` |
| `POST /admissions/applicants/portal/documents/upload` | `file` + `title` |
| `POST /admissions/applicants/:id/documents/upload` | staff review path |

JSON body with `fileUrl` still works on non-`/upload` routes.

## SIS promotion

```http
POST /api/v1/sis/promotions/run
Authorization: Bearer <admin-token>
X-Tier: PRIMARY

{
  "tier": "PRIMARY",
  "campusId": "<uuid>",
  "fromGradeLevelId": "<uuid>",
  "repeaterStudentIds": ["<student-uuid>"],
  "graduateFinalYear": true,
  "academicYearId": "<optional>"
}
```

```http
POST /api/v1/sis/classes/assign
{ "classLevelId": "<uuid>", "studentIds": ["..."] }
```

```http
GET /api/v1/sis/students/:studentId/promotions
```

## Parents & PTA

```http
POST /api/v1/parents/register
POST /api/v1/parents/login
GET  /api/v1/parents/portal/dashboard   # Bearer parent token
POST /api/v1/parents/:parentId/children # staff: sis.student.manage

POST /api/v1/pta/messages               # parent → teacher
POST /api/v1/pta/messages/staff         # staff → parent (pta.message.send)
GET  /api/v1/pta/messages/parent/me
GET  /api/v1/pta/messages/teacher/me
```

## Migration

```sh
npm install
npm run db:migrate
```

Adds `Parent`, `ParentStudent`, `PtaMessage`, `PromotionRecord`, `ProfileType.PARENT`.
