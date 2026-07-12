import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { UserRole } from "../types";

function roleDashboard(role: string): string {
  switch (role) {
    case UserRole.PATIENT: return "/app/patient";
    case UserRole.DOCTOR: return "/app/doctor";
    case UserRole.COORDINATOR:
    case UserRole.ADMINISTRATOR: return "/app/staff";
    default: return "/unauthorized";
  }
}

interface Props {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role as UserRole)) {
    // Redirect to user's own dashboard instead of unauthorized
    return <Navigate to={roleDashboard(user.role)} replace />;
  }
  return <>{children}</>;
}
