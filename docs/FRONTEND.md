# SchoolPortal Web Frontend

React + Vite app in `web/`, styled after **School ERP Client** (sidebar, role nav) and **Edu Insights** (stat cards, clean dashboard). All data comes from your API via `src/api/client.ts` — no mocks.

## Run locally

From the repo root (starts API on **3900** and Vite on **3905**):

```sh
cd c:\Projects\SchoolPortal
npm install
npm run dev
```

UI only: `npm run dev:web`. API only: `npm run dev:api`.

Open http://localhost:3905 for the **De Ayo** public landing page. The school portal (login, dashboard, modules) lives at `/login`, `/dashboard`, `/apply`, etc. Vite proxies `/api` and `/uploads` to port **3900**.

Landing page source: `deayo-kiddies-college.html` (copied to `web/index.html`). React app shell: `web/portal.html`.

## Login

| Portal | Demo credentials |
|--------|------------------|
| Staff | `superadmin@school.local` / `SuperAdmin@123` |
| Student | Register via API or seed a student |
| Parent | Register via `POST /api/v1/parents/register` |

Staff login uses `POST /api/v1/auth/login`. Campus and tier are loaded from `GET /api/v1/foundation/bootstrap` and sent as `X-Campus-Id` / `X-Tier` on every request.

## Integrated modules

| UI route | API |
|----------|-----|
| Dashboard | Aggregates students, courses, inquiries, sessions |
| Students | `/admin/students`, `/sis/students/:id/profile` |
| Classes | `/class-levels` |
| Admissions | `/admissions/inquiries`, `/admissions/applicants` |
| Attendance | `/attendance/sessions`, create roll-call |
| LMS | `/lms/courses`, course detail, gradebook |
| Teachers | `/teachers` |
| Settings | `/foundation/audit-logs` |
| Student gradebook | `/lms/student/gradebook` |
| Parent messages | `/pta/messages/parent/me` |

## Build for production

```sh
npm run build:web
```

Serve `web/dist` behind nginx or Express static. If the API is on another host, set in `web/.env`:

```env
VITE_API_URL=http://localhost:3900
```

Public admissions (no staff login): `/apply`, `/apply/register`, `/apply/login`, `/apply/portal`.
