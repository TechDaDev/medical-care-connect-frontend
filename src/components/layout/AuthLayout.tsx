import { Outlet } from "react-router-dom";
import { AppLayout } from "./AppLayout";

export function AuthLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
