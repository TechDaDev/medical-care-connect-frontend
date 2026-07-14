import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { Badge } from "../../components/common/Badge";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";

export function DoctorListPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const specialty = searchParams.get("specialty") || "";

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["doctors", { search, specialty, page }],
    queryFn: () =>
      doctorsApi.list({
        search: search || undefined,
        specialty: specialty || undefined,
        page,
        page_size: 20,
      }),
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

  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("doctor.title")}
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("doctor.search")}
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: "1" })}
          />
        </div>
        <div className="w-48">
          <Select
            options={
              specialties?.map((s) => ({
                value: s.slug,
                label: s.name,
              })) || []
            }
            placeholder={t("doctor.specialty")}
            value={specialty}
            onChange={(e) => updateParams({ specialty: e.target.value, page: "1" })}
          />
        </div>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorState onRetry={() => refetch()} />}
      {data && data.results.length === 0 && (
        <EmptyState message={t("doctor.noResults")} />
      )}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data.results.map((doc) => (
              <Link
                key={doc.id}
                to={
                  isAuthenticated
                    ? `/doctors/${doc.id}`
                    : `/login?redirect=/doctors/${doc.id}`
                }
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <AvatarFallback name={doc.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {doc.full_name}
                      </h3>
                      {doc.professional_title && (
                        <p className="text-sm text-gray-600">
                          {doc.professional_title}
                        </p>
                      )}
                      {doc.specialty_name && (
                        <Badge variant="info">{doc.specialty_name}</Badge>
                      )}
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        {doc.years_of_experience > 0 && (
                          <p>{doc.years_of_experience} {t("doctor.experience")}</p>
                        )}
                        {doc.consultation_fee && (
                          <p>{t("doctor.fee")}: ${doc.consultation_fee}</p>
                        )}
                        {doc.languages?.length > 0 && (
                          <p>{doc.languages.join(", ")}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        {doc.is_accepting_consultations ? (
                          <Badge variant="success">{t("doctor.accepting")}</Badge>
                        ) : (
                          <Badge variant="neutral">{t("doctor.notAccepting")}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
                {t("common.previous")}
              </Button>
              <span className="text-sm text-gray-600">{t("common.page", { page })}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
