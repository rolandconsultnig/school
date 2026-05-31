/**
 * PM2 — run from repo root: pm2 start ecosystem.config.cjs
 *
 * Ports (behind nginx at /school):
 *   - schoolportal-api : Express API on 3900 (PORT in .env)
 *   - schoolportal-web : Vite preview server on 3905 (serves web/dist build)
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "schoolportal-api",
      cwd: __dirname,
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3900,
      },
    },
    {
      name: "schoolportal-web",
      cwd: path.join(__dirname, "web"),
      // Serve the built UI (web/dist) with Vite's preview server on 3905.
      // Build first: npm run build:web
      script: "node_modules/vite/bin/vite.js",
      args: "preview --port 3905 --host 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
      },
    },
    // Optional: uncomment after SMTP/Termii are configured
    // {
    //   name: "schoolportal-notifications",
    //   cwd: __dirname,
    //   script: "workers/notificationWorker.js",
    //   instances: 1,
    //   autorestart: true,
    //   env: { NODE_ENV: "production" },
    // },
  ],
};
