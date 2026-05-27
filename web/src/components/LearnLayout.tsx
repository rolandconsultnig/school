import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/learn/courses", label: "Courses" },
  { to: "/learn/exams", label: "Legacy exams" },
  { to: "/learn/gradebook", label: "Gradebook" },
] as const;

export function LearnLayout() {
  return (
    <div>
      <nav
        className="card"
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
          padding: "0.5rem",
        }}
        aria-label="Learning sections"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              isActive ? "btn" : "btn btn-secondary"
            }
            style={{ textDecoration: "none" }}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
