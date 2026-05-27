import { useEffect, useState } from "react";
import { classesApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function ClassesPage() {
  const ctx = useApiContext();
  const [classes, setClasses] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    classesApi
      .list(ctx.token, ctx.campusId, ctx.tier)
      .then((d) => setClasses(d as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  return (
    <div>
      <div className="page-header">
        <h1>Class levels</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Section</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={recordId(c)}>
                <td>{String(c.name)}</td>
                <td>{String(c.section ?? "—")}</td>
                <td>
                  <span className="badge">{String(c.tier ?? "—")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {classes.length === 0 && <p className="empty">No classes</p>}
      </div>
    </div>
  );
}
