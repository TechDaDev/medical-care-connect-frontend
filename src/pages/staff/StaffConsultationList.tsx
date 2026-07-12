import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { staffApi } from "../../api/staff";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/common/Badge";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Button } from "../../components/common/Button";
import { getErrorMessage } from "../../utils/errors";

const STATUS_OPTIONS = [
  { value: "", label: t("common.all") },
  { value: "submitted", label: t("consultation.submitted") },
  { value: "accepted", label: t("consultation.accepted") },
  { value: "intake_in_progress", label: t("consultation.inProgress") },
  { value: "intake_completed", label: t("consultation.intakeCompleted") },
  { value: "doctor_review", label: t("consultation.doctorReview") },
  { value: "cancelled", label: t("consultation.cancelled") },
];

const PRIORITY_OPTIONS = [
  { value: "", label: t("common.all") },
  { value: "routine", label: t("consultation.priorityRoutine") },
  { value: "urgent", label: t("consultation.priorityUrgent") },
  { value: "emergency", label: t("consultation.priorityEmergency") },
];

const priorityColors: Record<string, "info" | "warning" | "danger" | "neutral"> = {
  routine: "info",
  urgent: "warning",
  emergency: "danger",
};

export function StaffConsultationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff-consultations", { page, status, priority, search }],
    queryFn: () =>
      staffApi.consultations({ page, page_size: 20, status, priority, search }),
  });

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) newParams.set(k, v);
        else newParams.delete(k);
      });
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = () => {
    updateParams({ search: searchInput, page: "1" });
  };

  const handleStatusChange = (val: string) => {
    updateParams({ status: val, page: "1" });
  };

  const handlePriorityChange = (val: string) => {
    updateParams({ priority: val, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("nav.staffConsultations")}
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("common.search")}
            className="w-48"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            {t("common.search")}
          </Button>
        </div>
        <Select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          value={priority}
          onChange={(e) => handlePriorityChange(e.target.value)}
          options={PRIORITY_OPTIONS}
        />
      </div>

      {data && data.results.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t("common.noResults")}</p>
      ) : (
        <>
          <div className="space-y-3">
            {data?.results.map((c) => (
              <Link
                key={c.id}
                to={`/app/staff/consultations/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {c.patient_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {c.doctor_name || t("consultation.unassigned")} &middot; {c.specialty_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          (priorityColors[c.priority] as "info" | "warning" | "danger" | "neutral") || "neutral"
                        }
                      >
                        {c.priority}
                      </Badge>
                      <Badge variant="info">
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                {t("common.previous")}
              </Button>
              <span className="text-sm text-gray-600">
                {t("common.page", { page })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
