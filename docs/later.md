# SchoolPortal — What's Left to Complete

> Aligned with `PRODUCT_ROADMAP.md`, `BUILD_ROADMAP.md`, and current codebase (May 2026).

## Development progress

| Sprint / wave | Status |
|---------------|--------|
| Sprints 1–5 (stabilize, UI, integrations, deep modules, polish) | **Done** |
| Backlog pass (PTA community, performance, Microsoft SSO, S3, ledger export, parent child views) | **Done** |

## Remaining (production & Phase F depth)

### Production hardening

| Item | Status |
|------|--------|
| Integration tests (auth, exams, RBAC E2E) | Partial — HTTP login + OpenAPI tests in `tests/http.integration.test.js` |
| OpenAPI — full coverage of all routes | Partial |
| Zod on all mutating routes | Partial (~13 route groups incl. finance, library, exams) |
| Deploy review (Postgres, uploads, env on host) | Partial |
| `BUILD_ROADMAP.md` baseline table | Update recommended |

### Not started / optional

| Item | Notes |
|------|--------|
| Full `UserAccount` migration | Legacy admin/teacher/student JWT paths remain |
| `X-Campus-Id` / `X-Tier` on every scoped route | Partial |
| Tier rollout on exams/fees/attendance (roadmap steps 3–5) | Partial — exams list filters by X-Tier / class level |
| Biometric / hardware SDK for IoT | Webhook only |
| Library DRM viewer | — |
| RFID campus wallet | Basic wallet read |
| PDF report cards (bulk) | Partial — bulk generate API + dashboard button; HTML print per card |
| FCM/APNs push delivery | PUSH channel logs only |
| Third-party fleet GPS | Manual GPS + OSM map |
| Interview scheduling UI | Done — Admissions applicants tab |
| LMS ↔ legacy exams unified UX | Done — `/learn` hub (courses, exams, gradebook) |
| Full GL accounting / multi-currency ledger | CSV export only |

### Done (previously listed as missing)

- Applicant portal (`/apply/*`)
- Transport & cafeteria admin (`AncillaryPage`)
- Attendance timetable, substitutions, door import
- Promotion UI
- Staff gradebook (`/gradebook`)
- SIS health, contacts, documents
- Teacher suspend/withdraw
- Parent dashboard + per-child page (`/children/:id`)
- Bus tracker (OSM when GPS posted)
- Google + **Microsoft** SSO (with env)
- Paystack + Termii worker
- ID cards page, IoT lockdown, payroll, performance reviews
- PTA meetings, polls, announcements (`/community`)
- Finance ledger CSV export
- Library borrow (staff OPAC)
- Optional S3 upload mirror (`lib/storage.js`)

## Bottom line

The product is a **complete MVP** for Modules 0–12. Remaining work is **production testing**, **full API documentation**, and **Phase F depth** (BI, DRM, hardware, PDF bulk, push at scale).
