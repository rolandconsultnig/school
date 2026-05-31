# SchoolPortal — Production deployment on Ubuntu Server 24

**Who this is for:** You are new to servers. Follow the steps in order. Copy each command, paste it into your server terminal, and press Enter.

**Your setup (from our plan):**

| Item | Value |
|------|--------|
| Server OS | Ubuntu Server 24 |
| Server IP | `129.121.73.137` |
| App URL in browser | `http://129.121.73.137/school/` |
| Code on GitHub | [https://github.com/rolandconsultnig/school](https://github.com/rolandconsultnig/school) |
| App folder on server | `/var/www/schoolportal` |
| Other apps on same server? | **Yes** — this app uses only the `/school` path |

**Already on the server:** Node.js, npm, PM2, PostgreSQL  
**You will install:** nginx (web server / reverse proxy)

---

## Table of contents

1. [What you are building (simple picture)](#1-what-you-are-building-simple-picture)
2. [Words you will see](#2-words-you-will-see)
3. [Before you start — checklist](#3-before-you-start--checklist)
4. [Connect to your server (SSH)](#4-connect-to-your-server-ssh)
5. [Install nginx](#5-install-nginx)
6. [Download the app from GitHub](#6-download-the-app-from-github)
7. [Install Node packages](#7-install-node-packages)
8. [Create the PostgreSQL database](#8-create-the-postgresql-database)
9. [Create secret config files (.env)](#9-create-secret-config-files-env)
10. [Create database tables and demo data](#10-create-database-tables-and-demo-data)
11. [Build the website (React)](#11-build-the-website-react)
12. [Start the API with PM2](#12-start-the-api-with-pm2)
13. [Configure nginx for /school](#13-configure-nginx-for-school)
14. [Firewall (optional but recommended)](#14-firewall-optional-but-recommended)
15. [Test in your browser](#15-test-in-your-browser)
16. [After go-live — change demo passwords](#16-after-go-live--change-demo-passwords)
17. [How to update the app later](#17-how-to-update-the-app-later)
18. [When something goes wrong](#18-when-something-goes-wrong)
19. [Adding HTTPS later (domain name)](#19-adding-https-later-domain-name)

---

## 1. What you are building (simple picture)

When a user visits `http://129.121.73.137/school/`:

```text
  User's phone/laptop
         │
         ▼
    nginx (port 80)          ← Installed in Step 5. Faces the internet.
         │
         ├── /school/          → Frontend (Vite preview) on port 3905
         │
         └── /school/api/      → Backend API (Node/Express) on port 3900
                                    │
                                    ▼
                              PostgreSQL database (port 5432)
```

**This app uses two ports (both hidden inside the server, only nginx is public):**

| Part | Port | PM2 name |
|------|------|----------|
| Backend API | **3900** | `schoolportal-api` |
| Frontend (website) | **3905** | `schoolportal-web` |

- **nginx** = front door; also serves other apps on the same server at different paths.
- **Node (PM2)** = runs the API (3900) and the website (3905); both listen on `127.0.0.1` only.
- **PostgreSQL** = stores students, staff, grades, etc.

---

## 2. Words you will see

| Word | Meaning |
|------|---------|
| **SSH** | Secure way to log into the server from your PC (like remote control). |
| **Terminal / shell** | Black window where you type commands. |
| **sudo** | “Run as administrator” on Linux. |
| **nginx** | Web server; sends visitors to the right app. |
| **PM2** | Keeps Node running; restarts it if it crashes. |
| **`.env`** | Secret settings file (passwords). **Never** put on GitHub. |
| **migrate / seed** | Create tables; add starter roles and demo users. |
| **`/school`** | URL prefix so this app does not clash with other apps on the server. |

---

## 3. Before you start — checklist

- [ ] You can log in to the Ubuntu server (SSH or console).
- [ ] Your Linux user can run `sudo` (admin).
- [ ] You know the PostgreSQL **postgres** user password (or you can use `sudo -u postgres`).
- [ ] Ports **3900** (backend) and **3905** (frontend) are free (we use them for this app only):

```bash
ss -tlnp | grep -E '3900|3905'
```

If nothing prints, the ports are free. If something is using them, pick other free ports and use them everywhere this guide says `3900` / `3905`.

- [ ] You have the GitHub repo URL: `https://github.com/rolandconsultnig/school.git`

---

## 4. Connect to your server (SSH)

**On Windows (PowerShell):**

```powershell
ssh your_username@129.121.73.137
```

Replace `your_username` with your Linux login (e.g. `ubuntu`, `deploy`, `root`).

**First time:** type `yes` when asked about fingerprint, then enter your password or use your SSH key.

You should see a prompt like:

```text
your_username@servername:~$
```

All following commands run **on the server**, not on your Windows PC (unless we say otherwise).

---

## 5. Install nginx

```bash
sudo apt update
```

Wait until it finishes (no errors).

```bash
sudo apt install -y git nginx
```

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Check nginx is running:**

```bash
sudo systemctl status nginx
```

Look for `active (running)`. Press `q` to exit.

**Check tools you already have:**

```bash
node -v
npm -v
pm2 -v
psql --version
```

Node should be **v18 or newer**. If `node` is missing, install Node 20 LTS before continuing (ask your host or use NodeSource packages).

**Create the app folder:**

```bash
sudo mkdir -p /var/www/schoolportal
sudo chown "$USER:$USER" /var/www/schoolportal
```

---

## 6. Download the app from GitHub

```bash
cd /var/www/schoolportal
git clone https://github.com/rolandconsultnig/school.git .
```

The `.` at the end means “clone into this folder”.

**Check files are there:**

```bash
ls
```

You should see `package.json`, `server.js`, `web`, `prisma`, etc.

**Create folder for uploaded files (photos, documents):**

```bash
mkdir -p uploads
chmod 755 uploads
```

---

## 7. Install Node packages

This downloads libraries the app needs (can take a few minutes).

```bash
cd /var/www/schoolportal
npm ci
cd web
npm ci
cd ..
```

**Generate the database client:**

```bash
npx prisma generate
```

> **Note:** The API (`npm ci` in the project root) and the website (`npm ci` in `web/`) are separate. The UI build needs TypeScript and Vite from `web/node_modules`. If you see `tsc: not found`, run `cd /var/www/schoolportal/web && npm ci` and try the build again.

---

## 8. Create the PostgreSQL database

We create a **separate** database and user for SchoolPortal so other apps on the server are not affected.

**Open PostgreSQL as admin:**

```bash
sudo -u postgres psql
```

Your prompt changes to `postgres=#`.

**Copy and paste these lines one block at a time.**  
Replace `YourStrongDbPassword123!` with a real password (save it in a password manager):

```sql
CREATE USER schoolportal_app WITH PASSWORD 'YourStrongDbPassword123!';
CREATE DATABASE schoolportal_db OWNER schoolportal_app;
GRANT ALL PRIVILEGES ON DATABASE schoolportal_db TO schoolportal_app;
\q
```

`\q` exits PostgreSQL.

**Test login (optional):**

```bash
psql "postgresql://schoolportal_app:YourStrongDbPassword123!@127.0.0.1:5432/schoolportal_db" -c "SELECT 1;"
```

You should see a table with `1` in it.

---

## 9. Create secret config files (.env)

Secrets live in `.env` files. They are **not** on GitHub.

### 9a — API secrets (`/var/www/schoolportal/.env`)

```bash
cd /var/www/schoolportal
cp .env.production.example .env
nano .env
```

In `nano`:

- Use arrow keys to move.
- Edit the values below.
- Press **Ctrl+O**, Enter to save.
- Press **Ctrl+X** to exit.

**Fill in `.env` like this** (use your real DB password):

```env
NODE_ENV=production
PORT=3900

DATABASE_URL=postgresql://schoolportal_app:YourStrongDbPassword123!@127.0.0.1:5432/schoolportal_db?schema=public
JWT_SECRET_KEY=PASTE_RANDOM_STRING_HERE
FRONTEND_URL=http://129.121.73.137/school
```

**Create a random JWT secret** (in a **new** terminal line, not inside nano):

```bash
openssl rand -base64 48
```

Copy the output into `JWT_SECRET_KEY=` in `.env`.

**Lock the file so only you can read it:**

```bash
chmod 600 /var/www/schoolportal/.env
```

### 9b — Frontend build settings (`web/.env.production`)

```bash
cd /var/www/schoolportal
cp web/.env.production.example web/.env.production
nano web/.env.production
```

Use exactly (for your IP and `/school` path):

```env
VITE_BASE_PATH=/school/
VITE_API_URL=http://129.121.73.137/school
```

> **Important:** `VITE_API_URL` has **no** trailing slash at the end.

Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

---

## 10. Create database tables and demo data

```bash
cd /var/www/schoolportal
npx prisma migrate deploy
```

If you see an error about no migrations, try:

```bash
npm run db:push
```

**Add starter data** (roles, demo users, Nigeria grade catalog):

```bash
npm run db:seed
```

This can take 30–60 seconds. When done you should see success messages, not a stack trace.

---

## 11. Build the website (React)

```bash
cd /var/www/schoolportal
cd web && npm ci && cd ..
npm run build:web
```

(`npm run build:web` installs `web` dependencies if needed, then runs `tsc` and `vite build`.)

When finished, there is a `web/dist` folder. The frontend is served from this folder by the Vite preview server on **port 3905** (started by PM2 in the next step) — you do **not** copy files anywhere.

**Quick check:**

```bash
ls /var/www/schoolportal/web/dist/
```

You should see `index.html`, `portal.html`, and an `assets` folder.

---

## 12. Start the API and website with PM2

PM2 runs both processes in the background and restarts them if they stop:

- `schoolportal-api` — backend API on port **3900**
- `schoolportal-web` — frontend (Vite preview) on port **3905**

```bash
cd /var/www/schoolportal
pm2 start ecosystem.config.cjs
```

**Check status:**

```bash
pm2 status
```

You want **both** `schoolportal-api` and `schoolportal-web` with status **online**.

**Test on the server only** (works even before nginx):

```bash
curl -s http://127.0.0.1:3900/        # backend → "Server is running!"
curl -s -I http://127.0.0.1:3905/school/   # frontend → HTTP/1.1 200 OK
```

If you see `Connection refused`:

```bash
pm2 logs schoolportal-api --lines 50
pm2 logs schoolportal-web --lines 50
```

Common fixes: wrong `DATABASE_URL`, PostgreSQL not running (`sudo systemctl status postgresql`), wrong `PORT` in `.env`, or the UI was not built yet (`npm run build:web`).

**Save PM2 list so it survives reboot:**

```bash
pm2 save
pm2 startup
```

`pm2 startup` prints a **long command** starting with `sudo env PATH=...` — **copy that entire line, paste it, press Enter.**

---

## 13. Configure nginx for /school

nginx must know how to serve `/school` without breaking your other apps. It forwards `/school/api/` to the backend (3900) and everything else under `/school/` to the frontend (3905).

### Step 13a — Copy the SchoolPortal config snippet

```bash
sudo cp /var/www/schoolportal/deploy/nginx-schoolportal.conf /etc/nginx/snippets/schoolportal.conf
```

If you used ports other than `3900`/`3905`, edit the snippet:

```bash
sudo nano /etc/nginx/snippets/schoolportal.conf
```

Change the `127.0.0.1:3900` (API/uploads) and `127.0.0.1:3905` (frontend) lines to your ports. Save and exit.

### Step 13b — Add one line to your main site

Open the default site file:

```bash
sudo nano /etc/nginx/sites-available/default
```

Find the `server {` block that listens on port 80 (often `listen 80;`).

**Inside** that `server { ... }` block — with your other apps’ `location` blocks — add:

```nginx
    include snippets/schoolportal.conf;
```

**Optional** (redirect `/school` to `/school/`):

```nginx
    location = /school {
        return 301 /school/;
    }
```

**Example** (your file will look different if you have other apps):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    location = /school {
        return 301 /school/;
    }

    include snippets/schoolportal.conf;

    # ... your other location blocks for other apps ...
}
```

Save and exit.

### Step 13c — Test and reload nginx

```bash
sudo nginx -t
```

You want: `syntax is ok` and `test is successful`.

```bash
sudo systemctl reload nginx
```

---

## 14. Firewall (optional but recommended)

Only open SSH and web ports. **Do not** open ports 3900 or 3905 to the public.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Type `y` if asked. Then:

```bash
sudo ufw status
```

---

## 15. Test in your browser

On your phone or PC, open:

| What | URL |
|------|-----|
| School landing page | http://129.121.73.137/school/ |
| Staff / student login | http://129.121.73.137/school/login |
| API spec (technical) | http://129.121.73.137/school/api/v1/openapi.yaml |

**Demo logins** (only for first testing — change them afterward):

| Role | Email | Password |
|------|--------|----------|
| Super admin | `superadmin@school.local` | `SuperAdmin@123` |
| Student | `student@school.local` | `Student@123` |
| Parent | `parent@school.local` | `Parent@123` |

If the page does not load, see [Section 18](#18-when-something-goes-wrong).

---

## 16. After go-live — change demo passwords

1. Log in as super admin.
2. Change passwords for all demo accounts.
3. Create real admin accounts and disable or delete demo users when ready.

Never leave `SuperAdmin@123` on a public server.

---

## 17. How to update the app later

When you push new code to GitHub:

```bash
cd /var/www/schoolportal
git pull
npm ci
cd web && npm ci && cd ..
npx prisma generate
npx prisma migrate deploy
npm run build:web
pm2 restart schoolportal-api schoolportal-web
sudo nginx -t && sudo systemctl reload nginx
```

If only the API changed (no UI changes), you can skip `build:web` and just `pm2 restart schoolportal-api`.
After rebuilding the UI, always `pm2 restart schoolportal-web` so the preview server serves the new `web/dist`.

---

## 18. When something goes wrong

### `tsc: not found` when running `npm run build:web`

The frontend dependencies were not installed:

```bash
cd /var/www/schoolportal/web
npm ci
npm run build
cd ..
pm2 restart schoolportal-web
```

### Blank page or broken styles at `/school/`

- Rebuild the UI with correct `web/.env.production` (`VITE_BASE_PATH=/school/`).
- Restart the frontend: `pm2 restart schoolportal-web`.

### `502 Bad Gateway` on `/school/api/...`

The backend is not running or nginx points to the wrong port.

```bash
pm2 status
curl -s http://127.0.0.1:3900/
grep PORT /var/www/schoolportal/.env
grep 3900 /etc/nginx/snippets/schoolportal.conf
```

Fix mismatches, then:

```bash
pm2 restart schoolportal-api
sudo systemctl reload nginx
```

### `502 Bad Gateway` on `/school/` (the website itself)

The frontend preview server is not running or was never built.

```bash
pm2 status
ls /var/www/schoolportal/web/dist/index.html   # must exist (run npm run build:web)
curl -s -I http://127.0.0.1:3905/school/
pm2 logs schoolportal-web --lines 50
```

### `404` on `/school/login`

The UI build is missing or the frontend process is down:

```bash
ls /var/www/schoolportal/web/dist/portal.html
pm2 restart schoolportal-web
```

### Database errors in PM2 logs

```bash
pm2 logs schoolportal-api --lines 80
sudo systemctl status postgresql
```

Check `DATABASE_URL` in `.env` (password, database name, user).

### View logs

```bash
# API (backend, 3900)
pm2 logs schoolportal-api

# Website (frontend, 3905)
pm2 logs schoolportal-web

# nginx
sudo tail -n 50 /var/log/nginx/error.log
```

---

## 19. Adding HTTPS later (domain name)

When you have a domain (e.g. `school.yourcompany.com`) pointing to `129.121.73.137`:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d school.yourcompany.com
```

Then update:

1. `/var/www/schoolportal/.env` → `FRONTEND_URL=https://school.yourcompany.com/school`
2. `web/.env.production` → `VITE_API_URL=https://school.yourcompany.com/school`
3. Rebuild the UI (Section 11): `npm run build:web`.
4. `pm2 restart schoolportal-api schoolportal-web`

---

## Quick reference card

| Task | Command |
|------|---------|
| App folder | `cd /var/www/schoolportal` |
| Process status | `pm2 status` |
| Backend port | **3900** (`schoolportal-api`) |
| Frontend port | **3905** (`schoolportal-web`) |
| API logs | `pm2 logs schoolportal-api` |
| Web logs | `pm2 logs schoolportal-web` |
| Restart everything | `pm2 restart schoolportal-api schoolportal-web` |
| Test nginx config | `sudo nginx -t` |
| Reload nginx | `sudo systemctl reload nginx` |
| Postgres admin | `sudo -u postgres psql` |

---

## Files in this repository

| File | Purpose |
|------|---------|
| `.env.production.example` | Template for API `.env` |
| `web/.env.production.example` | Template for UI build |
| `ecosystem.config.cjs` | PM2 settings |
| `deploy/nginx-schoolportal.conf` | nginx rules for `/school` |

---

## Sharing with other apps on the same server

- Use URL path **`/school`** only (do not take over `/`).
- Use PM2 names **`schoolportal-api`** and **`schoolportal-web`** (unique).
- Use ports **`3900`** (backend) and **`3905`** (frontend) — or other free ports.
- Use database **`schoolportal_db`** only for this app.
- Add **`include snippets/schoolportal.conf;`** — do not delete other apps’ nginx blocks.

---

*Last updated for Ubuntu Server 24, path `/school`, repo [rolandconsultnig/school](https://github.com/rolandconsultnig/school).*
