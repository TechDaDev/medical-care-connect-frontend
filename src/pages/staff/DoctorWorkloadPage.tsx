import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { staffApi } from "../../api/staff";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/common/Badge";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { getErrorMessage } from "../../utils/errors";

const SPECIALTY_OPTIONS = [
  { value: "", label: t("common.all") },
];

const ACCEPTING_OPTIONS = [
  { value: "", label: t("common.all") },
  { value: "true", label: t("doctor.accepting") },
  { value: "false", label: t("doctor.notAccepting") },
];

const APPROVED_OPTIONS = [
  { value: "", label: t("common.all") },
  { value: "true", label: t("doctor.approved") },
  { value: "false", label: "Unapproved" },
];

export function DoctorWorkloadPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [accepting, setAccepting] = useState("");
  const [approved, setApproved] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["doctor-workload", { specialty, accepting, approved, search }],
    queryFn: () =>
      staffApi.doctorWorkload({
        specialty: specialty || undefined,
        accepting: accepting ? accepting === "true" : undefined,
        approved: approved ? approved === "true" : undefined,
        search: search || undefined,
      }),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("doctor.workload")}
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("doctor.search")}
          className="w-48"
        />
        <Select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          options={SPECIALTY_OPTIONS}
        />
        <Select
          value={accepting}
          onChange={(e) => setAccepting(e.target.value)}
          options={ACCEPTING_OPTIONS}
        />
        <Select
          value={approved}
          onChange={(e) => setApproved(e.target.value)}
          options={APPROVED_OPTIONS}
        />
      </div>

      {data && data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t("common.noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((d) => (
            <Card key={d.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{d.full_name}</p>
                    <p className="text-sm text-gray-500">{d.specialty_name}</p>
                  </div>
                  <div className="flex gap-1">
                    {d.is_approved && (
                      <Badge variant="success">{t("doctor.approved")}</Badge>
                    )}
                    <Badge
                      variant={d.is_accepting_consultations ? "success" : "neutral"}
                    >
                      {d.is_accepting_consultations
                        ? t("doctor.accepting")
                        : t("doctor.notAccepting")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-gray-900">{d.active_consultations}</p>
                    <p className="text-xs text-gray-500">{t("doctor.activeCases")}</p>
                  </div>
                  <div>
                    <p className="font-bold text-blue-600">{d.submitted}</p>
                    <p className="text-xs text-gray-500">{t("consultation.submitted")}</p>
                  </div>
                  <div>
                    <p className="font-bold text-green-600">{d.accepted}</p>
                    <p className="text-xs text-gray-500">{t("consultation.accepted")}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  {t("doctor.estimatedResponse")}: {t("doctor.minutes", { minutes: d.estimated_response_minutes })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
