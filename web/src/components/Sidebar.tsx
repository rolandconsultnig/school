import { NavLink } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getNavigation } from "../config/navigation";

export function Sidebar() {
  const { user, logout } = useAuth();
  const sections = getNavigation(
    user?.profileType ?? "ADMIN",
    user?.roleCode
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <GraduationCap size={22} strokeWidth={2.2} />
        </div>
        <div>
          <span className="brand-title">SchoolPortal</span>
          <span className="brand-sub">Nigeria · Nursery–SS</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="nav-section">
            <span className="nav-section-label">{section.title}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link${isActive ? " nav-link-active" : ""}`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="user-meta">
          <strong>{user?.name ?? user?.email}</strong>
          <span>{user?.roleCode ?? user?.profileType}</span>
        </div>
        <button type="button" className="btn-ghost" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
