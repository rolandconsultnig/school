import { useEffect, useState } from "react";
import { examsApi } from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { recordId, type ApiRecord } from "../types";

export function ExamsPage() {
  const ctx = useApiContext();
  const [exams, setExams] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    examsApi
      .list(ctx.token, ctx.campusId, ctx.tier)
      .then((e) => setExams(e as ApiRecord[]))
      .catch((err) => setError(String((err as Error).message)));
  }, [ctx.token, ctx.campusId, ctx.tier]);

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Questions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={recordId(e)}>
                <td>{String(e.name)}</td>
                <td>{String(e.duration ?? "—")}</td>
                <td>{String(e.totalQuestions ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && <p className="empty">No exams</p>}
      </div>
    </div>
  );
}
