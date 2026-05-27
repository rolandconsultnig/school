import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ProfileType } from "../types";

export function ProtectedRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow?: ProfileType[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.profileType)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
