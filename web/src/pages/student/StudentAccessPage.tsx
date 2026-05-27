import { useEffect, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { recordId, type ApiRecord } from "../../types";

export function StudentAccessPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .accessLogs(user.token)
      .then((s) => setScans(s as ApiRecord[]))
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  return (
    <div>
      <PageHeader
        title="My access history"
        subtitle="Your own door scans — hostel and campus gates"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Gate</th>
              <th>Granted</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={recordId(s)}>
                <td>{String(s.scannedAt ?? "").slice(0, 19)}</td>
                <td>{String(s.gate)}</td>
                <td>{s.granted ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {scans.length === 0 && (
          <p className="empty">No scans linked to your profile yet</p>
        )}
      </div>
    </div>
  );
}
