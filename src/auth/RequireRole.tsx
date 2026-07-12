import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { UserRole } from "../types";

interface Props {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role as UserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
