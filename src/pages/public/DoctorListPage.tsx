import { useCallback, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
import { PublicHeader } from "../../components/layout/PublicHeader";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";

/** Normalize a paginated-or-raw API response into a safe array. */
function asArray<T>(input: unknown, field = "results"): T[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object" && field in (input as Record<string, unknown>)) {
    const arr = (input as Record<string, unknown>)[field];
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

export function DoctorListPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const specialtySlug = searchParams.get("specialty") || "";

  const { data: specialtiesRaw } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });

  const specialties = useMemo(() => asArray<{ slug: string; name: string }>(specialtiesRaw), [specialtiesRaw]);

  const { data: doctorsRaw, isLoading, error, refetch } = useQuery({
    queryKey: ["doctors", { search, specialty: specialtySlug, page }],
    queryFn: () =>
      doctorsApi.list({
        search: search || undefined,
        specialty: specialtySlug || undefined,
        page,
        page_size: 20,
      }),
  });

  /** Safe count from paginated or raw response. */
  const totalCount = useMemo(() => {
    if (!doctorsRaw) return 0;
    if (Array.isArray(doctorsRaw)) return doctorsRaw.length;
    if (typeof doctorsRaw === "object" && "count" in doctorsRaw) return (doctorsRaw as { count: number }).count;
    return 0;
  }, [doctorsRaw]);

  const totalPages = Math.ceil(totalCount / 20) || 0;

  /** Normalized doctor array — guaranteed array. */
  const doctors = useMemo(
    () => asArray<{
      id: string;
      full_name: string;
      specialty_name?: string;
      professional_title?: string;
      years_of_experience: number;
      consultation_fee?: string;
      languages?: string[];
      is_accepting_consultations: boolean;
    }>(doctorsRaw, "results"),
    [doctorsRaw],
  );

  /** Flag for malformed 200 response (not loading, no error, but not an expected shape). */
  const isMalformed = useMemo(
    () => !isLoading && !error && doctorsRaw !== undefined && !Array.isArray(doctorsRaw) && !(doctorsRaw && typeof doctorsRaw === "object" && "results" in doctorsRaw),
    [isLoading, error, doctorsRaw],
  );

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

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <PublicHeader />
        <div className="max-w-5xl mx-auto pt-16">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--lp-text)" }}>{t("doctor.title")}</h1>
          <Spinner />
        </div>
      </>
    );
  }

  // ── API error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <PublicHeader />
        <div className="max-w-5xl mx-auto pt-16">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--lp-text)" }}>{t("doctor.title")}</h1>
          <ErrorState message={t("doctor.loadError")} onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  // ── Malformed response ─────────────────────────────────────────────────
  if (isMalformed) {
    return (
      <>
        <PublicHeader />
        <div className="max-w-5xl mx-auto pt-16">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--lp-text)" }}>{t("doctor.title")}</h1>
          <ErrorState message={t("doctor.loadError")} onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────
  if (doctors.length === 0) {
    return (
      <>
        <PublicHeader />
        <div className="max-w-5xl mx-auto pt-16">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--lp-text)" }}>{t("doctor.title")}</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("doctor.searchPlaceholder")}
                value={search}
                onChange={(e) => updateParams({ search: e.target.value, page: "1" })}
              />
            </div>
            <div className="w-48">
              <Select
                options={specialties.map((s) => ({ value: s.slug, label: s.name }))}
                placeholder={t("doctor.specialty")}
                value={specialtySlug}
                onChange={(e) => updateParams({ specialty: e.target.value, page: "1" })}
              />
            </div>
          </div>

          <EmptyState message={t("doctor.noResults")} />
        </div>
      </>
    );
  }

  // ── Populated ──────────────────────────────────────────────────────────
  return (
    <>
      <PublicHeader />
      <div className="max-w-5xl mx-auto pt-16">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--lp-text)" }}>
          {t("doctor.title")}
        </h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder={t("doctor.searchPlaceholder")}
              value={search}
              onChange={(e) => updateParams({ search: e.target.value, page: "1" })}
            />
          </div>
          <div className="w-48">
            <Select
              options={specialties.length > 0 ? specialties.map((s) => ({ value: s.slug, label: s.name })) : []}
              placeholder={t("doctor.specialty")}
              value={specialtySlug}
              onChange={(e) => updateParams({ specialty: e.target.value, page: "1" })}
            />
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2">
        {doctors.map((doc) => (
          <Link
            key={doc.id}
            to={
              isAuthenticated
                ? location.pathname.startsWith("/app/")
                  ? `/app/patient/doctors/${doc.id}`
                  : `/doctors/${doc.id}`
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
                    {doc.languages && doc.languages.length > 0 && (
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
    </div>
    </>
  );
}
