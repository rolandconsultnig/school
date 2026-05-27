import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import type { SchoolTier } from "../types";
import { recordId } from "../types";

export function Topbar() {
  const { user, isStudent, isParent } = useAuth();
  const { campusId, tier, setCampusId, setTier, bootstrap, campusName, loading } =
    useTenant();

  const campuses =
    bootstrap?.organizations.flatMap((o) => o.campuses ?? []) ?? [];
  const showTenant = !isStudent && !isParent && campuses.length > 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-greeting">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="topbar-hint">
          {loading ? "Loading campus…" : campusName || "School management portal"}
        </p>
      </div>
      <div className="topbar-right">
        {showTenant && (
          <>
            <label className="topbar-field">
              <span>Campus</span>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
              >
                {campuses.map((c) => (
                  <option key={recordId(c)} value={recordId(c)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="topbar-field">
              <span>Tier</span>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as SchoolTier)}
              >
                {(bootstrap?.tiers ?? []).map((t) => (
                  <option key={t.tier} value={t.tier}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <span className="role-pill">{user?.roleCode ?? user?.profileType}</span>
      </div>
    </header>
  );
}
