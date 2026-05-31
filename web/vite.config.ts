import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** App routes served by portal.html (React SPA), not the static landing at /. */
const PORTAL_PREFIXES = [
  "/login",
  "/dashboard",
  "/apply",
  "/paystack",
  "/students",
  "/classes",
  "/admissions",
  "/attendance",
  "/learn",
  "/lms",
  "/teachers",
  "/finance",
  "/hr",
  "/library",
  "/access",
  "/ancillary",
  "/promotion",
  "/id-cards",
  "/community",
  "/settings",
  "/messages",
  "/children",
  "/gradebook",
  "/exams",
  "/services",
  "/campus",
];

function isPortalRoute(url: string) {
  return PORTAL_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`));
}

function isAssetOrApi(url: string) {
  return (
    url.startsWith("/api") ||
    url.startsWith("/uploads") ||
    url.startsWith("/@") ||
    url.startsWith("/src") ||
    url.startsWith("/node_modules") ||
    url === "/favicon.svg" ||
    url === "/portal.html" ||
    /\.[a-z0-9]+$/i.test(url)
  );
}

/**
 * SPA fallback that is base-path aware. When the app is served under a base
 * (e.g. `/school/`), incoming URLs include that prefix, so we strip it before
 * matching portal routes and re-add it when rewriting to portal.html.
 */
function portalFallback(base: string): Plugin {
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base; // "/school" or ""
  const rewrite = (req: { url?: string }) => {
    const raw = (req.url ?? "").split("?")[0];
    if (!raw) return;
    const appPath =
      prefix && raw.startsWith(prefix) ? raw.slice(prefix.length) || "/" : raw;
    if (isAssetOrApi(appPath)) return;
    if (isPortalRoute(appPath)) req.url = `${prefix}/portal.html`;
  };
  return {
    name: "portal-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env / .env.[mode] from this folder so VITE_BASE_PATH is available
  // in the config (Vite does NOT put env vars on process.env automatically).
  const env = loadEnv(mode, __dirname, "");
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || "/";

  return {
    base,
    plugins: [react(), portalFallback(base)],
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "index.html"),
          portal: path.resolve(__dirname, "portal.html"),
        },
      },
    },
    server: {
      port: 3905,
      proxy: {
        "/api": {
          target: "http://localhost:3900",
          changeOrigin: true,
        },
        "/uploads": {
          target: "http://localhost:3900",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3905,
      host: "127.0.0.1",
      // Served behind nginx; trust the upstream Host header (IP or domain).
      allowedHosts: true,
    },
  };
});
