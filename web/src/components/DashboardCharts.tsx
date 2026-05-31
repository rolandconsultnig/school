import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExecutiveDashboard, TrendsResponse } from "../api/client";

const PALETTE = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#0891b2", "#db2777"];
const AXIS = "#94a3b8";
const GRID = "#e2e8f0";

const naira = (n: number) =>
  `\u20a6${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const tierLabel = (t: string) =>
  t ? t.charAt(0) + t.slice(1).toLowerCase() : "Unspecified";

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="chart-card">
      <header className="chart-card-head">
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </header>
      <div className="chart-card-body">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

export function EnrollmentTrendChart({ trends }: { trends: TrendsResponse }) {
  const data = trends.months.map((m) => ({
    label: m.label,
    "New students": m.newStudents,
    Inquiries: m.inquiries,
  }));
  return (
    <ChartCard title="Enrollment & inquiries" subtitle={`Last ${data.length} months`}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradInquiries" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={AXIS} fontSize={12} tickLine={false} />
          <YAxis stroke={AXIS} fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="New students"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#gradStudents)"
          />
          <Area
            type="monotone"
            dataKey="Inquiries"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#gradInquiries)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PaymentsTrendChart({ trends }: { trends: TrendsResponse }) {
  const data = trends.months.map((m) => ({ label: m.label, Payments: m.payments }));
  return (
    <ChartCard
      title="Payments collected"
      subtitle={naira(trends.totals.payments) + " total"}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={AXIS} fontSize={12} tickLine={false} />
          <YAxis
            stroke={AXIS}
            fontSize={11}
            tickLine={false}
            width={64}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [naira(Number(v)), "Payments"]}
          />
          <Bar dataKey="Payments" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TierPieChart({ data }: { data: ExecutiveDashboard }) {
  const slices = (data.studentsByTier ?? [])
    .filter((t) => t.count > 0)
    .map((t) => ({ name: tierLabel(t.tier), value: t.count }));
  const total = slices.reduce((s, x) => s + x.value, 0);
  return (
    <ChartCard title="Students by tier" subtitle={`${total} enrolled`}>
      {slices.length === 0 ? (
        <p className="empty">No enrolment data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function OperationsBarChart({ data }: { data: ExecutiveDashboard }) {
  const rows = [
    { name: "Students", value: data.students },
    { name: "Teachers", value: data.teachers },
    { name: "Courses", value: data.lmsCourses },
    { name: "Sessions", value: data.attendanceSessions },
    { name: "Applicants", value: data.activeApplicants },
  ];
  return (
    <ChartCard title="Operational snapshot" subtitle="Current totals">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 6, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis type="number" stroke={AXIS} fontSize={12} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke={AXIS}
            fontSize={12}
            tickLine={false}
            width={72}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-muted)" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {rows.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CollectionGaugeChart({ data }: { data: ExecutiveDashboard }) {
  // Simple donut showing overdue vs pending-vs-clear operational items.
  const slices = [
    { name: "Overdue fees", value: data.overdueFees },
    { name: "Pending leave", value: data.pendingLeaveRequests },
    { name: "Open inquiries", value: data.admissionInquiries },
  ].filter((s) => s.value > 0);
  return (
    <ChartCard title="Attention needed" subtitle="Open items">
      {slices.length === 0 ? (
        <p className="empty">Nothing outstanding</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={85}
              label
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={["#dc2626", "#d97706", "#2563eb"][i % 3]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
