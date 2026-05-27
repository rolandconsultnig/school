import { useEffect, useState } from "react";
import { foundationApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { PageHeader } from "../components/PageHeader";
import { recordId, type ApiRecord } from "../types";

export function SettingsPage() {
  const ctx = useApiContext();
  const [logs, setLogs] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    foundationApi
      .auditLogs(ctx.token, ctx.campusId, ctx.tier)
      .then((l) => setLogs(l as ApiRecord[]))
      .catch((e) => setError(String(e.message ?? e)));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Audit trail and system configuration"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent audit logs</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 50).map((log) => (
                <tr key={recordId(log)}>
                  <td>{String(log.action)}</td>
                  <td>
                    {String(log.entityType)} {String(log.entityId ?? "").slice(0, 8)}
                  </td>
                  <td>{String(log.createdAt ?? "").slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !error && (
            <p className="empty">No audit entries (or insufficient permission)</p>
          )}
        </div>
      </div>
    </div>
  );
}
