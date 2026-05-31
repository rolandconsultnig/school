# SchoolPortal

Full-stack school management for Nigeria Nursery · Primary · Secondary — **Express API** (PostgreSQL + Prisma) and **React** staff/student/parent portal.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- Create, update, and delete student and staff records.
- Manage courses, attendance, result, and grades.
- Manage Online Exam, result, and grades.
- User authentication and authorization.
- API endpoints for interacting with the frontend      
  application.
- Scalable and maintainable codebase.

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JSON Web Tokens (JWT) for authentication
- Bcrypt for password hashing

## Getting Started
### Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js 14 + and npm installed on your development machine.
- PostgreSQL 14+ installed and running.

### Installation

1. Clone this repository and install dependencies:

```sh
git clone https://github.com/iamtonmoy0/node-express-school-management-system.git
cd school-management-system
npm install
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET_KEY`.

3. Create the database schema:

```sh
npm run db:migrate
```

4. Seed roles, permissions, and Nigeria grade catalog (Nursery / Primary / Secondary):

```sh
npm run db:seed
```

5. Start the API (port **3900**) and React app (port **3905**):

```sh
npm run dev
```

To run only the API or only the UI: `npm run dev:api` or `npm run dev:web`.

Copy `web/.env.example` to `web/.env` and set `VITE_API_URL=http://localhost:3900` if needed.

**Demo logins** (after seed): `superadmin@school.local` / `SuperAdmin@123`, `student@school.local` / `Student@123`, `parent@school.local` / `Parent@123`

### Documentation

| Doc | Purpose |
|-----|---------|
| [docs/BUILD_ROADMAP.md](docs/BUILD_ROADMAP.md) | Phases A–F, sprints, what to build when |
| [docs/BUILD_SCHEME.md](docs/BUILD_SCHEME.md) | Folder layout, RBAC, DB, API conventions |
| [docs/ORIGINAL_REPO_GAP_ANALYSIS.md](docs/ORIGINAL_REPO_GAP_ANALYSIS.md) | Original GitHub repo vs this fork |
| [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) | Modules 0–12 feature list |
| [docs/API_QUICKSTART.md](docs/API_QUICKSTART.md) | Bootstrap, auth, and key endpoints |
| [docs/openapi.yaml](docs/openapi.yaml) | OpenAPI 3 spec (also at `GET /api/v1/openapi.yaml`) |
| [docs/FRONTEND.md](docs/FRONTEND.md) | React app setup |
| [docs/DEPLOY_UBUNTU_PRODUCTION.md](docs/DEPLOY_UBUNTU_PRODUCTION.md) | **Full beginner guide:** Ubuntu 24 production at `/school` |
| [docs/later.md](docs/later.md) | Remaining backlog and sprint status |
| [docs/PHASE_BC_DELIVERY.md](docs/PHASE_BC_DELIVERY.md) | Phase B & C endpoints and migration |

### Project layout

See [docs/BUILD_SCHEME.md](docs/BUILD_SCHEME.md) for the current folder structure (`controllers/`, `services/`, `routes/v1/`, `prisma/`, `web/`). Legacy Mongoose `models/` paths are no longer used.

