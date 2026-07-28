import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../../api/doctors";
import { useI18n } from "../../i18n";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Skeleton } from "../../components/common/Skeleton";
import { PublicHeader } from "../../components/layout/PublicHeader";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";
import { ApiRequestError } from "../../utils/errors";
import { formatDoctorMoney, formatEstimatedResponse } from "../../utils/doctorFormatting";

export function DoctorDetailPage() {
  const { t, locale, formatNumber } = useI18n();
  const { doctorId } = useParams<{ doctorId: string }>();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isPatientRoute = location.pathname.startsWith("/app/patient");

  const query = useQuery({
    queryKey: ["doctor", doctorId, locale],
    queryFn: () => doctorsApi.getById(doctorId!),
    enabled: Boolean(doctorId),
  });

  const wrapper = (content: ReactNode) => (
    <>
      {!isPatientRoute && <PublicHeader />}
      <main className="mx-auto max-w-4xl px-4 py-10">{content}</main>
    </>
  );

  if (query.isLoading) {
    return wrapper(
      <div aria-busy="true" aria-label={t("common.loading")}>
        <Card><Skeleton className="mb-4 h-16 w-16 rounded-full" /><Skeleton className="mb-3 h-7 w-1/2" /><Skeleton className="h-48 w-full" /></Card>
      </div>,
    );
  }
  if (query.error) {
    const notFound = query.error instanceof ApiRequestError && query.error.status === 404;
    return wrapper(<div role="alert"><ErrorState message={notFound ? t("doctor.notFound") : t("doctor.loadError")} onRetry={() => query.refetch()} /></div>);
  }
  if (!query.data) return wrapper(null);

  const doctor = query.data;
  const canCreate = doctor.available_actions.includes("start_consultation");
  const createPath = `/app/patient/consultations/new?doctor=${doctor.id}`;
  const startPath = user?.role === UserRole.PATIENT
    ? createPath
    : `/login?redirect=${encodeURIComponent(createPath)}`;

  return wrapper(
    <Card>
      <article>
        <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
          <AvatarFallback name={doctor.full_name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{doctor.full_name}</h1>
            <p className="text-slate-600">{doctor.professional_title}</p>
            {doctor.workplace_name && <p className="text-sm text-slate-500">{doctor.workplace_name}</p>}
            <Badge variant="info">{doctor.specialty.name}</Badge>
          </div>
        </div>

        <section className="py-6" aria-labelledby="doctor-overview">
          <h2 id="doctor-overview" className="mb-3 text-lg font-semibold text-slate-900">{t("doctor.overview")}</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">{t("doctor.experience")}</dt><dd className="font-medium text-slate-900">{t("doctor.yearsValue", { count: formatNumber(doctor.years_of_experience) })}</dd></div>
            <div><dt className="text-slate-500">{t("doctor.fee")}</dt><dd className="font-medium text-slate-900">{formatDoctorMoney(doctor.consultation_fee, locale)}</dd></div>
            <div><dt className="text-slate-500">{t("doctor.responseTime")}</dt><dd className="font-medium text-slate-900">{formatEstimatedResponse(doctor.estimated_response_minutes, t)}</dd></div>
            <div><dt className="text-slate-500">{t("doctor.rating")}</dt><dd className="font-medium text-slate-900">{doctor.total_reviews ? `${doctor.average_rating} (${formatNumber(doctor.total_reviews)})` : t("doctor.noReviews")}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">{t("doctor.languages")}</dt><dd className="font-medium text-slate-900">{doctor.languages.map((language) => t(`language.${language}`)).join(", ")}</dd></div>
          </dl>
        </section>

        {doctor.biography && (
          <section className="border-t border-slate-200 py-6" aria-labelledby="doctor-biography">
            <h2 id="doctor-biography" className="mb-2 text-lg font-semibold text-slate-900">{t("doctor.biography")}</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{doctor.biography}</p>
          </section>
        )}
        {doctor.qualifications && (
          <section className="border-t border-slate-200 py-6" aria-labelledby="doctor-qualifications">
            <h2 id="doctor-qualifications" className="mb-2 text-lg font-semibold text-slate-900">{t("doctor.qualifications")}</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{doctor.qualifications}</p>
          </section>
        )}

        <div className="border-t border-slate-200 pt-6">
          {canCreate && (user?.role === UserRole.PATIENT || !isAuthenticated) ? (
            <Link className="inline-flex w-full justify-center rounded-lg bg-primary-600 px-4 py-3 font-medium text-white" to={startPath}>
              {t("doctor.startConsultation")}
            </Link>
          ) : !canCreate ? (
            <div role="status" className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
              <strong className="block">{t("doctor.unavailable")}</strong>
              {t(`doctor.unavailableReason.${doctor.unavailable_reason || "not_accepting_consultations"}`)}
            </div>
          ) : null}
        </div>
      </article>
    </Card>,
  );
}
