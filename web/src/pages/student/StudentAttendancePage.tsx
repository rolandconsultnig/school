import { useEffect, useMemo, useState } from "react";
import { studentPortalApi } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../components/PageHeader";

export function StudentAttendancePage() {
  const { user } = useAuth();
  const [percent, setPercent] = useState<number | null>(null);
  const [calendar, setCalendar] = useState<{ date: string; status: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    studentPortalApi
      .attendance(user.token, from, to)
      .then((d) => {
        setPercent(d.percent);
        setCalendar(d.calendar);
      })
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  const byDate = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of calendar) m[c.date] = c.status;
    return m;
  }, [calendar]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  return (
    <div>
      <PageHeader
        title="Attendance calendar"
        subtitle="Green = present · Red = absent · Yellow = late"
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <strong>Monthly compliance:</strong>{" "}
        {percent != null ? `${percent}%` : "No records this month"}
      </div>
      <div className="card">
        <h3>
          {now.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <div className="attendance-calendar">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", color: "var(--muted)" }}>
              {d}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} className="attendance-day empty" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = byDate[key];
            return (
              <div
                key={day}
                className={`attendance-day ${status ?? "empty"}`}
                title={status ?? "No session"}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
