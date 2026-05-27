# Phase B → C Delivery Notes

## Module 0 (complete)

- **Notification worker:** `npm run worker:notifications` — polls `NotificationQueue`, marks SENT/FAILED
- **Shared queue helper:** `services/foundation/notification.service.js`
- **Academic audit:** all academic mutation controllers log via `auditAcademic()`
- **SIS / Admissions mutations** log via `logFromRequest()`

## Module 2 — SIS

| Method | Path | Permission |
|--------|------|------------|
| GET | `/sis/students/:studentId/profile` | `sis.student.read` |
| PUT | `/sis/students/:studentId/health` | `sis.student.manage` |
| POST | `/sis/students/:studentId/emergency-contacts` | `sis.student.manage` |
| PATCH | `/sis/emergency-contacts/:contactId` | `sis.student.manage` |
| DELETE | `/sis/emergency-contacts/:contactId` | `sis.student.manage` |
| GET/POST | `/sis/students/:studentId/documents` | read / manage |
| DELETE | `/sis/documents/:documentId` | `sis.student.manage` |

`fileUrl` is a string (URL or storage path) — wire S3/local upload in a later iteration.

## Module 1 — Admissions

### Public

| Method | Path |
|--------|------|
| POST | `/admissions/inquiries` |
| POST | `/admissions/applicants/register` |
| POST | `/admissions/applicants/login` |

### Applicant portal (Bearer token from applicant login)

| Method | Path |
|--------|------|
| GET | `/admissions/applicants/portal/me` |
| POST | `/admissions/applicants/portal/documents` |

### Staff (registrar / admin)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admissions/inquiries` | `admissions.inquiry.manage` |
| PATCH | `/admissions/inquiries/:id/status` | `admissions.inquiry.manage` |
| GET | `/admissions/applicants` | `admissions.applicant.review` |
| PATCH | `/admissions/applicants/:id/status` | `admissions.applicant.review` |
| POST | `/admissions/applicants/:id/enroll` | `admissions.enrollment.execute` |

### Applicant status pipeline

`INQUIRY` → `APPLIED` → `DOCUMENT_REVIEW` → `INTERVIEW_SCHEDULED` → `INTERVIEWED` → `ACCEPTED` → `ENROLLED`

Enrollment (`POST .../enroll`) creates a **Student**, copies approved documents, queues welcome email.

## Database migration

```sh
npm run db:migrate
# migration name suggestion: phase_b_c_sis_admissions
```

## Run stack

```sh
npm run dev
# separate terminal:
npm run worker:notifications
```
