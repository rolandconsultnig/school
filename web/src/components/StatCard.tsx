import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  trend?: string;
  accent?: "green" | "blue" | "amber" | "violet";
};

export function StatCard({ label, value, icon: Icon, href, trend, accent = "green" }: Props) {
  const body = (
    <article className={`stat-card stat-card-${accent}`}>
      <div className="stat-card-icon">
        <Icon size={22} />
      </div>
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
        {trend && <p className="stat-card-trend">{trend}</p>}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link to={href} className="stat-card-link">
        {body}
      </Link>
    );
  }
  return body;
}
