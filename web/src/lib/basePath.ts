/** Vite `base` (e.g. `/school/`). Empty string when served at domain root. */
export function getBasePath(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  if (base === "/") return "";
  return base.replace(/\/$/, "");
}

/** Prefix an app path with the Vite base (for plain `<a href>` and OAuth links). */
export function withBase(path: string): string {
  const base = getBasePath();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
