import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { doctorsApi } from "../../api/doctors";
import { useAuth } from "../../auth";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";
import type { DoctorAccessStateName } from "../../types";

export function DoctorAccessStatePage({ state }: { state: Exclude<DoctorAccessStateName, "approved" | "inactive"> }) {
  const { logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["doctor-access-state"],
    queryFn: doctorsApi.getAccessState,
  });

  if (query.isLoading) return <Spinner />;
  if (query.error) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }
  if (query.data?.state === "approved") return <Navigate to="/app/doctor" replace />;
  if (query.data && query.data.state !== state) {
    return <Navigate to={query.data.next_path} replace />;
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="max-w-xl w-full p-6">
        <h1 className="text-2xl font-bold text-slate-900">{t(`doctor.access.${state}.title`)}</h1>
        <p className="mt-3 text-slate-600">{t(`doctor.access.${state}.body`)}</p>
        <p className="mt-4 text-sm text-slate-500">{t("doctor.access.support")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {query.data?.can_edit_profile && (
            <Button onClick={() => navigate("/app/doctor/profile")}>
              {t("doctor.access.editProfile")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => logout().then(() => navigate("/login"))}
          >
            {t("auth.logout")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
