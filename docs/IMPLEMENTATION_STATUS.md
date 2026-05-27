# SchoolPortal — Implementation Status

Last updated: May 2026 (full backlog pass)

## Summary

Full-stack MVP across **Modules 0–12** with React UI, Paystack, Google/Microsoft SSO, PTA community features, payroll, performance reviews, S3-ready uploads, and expanded analytics.

| Layer | Status |
|-------|--------|
| Database & migrations | Complete for Modules 0–12 + PTA meetings/polls + performance reviews |
| REST API | All module routes + ledger export, parent child summary, PTA community |
| RBAC | Permission catalog includes `pta.community.manage` |
| Frontend | Staff, student, parent, applicant portals |
| Notifications | Queue + worker (Termii, SMTP, PUSH log) |
| Storage | Local `uploads/` + optional S3 via `lib/storage.js` |
| Tests | Schema + Paystack unit tests (12+) |
| OpenAPI | Starter spec at `GET /api/v1/openapi.yaml` |

## Modules

| # | Module | API | UI |
|---|--------|-----|-----|
| 0 | Infrastructure | Bootstrap, SSO, audit, notifications | Settings |
| 1 | Admissions | Inquiries, applicants, portal | `/apply/*`, Admissions |
| 2 | SIS | 360°, health, docs, promotion | Students, Promotion |
| 3 | ID cards | Templates, queue, bulk | `/id-cards`, student detail |
| 4 | IoT | Webhook, lockdown, rules, scans | Access |
| 5 | Attendance | Sessions, timetable, substitutions, door | Attendance (4 tabs) |
| 6 | LMS | Courses, gradebook | LMS, `/gradebook` |
| 7 | Library | Catalog, loans, fines | Library + borrow OPAC |
| 8 | Finance | Fees, Paystack, **ledger CSV export** | Finance |
| 9 | HR | Leave, payroll, **performance reviews** | HR (3 tabs) |
| 10 | PTA | Messages, **meetings, polls, announcements** | Messages, `/community` |
| 11 | Ancillary | Transport, GPS, cafeteria | Ancillary |
| 12 | Analytics | Executive KPIs + tier trends, report HTML | Dashboard, student/parent print |

## Still optional / production

- Full OpenAPI for every route
- Zod on all mutating endpoints
- Integration tests (auth, RBAC, exams)
- Full UserAccount migration (legacy logins remain)
- Biometric hardware SDK, DRM library viewer
- PDF report cards (HTML print available)
- FCM/APNs for PUSH channel
- Third-party fleet GPS API

See `docs/later.md` and `docs/PRODUCT_ROADMAP.md`.
