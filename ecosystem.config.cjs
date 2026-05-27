/**
 * PM2 — run from repo root: pm2 start ecosystem.config.cjs
 * API only; static UI is served by nginx under /school/
 */
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
