import { useEffect, useState } from "react";
import { teachersApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function TeachersPage() {
  const ctx = useApiContext();
  const [teachers, setTeachers] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function load() {
    if (!ctx.token) return;
    teachersApi
      .list(ctx.token)
      .then((t) => setTeachers(t as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(() => {
    load();
  }, [ctx.token]);

  async function act(
    fn: (token: string, id: string) => Promise<unknown>,
    id: string,
    label: string
  ) {
    setMsg("");
    setError("");
    try {
      await fn(ctx.token, id);
      setMsg(label);
      load();
    } catch (err) {
      setError(String((err as Error).message));
    }
  }

  return (
    <div>
      <PageHeader title="Teachers" subtitle="Staff directory and HR actions" />
      {error && <div className="error-banner">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {msg}
        </div>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Teacher ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const id = recordId(t);
              return (
                <tr key={id}>
                  <td>{String(t.name)}</td>
                  <td>{String(t.email)}</td>
                  <td>{String(t.teacherId ?? "—")}</td>
                  <td>
                    {t.isSuspended ? (
                      <span className="badge" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                        Suspended
                      </span>
                    ) : t.isWithdrawn ? (
                      <span className="badge">Withdrawn</span>
                    ) : (
                      <span className="badge">Active</span>
                    )}
                  </td>
                  <td style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {!t.isSuspended ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        onClick={() => act(teachersApi.suspend, id, "Teacher suspended")}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        onClick={() => act(teachersApi.unsuspend, id, "Teacher unsuspended")}
                      >
                        Unsuspend
                      </button>
                    )}
                    {!t.isWithdrawn ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        onClick={() => act(teachersApi.withdraw, id, "Teacher withdrawn")}
                      >
                        Withdraw
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        onClick={() => act(teachersApi.unwithdraw, id, "Teacher reinstated")}
                      >
                        Reinstate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {teachers.length === 0 && !error && <p className="empty">No teachers found</p>}
      </div>
    </div>
  );
}
