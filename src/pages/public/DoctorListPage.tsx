import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Skeleton } from "../../components/common/Skeleton";
import { PublicHeader } from "../../components/layout/PublicHeader";
import { useAuth } from "../../auth";
import { useDebounce } from "../../hooks/useDebounce";
import { useI18n } from "../../i18n";
import type { DoctorListOrdering, DoctorSearchFilters } from "../../types";
import { UserRole } from "../../types";
import { formatDoctorMoney, formatEstimatedResponse } from "../../utils/doctorFormatting";

const PAGE_SIZE = 12;

function toPositiveNumber(value: string | null): number | undefined {
  const number = Number(value);
  return value && Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function DoctorListPage() {
  const { t, locale, formatNumber } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isPatientRoute = location.pathname.startsWith("/app/patient");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const specialty = searchParams.get("specialty") || "";
  const language = searchParams.get("language") || "";
  const accepting = searchParams.get("accepting") || "";
  const ordering = (searchParams.get("ordering") || "relevance") as DoctorListOrdering;

  const updateParams = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const current = searchParams.get("search") || "";
    if (current !== debouncedSearch) {
      updateParams({ search: debouncedSearch, page: "1" });
    }
  }, [debouncedSearch, searchParams, updateParams]);

  const filters: DoctorSearchFilters = {
    search: debouncedSearch || undefined,
    specialty: specialty || undefined,
    language: language === "en" || language === "ar" || language === "ckb" ? language : undefined,
    accepting: accepting === "true" ? true : accepting === "false" ? false : undefined,
    min_experience: toPositiveNumber(searchParams.get("min_experience")),
    min_fee: searchParams.get("min_fee") || undefined,
    max_fee: searchParams.get("max_fee") || undefined,
    max_response_minutes: toPositiveNumber(searchParams.get("max_response_minutes")),
    ordering,
    page,
    page_size: PAGE_SIZE,
    locale,
  };

  const specialtiesQuery = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });
  const doctorsQuery = useQuery({
    queryKey: ["doctors", filters],
    queryFn: () => doctorsApi.list(filters),
  });

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };
  const closeFilters = () => {
    setFiltersOpen(false);
    filterButtonRef.current?.focus();
  };
  const hasFilters = [...searchParams.keys()].some((key) => key !== "page");
  const totalPages = Math.max(1, Math.ceil((doctorsQuery.data?.count || 0) / PAGE_SIZE));
  const specialtyOptions = useMemo(
    () => (specialtiesQuery.data || []).filter((item) => item.is_active !== false)
      .map((item) => ({ value: item.id, label: item.name })),
    [specialtiesQuery.data],
  );

  const filtersPanel = (
    <section
      id="doctor-filters"
      aria-label={t("doctor.filters")}
      className={`${filtersOpen ? "block" : "hidden"} md:block rounded-xl border border-slate-200 bg-white p-4`}
    >
      <div className="mb-3 flex items-center justify-between md:hidden">
        <h2 className="font-semibold">{t("doctor.filters")}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={closeFilters}>
          {t("common.close")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Select
          id="doctor-specialty"
          label={t("doctor.specialty")}
          placeholder={t("doctor.allSpecialties")}
          options={specialtyOptions}
          value={specialty}
          onChange={(event) => updateParams({ specialty: event.target.value, page: "1" })}
        />
        <Select
          id="doctor-language"
          label={t("doctor.languages")}
          placeholder={t("doctor.allLanguages")}
          options={[
            { value: "en", label: t("language.en") },
            { value: "ar", label: t("language.ar") },
            { value: "ckb", label: t("language.ckb") },
          ]}
          value={language}
          onChange={(event) => updateParams({ language: event.target.value, page: "1" })}
        />
        <Select
          id="doctor-accepting"
          label={t("doctor.availability")}
          placeholder={t("doctor.anyAvailability")}
          options={[
            { value: "true", label: t("doctor.accepting") },
            { value: "false", label: t("doctor.notAccepting") },
          ]}
          value={accepting}
          onChange={(event) => updateParams({ accepting: event.target.value, page: "1" })}
        />
        <Input
          id="doctor-min-experience"
          type="number"
          min="0"
          label={t("doctor.minExperience")}
          value={searchParams.get("min_experience") || ""}
          onChange={(event) => updateParams({ min_experience: event.target.value, page: "1" })}
        />
        <Input
          id="doctor-min-fee"
          type="number"
          min="0"
          step="0.01"
          label={t("doctor.minFee")}
          value={searchParams.get("min_fee") || ""}
          onChange={(event) => updateParams({ min_fee: event.target.value, page: "1" })}
        />
        <Input
          id="doctor-max-fee"
          type="number"
          min="0"
          step="0.01"
          label={t("doctor.maxFee")}
          value={searchParams.get("max_fee") || ""}
          onChange={(event) => updateParams({ max_fee: event.target.value, page: "1" })}
        />
        <Input
          id="doctor-max-response"
          type="number"
          min="1"
          label={t("doctor.maxResponse")}
          value={searchParams.get("max_response_minutes") || ""}
          onChange={(event) => updateParams({ max_response_minutes: event.target.value, page: "1" })}
        />
        <Select
          id="doctor-ordering"
          label={t("doctor.sort")}
          options={[
            { value: "relevance", label: t("doctor.sortRecommended") },
            { value: "experience_desc", label: t("doctor.sortExperience") },
            { value: "fee_asc", label: t("doctor.sortFee") },
            { value: "response_time_asc", label: t("doctor.sortResponse") },
            { value: "name", label: t("doctor.sortName") },
            { value: "newest", label: t("doctor.sortNewest") },
          ]}
          value={ordering}
          onChange={(event) => updateParams({ ordering: event.target.value, page: "1" })}
        />
      </div>
      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>
          {t("doctor.clearFilters")}
        </Button>
      )}
    </section>
  );

  return (
    <>
      {!isPatientRoute && <PublicHeader />}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{t("doctor.title")}</h1>
          <p className="mt-1 text-slate-600">{t("doctor.discoveryIntro")}</p>
        </div>
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <Input
              id="doctor-search"
              type="search"
              label={t("doctor.search")}
              placeholder={t("doctor.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button
            ref={filterButtonRef}
            type="button"
            className="self-end rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 md:hidden"
            aria-expanded={filtersOpen}
            aria-controls="doctor-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {t("doctor.filters")}
          </button>
        </div>
        {filtersPanel}

        <div className="mt-6" aria-live="polite">
          {doctorsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label={t("common.loading")}>
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index}><Skeleton className="mb-4 h-12 w-12 rounded-full" /><Skeleton className="mb-2 h-5 w-2/3" /><Skeleton className="h-20 w-full" /></Card>
              ))}
            </div>
          ) : doctorsQuery.error ? (
            <div role="alert">
              <ErrorState message={t("doctor.loadError")} onRetry={() => doctorsQuery.refetch()} />
            </div>
          ) : !doctorsQuery.data?.results.length ? (
            <div>
              <EmptyState message={t("doctor.noResults")} />
              {hasFilters && <Button type="button" variant="secondary" className="mx-auto mt-3 flex" onClick={clearFilters}>{t("doctor.clearFilters")}</Button>}
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-600">
                {t("doctor.resultCount", { count: formatNumber(doctorsQuery.data.count) })}
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctorsQuery.data.results.map((doctor) => {
                  const detailPath = isPatientRoute ? `/app/patient/doctors/${doctor.id}` : `/doctors/${doctor.id}`;
                  const createPath = `/app/patient/consultations/new?doctor=${doctor.id}`;
                  const canCreate = doctor.available_actions.includes("start_consultation");
                  const startPath = user?.role === UserRole.PATIENT
                    ? createPath
                    : `/login?redirect=${encodeURIComponent(createPath)}`;
                  return (
                    <Card key={doctor.id} className="flex h-full flex-col">
                      <article className="flex h-full flex-col" aria-labelledby={`doctor-${doctor.id}`}>
                        <div className="flex items-start gap-3">
                          <AvatarFallback name={doctor.full_name} size="lg" />
                          <div className="min-w-0">
                            <h2 id={`doctor-${doctor.id}`} className="font-semibold text-slate-900">{doctor.full_name}</h2>
                            <p className="text-sm text-slate-600">{doctor.professional_title}</p>
                            <Badge variant="info">{doctor.specialty.name}</Badge>
                          </div>
                        </div>
                        <dl className="mt-4 space-y-2 text-sm text-slate-700">
                          <div className="flex justify-between gap-2"><dt>{t("doctor.experience")}</dt><dd>{formatNumber(doctor.years_of_experience)}</dd></div>
                          <div className="flex justify-between gap-2"><dt>{t("doctor.fee")}</dt><dd>{formatDoctorMoney(doctor.consultation_fee, locale)}</dd></div>
                          <div className="flex justify-between gap-2"><dt>{t("doctor.responseTime")}</dt><dd>{formatEstimatedResponse(doctor.estimated_response_minutes, t)}</dd></div>
                          <div className="flex justify-between gap-2"><dt>{t("doctor.rating")}</dt><dd>{doctor.total_reviews ? `${doctor.average_rating} (${formatNumber(doctor.total_reviews)})` : t("doctor.noReviews")}</dd></div>
                        </dl>
                        {doctor.profile_summary && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{doctor.profile_summary}</p>}
                        <div className="mt-auto flex flex-wrap gap-2 pt-4">
                          <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" to={detailPath}>
                            {t("doctor.viewProfile")}
                          </Link>
                          {canCreate && (user?.role === UserRole.PATIENT || !isAuthenticated) && (
                            <Link className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white" to={startPath}>
                              {t("doctor.startConsultation")}
                            </Link>
                          )}
                          {!canCreate && <Badge variant="neutral">{t("doctor.notAccepting")}</Badge>}
                        </div>
                      </article>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {doctorsQuery.data && totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t("doctor.pagination")}>
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>{t("common.previous")}</Button>
            <span className="text-sm text-slate-600">{t("common.pageOf", { page: formatNumber(page), total: formatNumber(totalPages) })}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>{t("common.next")}</Button>
          </nav>
        )}
      </main>
    </>
  );
}
