import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { doctorsApi } from "../../api/doctors";
import { ErrorState } from "../common/ErrorState";
import { Spinner } from "../common/Spinner";
import { getErrorMessage } from "../../utils/errors";
import { useI18n } from "../../i18n";

export function DoctorAccessGate({
  children,
  capability = "dashboard",
}: {
  children: ReactNode;
  capability?: "dashboard" | "profile" | "availability";
}) {
  const { t } = useI18n();
  const accessQuery = useQuery({
    queryKey: ["doctor-access-state"],
    queryFn: doctorsApi.getAccessState,
  });

  if (accessQuery.isLoading) {
    return (
      <div role="status" aria-live="polite" aria-label={t("doctor.access.loading")}>
        <Spinner />
      </div>
    );
  }
  if (accessQuery.error) {
    return (
      <ErrorState
        message={getErrorMessage(accessQuery.error)}
        onRetry={() => accessQuery.refetch()}
      />
    );
  }
  if (!accessQuery.data) {
    return <ErrorState onRetry={() => accessQuery.refetch()} />;
  }
  const allowed =
    capability === "profile"
      ? accessQuery.data.can_edit_profile
      : capability === "availability"
        ? accessQuery.data.can_manage_availability
        : accessQuery.data.can_access_dashboard;
  if (!allowed) {
    return <Navigate to={accessQuery.data.next_path} replace />;
  }
  return <>{children}</>;
}
