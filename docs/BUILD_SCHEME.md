# SchoolPortal — Build Scheme (Architecture & Conventions)

Follow this scheme for every new feature so the codebase stays consistent from the original Express starter through Modules 0–12.

---

## 1. Repository layout

```
SchoolPortal/
├── app/app.js                 # Express app, middleware, routeSync
├── server.js                  # HTTP server + dbConnect
├── config/dbConnect.js
├── prisma/
│   ├── schema.prisma          # Single source of truth for data
│   └── seed.js
├── routes/v1/{domain}/        # One router per resource group
├── controllers/{domain}/      # Thin: try/catch, call service
├── services/{domain}/         # Business logic + Prisma
├── middlewares/               # Auth, RBAC, tenant
├── lib/                       # Shared: rbac, audit, modules, nigeria
├── handlers/                  # passHash, responseStatus, routeSync
├── functions/                 # Pure helpers (e.g. resultCalculate)
├── utils/                     # serialize, entityIds, tokens
└── docs/                      # Roadmaps and specs
```

### Domain folders

| Folder | Scope |
|--------|--------|
| `foundation` | Module 0 — org, campus, tiers, RBAC, audit, notifications |
| `staff` | Admin, teacher (→ HR Module 9 later) |
| `students` | Student auth & profiles (→ SIS Module 2) |
| `academic` | Terms, years, classes, programs, subjects, exams (→ LMS Module 6) |
| `admissions` | Module 1 (new) |
| `attendance` | Module 5 (new) |
| `finance` | Module 8 (new) |
| … | Add folder when module starts |

**Rule:** New modules get `routes/v1/<domain>/` + `routeSync(app, "<domain>")` in `app/app.js`.

---

## 2. Request flow (mandatory)

```
HTTP Request
  → middleware: isLoggedIn (JWT)
  → middleware: attachActor (resolve Admin/Teacher/Student/UserAccount)
  → middleware: tenantContext (X-Campus-Id, X-Tier)
  → middleware: requirePermission('module.resource.action')  [when protected]
  → controller
  → service
  → prisma
  → serializeForApi (response shape with _id)
  → createAuditLog (mutations in Module 0+)
```

---

## 3. Database conventions (Prisma)

### 3.1 Every school-scoped table

Add when creating or extending models:

```prisma
campusId  String?
campus    Campus? @relation(...)
tier      SchoolTier?   // NURSERY | PRIMARY | SECONDARY
```

### 3.2 IDs and API compatibility

- Primary keys: `uuid()` in Postgres.
- Responses: use `serializeForApi()` so clients still receive `_id`.

### 3.3 Schema change process

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate` (name migration clearly, e.g. `add_admissions_applicant`).
3. Update seed if reference data changes.
4. Update service + permission in `lib/rbac/permissions.js`.

### 3.4 Soft deletes (recommended from Phase C)

Add `deletedAt DateTime?` on person-facing entities (Student, Teacher, Applicant).

---

## 4. RBAC convention

| Item | Rule |
|------|------|
| Permission code | `{module}.{resource}.{action}` e.g. `sis.student.manage` |
| Route protection | `requirePermission('...')` after `attachActor` |
| New feature | Add permission to `PERMISSIONS` + `ROLE_PERMISSIONS` + seed |
| Legacy JWT users | Mapped via `LEGACY_ROLE_MAP` until `UserAccount` migration |

---

## 5. Multi-tenant headers

| Header | Example | Required when |
|--------|---------|----------------|
| `Authorization` | `Bearer <jwt>` | Protected routes |
| `X-Campus-Id` | uuid | Campus-scoped CRUD |
| `X-Tier` | `PRIMARY` | Tier-scoped lists and enrollment |

---

## 6. API versioning

- Current: `/api/v1/...`
- Breaking changes: introduce `/api/v2` — do not silently break v1 (frontend may exist later).

---

## 7. Module → permission prefix

| Module | ID | Permission prefix |
|--------|-----|-------------------|
| Infrastructure | 0 | `system.*` |
| Admissions | 1 | `admissions.*` |
| SIS | 2 | `sis.*` |
| ID Card | 3 | `idcard.*` |
| IoT Access | 4 | `access.*` |
| Attendance | 5 | `attendance.*` |
| LMS | 6 | `lms.*` |
| Library | 7 | `library.*` |
| Finance | 8 | `finance.*` |
| HR | 9 | `hr.*` |
| PTA | 10 | `pta.*` |
| Ancillary | 11 | `ancillary.*` |
| Analytics | 12 | `analytics.*` |

---

## 8. Nigeria tier → grade mapping

Use seeded `GradeLevel` records (`NG_NUR_*`, `NG_PRI_*`, `NG_JSS_*`, `NG_SS_*`).

| Tier | Grades |
|------|--------|
| NURSERY | Pre-Nursery, Nursery 1–2 |
| PRIMARY | Primary 1–6 |
| SECONDARY | JSS 1–3, SS 1–3 |

`ClassLevel` should reference `gradeLevelId` + `tier` + `section` (e.g. `"A"`, `"B"`).

---

## 9. New entity checklist

When adding a feature:

- [ ] Prisma model + migration
- [ ] Permission(s) + seed role mapping
- [ ] Service function(s)
- [ ] Controller + router
- [ ] `campusId` / `tier` where applicable
- [ ] Audit log on create/update/delete
- [ ] Entry in `docs/ORIGINAL_REPO_GAP_ANALYSIS.md` or module section
- [ ] Manual test via curl/Postman

---

## 10. What not to do

- Do not add Mongoose or MongoDB drivers back.
- Do not create duplicate auth systems without migrating to `UserAccount`.
- Do not skip `serializeForApi` on new endpoints (breaks existing client expectations).
- Do not implement Module 4 IoT without Module 3 ID linkage.
- Do not build frontend inside this repo unless explicitly requested (keep API-first).

---

## 11. Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET_KEY` | Token signing |
| `PORT` | Server port |
| `SEED_SUPER_ADMIN_EMAIL` | Optional seed override |
| `SEED_SUPER_ADMIN_PASSWORD` | Optional seed override |
| Future: `GOOGLE_CLIENT_ID`, `SMTP_*`, `PAYSTACK_*`, etc. per module |
