import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import type { Consultation } from "../../types";
import { t } from "../../utils/i18n";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { AvatarFallback } from "../../components/common/AvatarFallback";

export function DoctorConsultationList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["doctor-consultations"],
    queryFn: () => consultationsApi.list(),
  });

  return (
    <div>
      <PageHeader title={t("consultation.title")} />

      {isLoading && <Spinner />}
      {error && <ErrorState onRetry={() => refetch()} />}
      {data && (Array.isArray(data) ? data : data.results).length === 0 && (
        <EmptyState message={t("consultation.noResults")} />
      )}
      {data && (
        <div className="space-y-3">
          {(Array.isArray(data) ? data : data.results).map((c: Consultation) => (
            <Link key={c.id} to={`/app/doctor/consultations/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <AvatarFallback
                      name={c.patient.user.full_name}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {c.patient.user.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.specialty?.name || ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info">
                    {c.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
