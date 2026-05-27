# SchoolPortal — Product Roadmap (Nigeria)

> **How to build:** see [BUILD_ROADMAP.md](./BUILD_ROADMAP.md) (phases & sprints) and [BUILD_SCHEME.md](./BUILD_SCHEME.md) (code conventions).  
> **Current delivery snapshot:** [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)  
> **Frontend:** React app in `web/` — see [FRONTEND.md](./FRONTEND.md)  
> **Original repo comparison:** [ORIGINAL_REPO_GAP_ANALYSIS.md](./ORIGINAL_REPO_GAP_ANALYSIS.md)

## School tiers

All academic data is scoped to one of three tiers aligned with the Nigerian system:

| Tier | Typical ages | Nigerian structure (seeded) |
|------|----------------|----------------------------|
| **NURSERY** | ~2–5 | Pre-Nursery, Nursery 1, Nursery 2 |
| **PRIMARY** | ~6–11 | Primary 1 – Primary 6 |
| **SECONDARY** | ~12–17 | JSS 1–3, SS 1–3 |

Each **campus** can operate one or more tiers. Students, classes, fees, and timetables are filtered by `campusId` + `tier`.

---

## Module map & build phases

### Phase 0 — Foundation (delivered)

| ID | Module | Status | Deliverables |
|----|--------|--------|--------------|
| 0 | Infrastructure, Security & Shared Services | **Delivered** | RBAC, multi-tenant org/campus, audit log, tier/grade catalog, notification worker |

### Phase 1 — Core school operations (extends current API)

| ID | Module | Depends on | Notes |
|----|--------|------------|-------|
| 1 | Admissions & Enrollment | 0, 2 | Applicant → active student pipeline |
| 2 | Student Information System (SIS) | 0 | Evolve existing `Student` + 360° profile |
| 5 | Attendance & Scheduling | 0, 2 | **MVP** — roll-call, timetable, substitutions, door import ([PHASE_D_DELIVERY.md](./PHASE_D_DELIVERY.md)) |
| 6 | E-Learning / LMS | 0, 2 | **MVP** — courses, assignments, live links, gradebook ([PHASE_D_LMS_DELIVERY.md](./PHASE_D_LMS_DELIVERY.md)); exams/quizzes legacy API retained |
| 9 | HR & Teacher Management | 0 | Evolve `Teacher` + leave/payroll |

### Phase 2 — Physical identity & access

| ID | Module | Depends on |
|----|--------|------------|
| 3 | ID Card Generation | 2 |
| 4 | IoT Door Access | 3 |

### Phase 3 — Finance & assets

| ID | Module | Depends on |
|----|--------|------------|
| 8 | Fee & Finance | 0, 2 |
| 7 | E-Library | 0 |

### Phase 4 — Community & ancillary

| ID | Module | Depends on |
|----|--------|------------|
| 10 | PTA & Parent engagement | 0, 2 |
| 11 | Transport & Cafeteria | 0, 2 |
| 12 | Analytics & BI | 1–11 |

---

## Module 0 — Technical specification

### RBAC roles (seeded)

`SUPER_ADMIN`, `SCHOOL_ADMIN`, `ACADEMIC_HEAD`, `TEACHER`, `ACCOUNTANT`, `STUDENT`, `PARENT`, `LIBRARIAN`, `REGISTRAR`, `SECURITY_GUARD`

Permissions use `module.resource.action` (e.g. `admissions.applicant.review`). Legacy logins (`admin` / `teacher` / `student`) map to `SCHOOL_ADMIN`, `TEACHER`, `STUDENT` until unified `UserAccount` migration.

### Multi-tenant

- **Organization** — legal entity (one school group).
- **Campus** — physical site; hosts tier(s).
- Request headers: `X-Campus-Id`, `X-Tier` (optional; enforced on scoped routes).

### Audit trail

Immutable `AuditLog` rows: actor, entity, before/after JSON, campus, IP.

### Notifications (stub)

`NotificationQueue` — channel `SMS` | `WHATSAPP` | `EMAIL` | `PUSH`; processed by future worker.

### SSO (planned)

OAuth2 placeholders for Google Workspace & Microsoft 365 on `UserAccount` — not implemented in Phase 0.

---

## Mapping existing code → modules

| Current feature | Target module |
|-----------------|---------------|
| Admin / Teacher / Student auth | Module 0 (+ unified auth later) |
| Class levels, programs, subjects | Module 2 + tier-scoped grades |
| Exams, questions, results | Module 6 (Quiz Maker + Gradebook) |
| Year groups, academic years | Module 2 + 5 |

---

## API conventions (new)

- Foundation routes: `/api/v1/foundation/*`
- Permission guard: `requirePermission('module.resource.action')`
- All new tables include `campusId` and `tier` where applicable
