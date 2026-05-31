# Deployment notes

**Ubuntu 24 production (step-by-step for beginners, shared server, path `/school`):** see [DEPLOY_UBUNTU_PRODUCTION.md](./DEPLOY_UBUNTU_PRODUCTION.md).

## API (Node + PostgreSQL)

- Set `DATABASE_URL`, `JWT_SECRET_KEY`, `PORT` (default **3900**).
- Run migrations: `npm run db:push` and `npm run db:seed`.
- Start API: `npm run start` or `npm run dev`.
- Optional: `npm run worker:notifications` for SMS/email queue.

## Frontend (Vite)

- Build: `npm run build:web` → static files in `web/dist`.
- Set `VITE_API_URL` to your API origin (e.g. `https://api.yourschool.com`).
- Serve `web/dist` with any static host (Netlify, Vercel static, nginx).

## Vercel (`vercel.json`)

The repo includes a serverless entry on `server.js`. For production:

- Use **external PostgreSQL** (Vercel Postgres, Neon, RDS) — set `DATABASE_URL`.
- **Uploads**: local disk is ephemeral on serverless; configure **AWS S3** env vars (see `.env.example`) or external storage.
- Prefer deploying **API** and **web** separately: API on a Node host, SPA on CDN.

## Health check

- `GET /` → `Server is running!`
- `GET /api/v1/openapi.yaml` → OpenAPI spec
