# Original Repo vs SchoolPortal — Gap Analysis

**Original:** [github.com/iamtonmoy0/node-express-school-management-system](https://github.com/iamtonmoy0/node-express-school-management-system)  
**Fork:** `SchoolPortal` (this project)

---

## Summary

| Category | Original | SchoolPortal today | Action |
|----------|----------|-------------------|--------|
| Database | MongoDB + Mongoose | PostgreSQL + Prisma | ✅ Done — do not revert |
| File tree | ~68 source files | Same structure + `foundation`, `prisma`, `lib`, `docs` | ✅ Extended |
| API routes | ~45 endpoints | Same routes + foundation APIs | Port + fix |
| Working features | ~70% (many stubs) | **Phase A delivered** | Maintain |
| Nigeria tiers | ❌ | ✅ Seed + schema | Keep extending |
| Modules 0–12 | ❌ | Module 0 partial | **Phases B–F** |
| `vercel.json` | ✅ | Check repo — redeploy config | Port if missing |
| Tests | ❌ | ❌ | Add in Phase A |

---

## What the original repo contains (inventory)

### Stack (original)

- Node.js, Express 4, Mongoose 7, MongoDB
- JWT, bcrypt, cors, morgan, dotenv
- `vercel.json` for serverless deploy
- **No frontend**, no tests, no OpenAPI

### Entities (12 Mongoose models)

| Model | Purpose |
|-------|---------|
| Admin | School administrator hub |
| Teacher | Staff, exams, suspend/withdraw flags |
| Student | Enrollment, exam results |
| AcademicTerm / AcademicYear | Calendar |
| ClassLevel | Cohorts |
| Program | Degree/track |
| Subject | Linked to program & term |
| YearGroup | Cohort by year |
| Exam | Online exam metadata |
| Question | MCQ blocks |
| ExamResult | Graded attempts |

### API routes (original) — all under `/api/v1`

#### Staff / Admin

| Method | Path | Original status | SchoolPortal |
|--------|------|-----------------|--------------|
| POST | `/admin/register` | ✅ Service | ✅ Prisma |
| POST | `/admin/login` | ✅ | ✅ |
| GET | `/admins` | ✅ | ✅ |
| GET | `/admin/profile` | ✅ populate | ✅ Prisma includes |
| PUT | `/admin/:id` | ✅ | ✅ |
| DELETE | `/admin/:id` | 🔴 **Stub** JSON only | 🔴 Still stub |
| PUT | `/admins/suspend/teacher/:id` | 🔴 **Stub** | 🔴 Still stub |
| PUT | `/admins/unsuspend/teacher/:id` | 🔴 **Stub** | 🔴 Still stub |
| PUT | `/admins/withdraw/teacher/:id` | 🔴 **Stub** | 🔴 Still stub |
| PUT | `/admins/unwithdraw/teacher/:id` | 🔴 **Stub** | 🔴 Still stub |
| PUT | `/admins/publish/result/:id` | 🔴 **Stub** | 🔴 Still stub |
| PUT | `/admins/unpublish/result/:id` | 🔴 **Stub** (wrong controller) | 🔴 Still stub |

#### Teachers

| Method | Path | Original status | SchoolPortal |
|--------|------|-----------------|--------------|
| POST | `/create-teacher` | ✅ | ✅ |
| POST | `/teacher/login` | ✅ | ✅ |
| GET | `/teachers` | ✅ | ✅ |
| GET | `/teacher/:teacherId/profile` | ✅ | ✅ |
| PATCH | `/teacher/update-profile` | ✅ | ✅ |
| PATCH | `/teacher/:teachersId/update-profile` | ✅ | ✅ |

#### Students

| Method | Path | Original status | SchoolPortal |
|--------|------|-----------------|--------------|
| POST | `/students/admin/register` | ✅ | ✅ |
| POST | `/students/login` | ✅ (password select typo) | ✅ Fixed |
| GET | `/students/profile` | ✅ | ✅ |
| GET | `/admin/students` | 🟡 `res` bug in service | ✅ Fixed |
| GET | `/:studentId/admin` | 🟡 Wrong id in controller | ✅ Fixed |
| PATCH | `/update` | ✅ | ✅ |
| PATCH | `/:studentId/update/admin` | 🟡 Missing res param | ✅ Fixed |
| POST | `/students/:examId/exam-write` | 🟡 Bugs in result save | ✅ Improved Prisma |

#### Academic (CRUD pattern: list, get, create, update, delete)

| Resource | Base path | Original | SchoolPortal |
|----------|-----------|----------|--------------|
| Academic term | `/academic-term` | ✅ | ✅ |
| Academic year | `/academic-years` | ✅ (Admin import bug in service) | ✅ Fixed |
| Class levels | `/class-levels` | ✅ | ✅ |
| Programs | `/programs` | ✅ | ✅ |
| Subjects | `/subject`, `/create-subject/:programId` | ✅ | ✅ |
| Year group | `/year-group` | ✅ | ✅ |
| Exams | `/exams` | ✅ | ✅ |
| Questions | `/question`, `/questions/:examId/create` | 🟡 Wrong import in controller | ✅ Fixed |
| Results | `/exam-result/:examId/check`, `/exam-results/:classLevelId` | 🟡 Logic bugs | 🟡 Review auth check |

---

## What SchoolPortal added (not in original)

| Addition | Location | Purpose |
|----------|----------|---------|
| Prisma schema + migrations | `prisma/` | PostgreSQL |
| Module 0 models | `schema.prisma` | Org, Campus, RBAC, Audit, Notifications |
| Nigeria grade catalog | `lib/nigeria/gradeCatalog.js` + seed | Nursery / Primary / Secondary |
| Foundation API | `routes/v1/foundation/` | Tiers, org, campus, roles, audit |
| RBAC middleware | `lib/rbac/`, `requirePermission` | Module 0 |
| `serializeForApi` | `utils/serialize.js` | `_id` compatibility |
| `attachActor`, `tenantContext` | `middlewares/` | Multi-tenant |
| Bug fixes | controllers/services | See table above |
| Documentation | `docs/` | Roadmap + scheme |

---

## What to port from original (Phase A backlog)

Priority **P0** — complete behavior that existed as routes but never worked:

1. **Teacher suspend / unsuspend** — set `Teacher.isSuspended`
2. **Teacher withdraw / unwithdraw** — set `Teacher.isWithdrawn`
3. **Publish / unpublish exam result** — set `ExamResult.isPublished` (wire `adminPublishResultService`)
4. **Delete admin** — soft or hard delete with safeguards
5. **Secure admin routes** — add `isLoggedIn` + `isAdmin` on suspend/publish/delete (original had none)
6. **Exam write flow** — ensure questions loaded before `resultCalculate` (Prisma include)
7. **Results check** — `studentId` + `examId` composite, not “any result by student”

Priority **P1** — original design gaps to fix while porting:

8. **First admin bootstrap** — public `POST /admin/setup` or seed-only (original: register requires existing admin)
9. **Subject POST** — only admin could create; verify `isAdmin` on all academic mutators
10. **Populate exam questions** on get exam / write exam
11. **`vercel.json`** — keep deploy path if using Vercel
12. **README API table** — document all endpoints (original README empty)

---

## What NOT to take from original

| Item | Reason |
|------|--------|
| Mongoose models | Replaced by Prisma |
| `mongodb` package | Removed |
| `isStudent` checking Teacher model | Bug — fixed in SchoolPortal |
| Implicit global in `resultCalculate` | Fixed |
| Duplicate/unauthenticated admin mutations | Security fix required |

---

## New modules vs original features

| Your module | Overlap with original | Build strategy |
|-------------|----------------------|----------------|
| **0 Infrastructure** | New | Continue foundation; audit + notifications |
| **1 Admissions** | None | New `admissions/` domain; enrollment calls `students` service |
| **2 SIS** | Extends Student model | Add profile tables; keep existing student routes |
| **3 ID Card** | None | New; links to Student + Staff |
| **4 IoT** | None | New microservice + webhooks |
| **5 Attendance** | README mentioned only | New; no code in original |
| **6 LMS** | **Exams + questions + results** | Evolve `academic/` — do not rewrite from scratch |
| **7 Library** | None | New |
| **8 Finance** | None | New |
| **9 HR** | **Teacher** partial | Evolve `staff/teachers` |
| **10 PTA** | None | New Parent model + routes |
| **11 Ancillary** | None | New |
| **12 Analytics** | None | New; reads aggregated Prisma views |

---

## Recommended merge strategy with original repo

1. **Do not re-clone over SchoolPortal** — you would lose Prisma, foundation, and fixes.
2. **Use original as API contract reference** — same paths for backward compatibility.
3. **Cherry-pick only if** original gets bugfixes upstream; port manually into services.
4. **Track upstream** — optional git remote `upstream` → `iamtonmoy0/node-express-school-management-system`.

```sh
git remote add upstream https://github.com/iamtonmoy0/node-express-school-management-system.git
git fetch upstream
# compare: git diff upstream/main -- routes services
```

---

## File-by-file: original-only vs changed

| Path | In original | In SchoolPortal |
|------|-------------|-----------------|
| `models/**/*.model.js` | ✅ | ❌ Removed (use Prisma) |
| `prisma/schema.prisma` | ❌ | ✅ |
| `lib/**` | ❌ | ✅ |
| `routes/v1/foundation/**` | ❌ | ✅ |
| `middlewares/attachActor.js` etc. | ❌ | ✅ |
| `docs/**` | ❌ | ✅ |
| All other routes/controllers/services | ✅ | ✅ (Prisma-backed) |

---

## Phase A sprint backlog

```
[x] A1  Teacher suspend/unsuspend/withdraw + audit
[x] A2  Publish/unpublish results (by examId, updateMany)
[x] A3  Delete admin with auth + safeguards
[x] A4  protectedRoute + permissions on admin/student/class routes
[x] A5  campusId + tier on student register and class create
[x] A6  getAllExamResults filters by teacherId
[x] A7  POST /admin/setup bootstrap
[ ] A8  OpenAPI spec
[ ] A9  Integration tests
[x] A10 isLoggedIn hardening + global error handler
[x] A11 Question duplicate check fix
[x] A12 Teacher login blocks withdrawn/suspended
```

See [API_QUICKSTART.md](./API_QUICKSTART.md).

---

## Related

- [BUILD_ROADMAP.md](./BUILD_ROADMAP.md)
- [BUILD_SCHEME.md](./BUILD_SCHEME.md)
- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)
