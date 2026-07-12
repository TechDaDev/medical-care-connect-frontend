import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import { t } from "../../utils/i18n";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { AvatarFallback } from "../../components/common/AvatarFallback";

const statusColors: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  submitted: "info",
  accepted: "success",
  intake_in_progress: "warning",
  intake_completed: "info",
  doctor_review: "info",
  completed: "success",
  cancelled: "danger",
  emergency_escalated: "danger",
};

export function PatientConsultationList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["patient-consultations"],
    queryFn: () => consultationsApi.list(),
  });

  return (
    <div>
      <PageHeader
        title={t("consultation.title")}
        actions={
          <Link to="/app/patient/consultations/new">
            <Button>{t("consultation.new")}</Button>
          </Link>
        }
      />

      {isLoading && <Spinner />}
      {error && <ErrorState onRetry={() => refetch()} />}
      {data && (Array.isArray(data) ? data : data.results).length === 0 && (
        <EmptyState message={t("consultation.noResults")} />
      )}
      {data && (
        <div className="space-y-3">
          {(Array.isArray(data) ? data : data.results).map((c: any) => (
            <Link
              key={c.id}
              to={`/app/patient/consultations/${c.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <AvatarFallback
                      name={c.doctor?.user.full_name || "Dr"}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.doctor?.user.full_name || "Doctor"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.specialty?.name || ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={statusColors[c.status] || "neutral"}
                    >
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
