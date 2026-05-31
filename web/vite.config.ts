import path from "node:path";
import { defineConfig, type Plugin } from "vite";
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

function portalFallback(): Plugin {
  const rewrite = (req: { url?: string }) => {
    const url = (req.url ?? "").split("?")[0];
    if (!url || isAssetOrApi(url)) return;
    if (isPortalRoute(url)) req.url = "/portal.html";
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

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react(), portalFallback()],
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
});
