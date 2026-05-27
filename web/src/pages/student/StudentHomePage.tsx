import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, CreditCard, GraduationCap, Wallet } from "lucide-react";
import { studentPortalApi, type StudentDashboard } from "../../api/studentPortal";
import { useAuth } from "../../context/AuthContext";
import { StatCard } from "../../components/StatCard";

export function StudentHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    studentPortalApi
      .dashboard(user.token)
      .then(setData)
      .catch((e) => setError(String((e as Error).message)));
  }, [user?.token]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p className="empty">Loading your dashboard…</p>;

  const { greeting, nextClass, notifications, idCard, metrics, student } = data;
  const qrUrl = idCard?.qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encodeURIComponent(idCard.qrPayload)}`
    : null;

  return (
    <div className="student-home">
      <div className="page-header">
        <div>
          <h1>Good day, {greeting.name.split(" ")[0]}</h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {greeting.date} · {greeting.time}
          </p>
        </div>
      </div>

      <div className="student-hero">
        <div
          className={`student-schedule-card${nextClass?.isNow ? " live" : ""}`}
        >
          <h3 style={{ marginTop: 0 }}>Next class</h3>
          {nextClass ? (
            <>
              <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.25rem 0" }}>
                {nextClass.subject}
                {nextClass.isNow && (
                  <span className="badge" style={{ marginLeft: "0.5rem" }}>
                    Now
                  </span>
                )}
              </p>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {nextClass.teacher} · {nextClass.room}
              </p>
              <p style={{ margin: "0.5rem 0 0" }}>
                {nextClass.dayName} {nextClass.startTime} – {nextClass.endTime}
              </p>
              {nextClass.meetingUrl && (
                <a
                  href={nextClass.meetingUrl}
                  className="btn"
                  style={{ marginTop: "0.75rem" }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join live class
                </a>
              )}
            </>
          ) : (
            <p className="empty">No timetable slot today — check back tomorrow.</p>
          )}
        </div>

        {idCard && (
          <div className="student-id-card">
            <div style={{ fontWeight: 700 }}>{String(student.name)}</div>
            <div className="roll">Roll: {String(student.rollNumber ?? student.studentId)}</div>
            {qrUrl && (
              <div className="qr">
                <img src={qrUrl} alt="Student QR code" />
              </div>
            )}
            <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>Tap for cafeteria & library</div>
          </div>
        )}
      </div>

      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          label="Attendance"
          value={
            metrics.attendancePercent != null
              ? `${metrics.attendancePercent}%`
              : "—"
          }
          icon={Calendar}
          accent="green"
          href="/campus/attendance"
        />
        <StatCard
          label="GPA / Average"
          value={metrics.gpa != null ? String(metrics.gpa) : "—"}
          icon={GraduationCap}
          accent="blue"
          href="/learn/gradebook"
        />
        <StatCard
          label="Outstanding fees"
          value={`₦${metrics.outstandingFees.toLocaleString()}`}
          icon={CreditCard}
          accent="amber"
          href="/services/fees"
        />
        <StatCard
          label="Alerts"
          value={notifications.length}
          icon={Bell}
          accent="violet"
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Notifications</h3>
          {notifications.length === 0 ? (
            <p className="empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n, i) => (
                <li key={i} className="notif-item">
                  <span
                    className={`notif-dot ${n.type === "GRADE" ? "grade" : "deadline"}`}
                  />
                  <div>
                    {n.href ? (
                      <Link to={n.href}>
                        <strong>{n.title}</strong>
                      </Link>
                    ) : (
                      <strong>{n.title}</strong>
                    )}
                    <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                      {n.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Quick links</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Link to="/learn/courses" className="btn btn-secondary">
              My courses
            </Link>
            <Link to="/learn/assignments" className="btn btn-secondary">
              Assignments
            </Link>
            <Link to="/campus/wallet" className="btn btn-secondary">
              <Wallet size={16} /> Campus wallet
            </Link>
            <Link to="/community" className="btn btn-secondary">
              School notices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
