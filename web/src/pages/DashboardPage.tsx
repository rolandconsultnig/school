import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarCheck, UserPlus, Users } from "lucide-react";
import {
  admissionsApi,
  analyticsApi,
  attendanceApi,
  lmsApi,
  parentApi,
  studentsApi,
} from "../api/client";
import { useApiContext } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";

export function DashboardPage() {
  const { user, isStudent, isParent } = useAuth();
  const ctx = useApiContext();
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    inquiries: 0,
    sessions: 0,
    newStudents30d: 0,
    payments30d: 0,
  });
  const [bulkMsg, setBulkMsg] = useState("");
  const [parentSummary, setParentSummary] = useState<{
    children: number;
    name?: string;
    childRows?: Record<string, unknown>[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isParent && user?.token) {
      parentApi
        .dashboard(user.token)
        .then((d) => {
          const data = d as {
            parent?: { name?: string };
            children?: Record<string, unknown>[];
          };
          setParentSummary({
            name: data.parent?.name,
            children: data.children?.length ?? 0,
            childRows: data.children ?? [],
          });
        })
        .catch((e) => setError(String(e)));
      return;
    }
    if (isStudent || !ctx.token) return;
    analyticsApi
      .executiveDashboard(ctx.token, ctx.campusId, ctx.tier)
      .then((d) => {
        const pay = d.paymentsLast30Days as { totalAmount?: number } | undefined;
        setStats({
          students: Number(d.students ?? 0),
          courses: Number(d.lmsCourses ?? 0),
          inquiries: Number(d.admissionInquiries ?? 0),
          sessions: Number(d.attendanceSessions ?? 0),
          newStudents30d: Number(d.newStudentsLast30Days ?? 0),
          payments30d: Number(pay?.totalAmount ?? 0),
        });
      })
      .catch(() => {
        Promise.all([
          studentsApi.list(ctx.token, ctx.campusId, ctx.tier).catch(() => []),
          lmsApi.courses(ctx.token, ctx.campusId, ctx.tier).catch(() => []),
          admissionsApi.inquiries(ctx.token, ctx.campusId, ctx.tier).catch(() => []),
          attendanceApi.sessions(ctx.token, {}, ctx.campusId, ctx.tier).catch(() => []),
        ]).then(([s, c, i, a]) => {
          setStats({
            students: s.length,
            courses: c.length,
            inquiries: i.length,
            sessions: a.length,
            newStudents30d: 0,
            payments30d: 0,
          });
        });
      });
  }, [ctx.token, ctx.campusId, ctx.tier, isStudent, isParent, user?.token]);

  if (isParent) {
    return (
      <div>
        <PageHeader
          title="Family dashboard"
          subtitle={`Welcome${parentSummary?.name ? `, ${parentSummary.name}` : ""}`}
        />
        {error && <div className="error-banner">{error}</div>}
        <div className="grid-4">
          <StatCard
            label="Linked children"
            value={parentSummary?.children ?? 0}
            icon={Users}
            accent="violet"
            href="/messages"
          />
        </div>
        <div className="grid-2" style={{ marginTop: "1rem" }}>
          {(parentSummary?.childRows ?? []).map((row, i) => {
            const student = row.student as Record<string, unknown> | undefined;
            const sid = student?.id ?? student?._id;
            const grade = row.gradeLevel as Record<string, unknown> | undefined;
            const results = (row.recentResults as Record<string, unknown>[]) ?? [];
            const outstanding = Number(row.outstandingFees ?? 0);
            const attendancePct = row.attendancePercent as number | null | undefined;
            return (
              <div key={i} className="card">
                <h3>
                  {sid ? (
                    <Link to={`/children/${String(sid)}`}>{String(student?.name ?? "Child")}</Link>
                  ) : (
                    String(student?.name ?? "Child")
                  )}
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {String(grade?.name ?? grade?.label ?? "—")} · {String(student?.tier ?? "")}
                </p>
                <div className="grid-2" style={{ marginTop: "0.75rem", gap: "0.5rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Fees due</strong>
                    <p style={{ margin: "0.15rem 0 0" }}>
                      ₦{outstanding.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Attendance</strong>
                    <p style={{ margin: "0.15rem 0 0" }}>
                      {attendancePct != null ? `${attendancePct}%` : "—"}
                    </p>
                  </div>
                </div>
                <h4 style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>Recent results</h4>
                {results.length === 0 ? (
                  <p className="empty">No published results yet</p>
                ) : (
                  <ul>
                    {results.map((r, j) => (
                      <li key={j}>
                        Score: {String(r.score ?? "—")} / {String(r.total ?? "—")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Quick actions</h3>
          <a href="/messages" className="btn">
            Open messages
          </a>
        </div>
      </div>
    );
  }

  if (isStudent) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your campus and tier — data from SchoolPortal API"
      />
      <div className="grid-4">
        <StatCard
          label="Students"
          value={stats.students}
          icon={Users}
          href="/students"
          accent="green"
        />
        <StatCard
          label="LMS courses"
          value={stats.courses}
          icon={BookOpen}
          href="/learn/courses"
          accent="blue"
        />
        <StatCard
          label="Admission inquiries"
          value={stats.inquiries}
          icon={UserPlus}
          href="/admissions"
          accent="amber"
        />
        <StatCard
          label="Attendance sessions"
          value={stats.sessions}
          icon={CalendarCheck}
          href="/attendance"
          accent="violet"
        />
      </div>
      {bulkMsg && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          {bulkMsg}
        </div>
      )}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Analytics (30 days)</h3>
        <p style={{ margin: "0.25rem 0" }}>
          New students: <strong>{stats.newStudents30d}</strong> · Payments collected:{" "}
          <strong>₦{stats.payments30d.toLocaleString()}</strong>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              setBulkMsg("");
              try {
                const r = await analyticsApi.bulkGenerateReportCards(
                  ctx.token!,
                  { campusId: ctx.campusId, tier: ctx.tier, limit: 30 },
                  ctx.campusId,
                  ctx.tier
                );
                setBulkMsg(`Generated ${r.generated} report card(s).`);
              } catch (e) {
                setBulkMsg(String((e as Error).message));
              }
            }}
          >
            Bulk generate report cards
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              setBulkMsg("");
              try {
                const cards = await analyticsApi.recentReportCards(
                  ctx.token!,
                  {
                    ...(ctx.campusId ? { campusId: ctx.campusId } : {}),
                    ...(ctx.tier ? { tier: ctx.tier } : {}),
                    limit: "20",
                  },
                  ctx.campusId,
                  ctx.tier
                );
                if (!cards.length) {
                  setBulkMsg("No report cards to print.");
                  return;
                }
                for (const card of cards) {
                  const html = await analyticsApi.reportCardHtml(
                    ctx.token!,
                    card.id,
                    ctx.campusId,
                    ctx.tier
                  );
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                  }
                }
                setBulkMsg(`Opened ${cards.length} report card(s) for printing.`);
              } catch (e) {
                setBulkMsg(String((e as Error).message));
              }
            }}
          >
            Print recent report cards
          </button>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Getting started</h3>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Use the sidebar to manage students, run roll-call, review admissions, and
          publish LMS courses. Campus and tier selectors in the header apply to all API
          requests.
        </p>
      </div>
    </div>
  );
}
