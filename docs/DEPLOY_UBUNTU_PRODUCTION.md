# Deploy SchoolPortal on Ubuntu Server 24 (production)

Guide for a **shared** production host where this app is exposed at **`/school`** (not the domain root).

| Item | Value |
|------|--------|
| Server IP (example) | `129.121.73.137` |
| Public UI | `http://129.121.73.137/school/` |
| Public API | `http://129.121.73.137/school/api/v1/...` |
| App directory | `/var/www/schoolportal` |
| Node API (internal) | `127.0.0.1:5341` |
| Process manager | PM2 (already installed) |
| Database | PostgreSQL (already installed) |
| Reverse proxy | **nginx** (install in steps below) |

Use a **dedicated PostgreSQL database and user** so other apps on the same server are isolated. Use port **5341** (or another free port) so you do not clash with other Node apps.

---

## Overview

```text
Browser
   │
   ▼
nginx :80  (/school → static, /school/api → proxy)
   │
   ├──► /var/www/schoolportal/web/html/school/   (Vite build)
   │
   └──► 127.0.0.1:5341  (Express API, PM2)
              │
              └──► PostgreSQL schoolportal_db
```

---

## 1. Server prep (run as a user with sudo)

```bash
sudo apt update
sudo apt install -y git nginx
sudo systemctl enable nginx
```

Confirm Node and PM2:

```bash
node -v    # v18+ recommended
npm -v
pm2 -v
psql --version
```

Create app directory (adjust if your org uses another path):

```bash
sudo mkdir -p /var/www/schoolportal
sudo chown "$USER:$USER" /var/www/schoolportal
```

---

## 2. Deploy application code

On the server:

```bash
cd /var/www/schoolportal
git clone <YOUR_REPO_URL> .
# or: rsync/scp from your dev machine into /var/www/schoolportal
```

Install dependencies (production — no dev servers):

```bash
cd /var/www/schoolportal
npm ci --omit=dev
# If postinstall fails without dev prisma CLI, run once with dev deps then prune:
# npm ci && npx prisma generate && npm prune --omit=dev
```

Ensure upload directory exists and is writable:

```bash
mkdir -p /var/www/schoolportal/uploads
chmod 755 /var/www/schoolportal/uploads
```

---

## 3. PostgreSQL database

Connect as a superuser (often `postgres`):

```bash
sudo -u postgres psql
```

In `psql`:

```sql
CREATE USER schoolportal_app WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
CREATE DATABASE schoolportal_db OWNER schoolportal_app;
GRANT ALL PRIVILEGES ON DATABASE schoolportal_db TO schoolportal_app;
\q
```

---

## 4. Environment files

### API — `/var/www/schoolportal/.env`

```bash
cd /var/www/schoolportal
cp .env.production.example .env
nano .env
```

Example (edit secrets and password):

```env
NODE_ENV=production
PORT=5341

DATABASE_URL=postgresql://schoolportal_app:REPLACE_WITH_STRONG_PASSWORD@127.0.0.1:5432/schoolportal_db?schema=public
JWT_SECRET_KEY=REPLACE_WITH_LONG_RANDOM_STRING

FRONTEND_URL=http://129.121.73.137/school
```

Generate a JWT secret:

```bash
openssl rand -base64 48
```

Lock down permissions:

```bash
chmod 600 /var/www/schoolportal/.env
```

### Frontend build — `web/.env.production`

```bash
cp web/.env.production.example web/.env.production
nano web/.env.production
```

```env
VITE_BASE_PATH=/school/
VITE_API_URL=http://129.121.73.137/school
```

When you add HTTPS and a domain, change both `FRONTEND_URL`, `VITE_API_URL`, and OAuth/Paystack URLs to `https://...`.

---

## 5. Database schema and seed

```bash
cd /var/www/schoolportal
npx prisma migrate deploy
npm run db:seed
```

If migrations are not set up yet on this fork:

```bash
npm run db:push
npm run db:seed
```

---

## 6. Build the React UI

```bash
cd /var/www/schoolportal
npm run build:web
```

Publish static files where nginx expects them:

```bash
mkdir -p /var/www/schoolportal/web/html/school
rm -rf /var/www/schoolportal/web/html/school/*
cp -r /var/www/schoolportal/web/dist/* /var/www/schoolportal/web/html/school/
```

After every UI deploy, repeat `npm run build:web` and the `cp` step.

---

## 7. Start API with PM2

```bash
cd /var/www/schoolportal
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# run the command `pm2 startup` prints (sudo env PATH=...)
```

Check API locally (should not be exposed publicly if firewall is tight):

```bash
curl -s http://127.0.0.1:5341/
# → Server is running!
```

Logs:

```bash
pm2 logs schoolportal-api
pm2 status
```

---

## 8. Configure nginx (shared server, path `/school`)

Copy the snippet from the repo:

```bash
sudo cp /var/www/schoolportal/deploy/nginx-schoolportal.conf /etc/nginx/snippets/schoolportal.conf
```

Edit your **existing** default site or main vhost (do not overwrite other apps):

```bash
sudo nano /etc/nginx/sites-available/default
```

Inside the `server { ... }` block that handles `129.121.73.137`, add **one line**:

```nginx
include snippets/schoolportal.conf;
```

If `PORT` in `.env` is not `5341`, edit `snippets/schoolportal.conf` and change `127.0.0.1:5341` to your port.

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Optional: redirect `/school` → `/school/`:

```nginx
location = /school {
    return 301 /school/;
}
```

(Add that in the same `server` block, outside or before the include, if you want.)

---

## 9. Firewall

Allow HTTP/HTTPS only (API stays on localhost):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do **not** open port `5341` publicly unless you intentionally expose the API.

---

## 10. Verify in the browser

| Check | URL |
|--------|-----|
| Landing page | http://129.121.73.137/school/ |
| Login | http://129.121.73.137/school/login |
| API health | http://129.121.73.137/school/api/v1/... (after login via UI) |
| OpenAPI | http://129.121.73.137/school/api/v1/openapi.yaml |

**Demo logins** (after seed):

| Role | Email | Password |
|------|--------|----------|
| Super admin | `superadmin@school.local` | `SuperAdmin@123` |
| Student | `student@school.local` | `Student@123` |
| Parent | `parent@school.local` | `Parent@123` |

Change these passwords immediately in production.

---

## 11. HTTPS (recommended when you have a domain)

Point DNS to `129.121.73.137`, then:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-school-domain.com
```

Update `.env` and `web/.env.production` to `https://your-school-domain.com/school`, rebuild the UI, reload PM2, and reload nginx.

---

## 12. Updates / redeploy checklist

```bash
cd /var/www/schoolportal
git pull
npm ci --omit=dev
npx prisma migrate deploy
npm run build:web
cp -r web/dist/* web/html/school/
pm2 restart schoolportal-api
sudo nginx -t && sudo systemctl reload nginx
```

---

## 13. Optional: notification worker

If SMTP or Termii is configured in `.env`:

```bash
pm2 start workers/notificationWorker.js --name schoolportal-notifications
pm2 save
```

Or uncomment the worker block in `ecosystem.config.cjs`.

---

## 14. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| 502 on `/school/api/` | `pm2 status`, `curl http://127.0.0.1:5341/`, `PORT` in `.env` vs nginx `proxy_pass` |
| 404 on `/school/login` | Static files in `web/html/school/`, `portal.html` present, nginx `map` / fallback |
| Blank page / wrong assets | Rebuild with `VITE_BASE_PATH=/school/` in `web/.env.production` |
| API calls go to wrong host | `VITE_API_URL` must be `http://129.121.73.137/school` (no trailing slash) |
| DB connection failed | `DATABASE_URL`, Postgres running: `sudo systemctl status postgresql` |
| CORS errors | API uses open CORS; usually wrong `VITE_API_URL` or mixed http/https |

nginx error log:

```bash
sudo tail -f /var/log/nginx/error.log
```

PM2 logs:

```bash
pm2 logs schoolportal-api --lines 100
```

---

## 15. Multi-app coexistence notes

- **Unique PM2 name:** `schoolportal-api` (avoid generic names like `api`).
- **Unique port:** `5341` in `.env` (confirm free: `ss -tlnp | grep 5341`).
- **Unique DB:** `schoolportal_db` only for this app.
- **Unique URL prefix:** `/school` only in nginx; other apps use their own `location /otherapp/`.
- **Include, don’t replace:** add `include snippets/schoolportal.conf;` to the existing `server` block.

---

## Related files in the repo

| File | Purpose |
|------|---------|
| `.env.production.example` | API env template |
| `web/.env.production.example` | Vite build env template |
| `ecosystem.config.cjs` | PM2 process definition |
| `deploy/nginx-schoolportal.conf` | nginx locations for `/school` |
| [DEPLOY.md](./DEPLOY.md) | General deployment notes |
