import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentLibraryPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<ApiRecord[]>([]);
  const [fines, setFines] = useState(0);
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .library(user.token)
      .then((d) => {
        setActive(d.activeLoans as ApiRecord[]);
        setFines(d.totalFines);
      })
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token || search.length < 2) {
      setCatalog([]);
      return;
    }
    const t = setTimeout(() => {
      studentPortalApi
        .libraryCatalog(user.token, search)
        .then((b) => setCatalog(b as ApiRecord[]))
        .catch(() => setCatalog([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.token]);

  return (
    <div>
      <PageHeader title="Digital library desk" subtitle="Borrowed books, catalog search, fines" />
      {error && <div className="error-banner">{error}</div>}
      <div className="grid-2">
        <div className="card">
          <h3>Currently borrowed</h3>
          {active.length === 0 ? (
            <p className="empty">No active loans</p>
          ) : (
            <ul>
              {active.map((l) => (
                <li key={recordId(l)}>
                  <strong>{String(l.bookTitle)}</strong>
                  <br />
                  <small>Due {String(l.dueAt ?? "").slice(0, 10)}</small>
                </li>
              ))}
            </ul>
          )}
          {fines > 0 && (
            <p style={{ color: "#b45309", marginTop: "0.75rem" }}>
              Outstanding fines: ₦{fines.toLocaleString()}
            </p>
          )}
        </div>
        <div className="card">
          <h3>Search catalog</h3>
          <input
            placeholder="Title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
          <ul style={{ marginTop: "0.75rem" }}>
            {catalog.map((b) => (
              <li key={recordId(b)}>
                {String(b.title)} — {String(b.available)} available
                <br />
                <small>{String(b.author ?? "")}</small>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
            Reserve at the library desk — self-checkout via RFID coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
