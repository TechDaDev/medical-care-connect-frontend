import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doctorsApi } from "../../api/doctors";
import { consultationsApi } from "../../api/consultations";
import { Alert } from "../../components/common/Alert";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Skeleton } from "../../components/common/Skeleton";
import { Textarea } from "../../components/common/Textarea";
import { useI18n } from "../../i18n";
import { ApiRequestError, getErrorMessage } from "../../utils/errors";
import { formatDoctorMoney, formatEstimatedResponse } from "../../utils/doctorFormatting";

type Stage = "edit" | "review";
type FormData = { description: string };

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte, index) => {
    const separator = index === 4 || index === 6 || index === 8 || index === 10 ? "-" : "";
    return `${separator}${byte.toString(16).padStart(2, "0")}`;
  }).join("");
}

function normalizeDescription(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

export function NewConsultationPage() {
  const { t, locale, formatNumber } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctor") || "";
  const [stage, setStage] = useState<Stage>("edit");
  const [requestId] = useState(createRequestId);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => z.object({
    description: z.string()
      .transform(normalizeDescription)
      .pipe(z.string().min(20, t("consultation.descriptionMin")).max(2000, t("consultation.descriptionMax"))),
  }), [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { description: "" },
  });
  const description = useWatch({ control: form.control, name: "description" }) || "";

  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId, locale],
    queryFn: () => doctorsApi.getById(doctorId),
    enabled: Boolean(doctorId),
  });

  if (!doctorId) {
    return (
      <main className="mx-auto max-w-2xl">
        <Alert variant="warning">{t("consultation.doctorRequired")}</Alert>
        <Link className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 font-medium text-white" to="/app/patient/doctors">
          {t("consultation.chooseDoctor")}
        </Link>
      </main>
    );
  }
  if (doctorQuery.isLoading) {
    return <main className="mx-auto max-w-2xl" aria-busy="true" aria-label={t("common.loading")}><Card><Skeleton className="mb-3 h-7 w-1/2" /><Skeleton className="h-48 w-full" /></Card></main>;
  }
  if (doctorQuery.error || !doctorQuery.data) {
    return <main className="mx-auto max-w-2xl" role="alert"><ErrorState message={t("doctor.loadError")} onRetry={() => doctorQuery.refetch()} /><Link className="text-primary-700 underline" to="/app/patient/doctors">{t("consultation.chooseDoctor")}</Link></main>;
  }

  const doctor = doctorQuery.data;
  const canCreate = doctor.available_actions.includes("start_consultation");
  const normalizedDescription = normalizeDescription(description);

  const review = form.handleSubmit(() => {
    setSubmitError("");
    setStage("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const created = await consultationsApi.create({
        doctor: doctor.id,
        description: normalizedDescription,
        client_request_id: requestId,
        expected_doctor_updated_at: doctor.updated_at,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor", doctor.id] }),
      ]);
      navigate(created.next_path, { replace: true, state: { announcement: t("consultation.created") } });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const refreshCodes = new Set([
          "doctor_not_accepting",
          "doctor_profile_unavailable",
          "specialty_inactive",
          "doctor_state_changed",
        ]);
        if (error.data.code && refreshCodes.has(error.data.code)) {
          await doctorQuery.refetch();
          setStage("edit");
        }
        if (error.data.fields?.description?.[0]) {
          form.setError("description", { message: error.data.fields.description[0] });
          form.setFocus("description");
          setStage("edit");
        }
        setSubmitError(t(`consultation.error.${error.data.code || "generic"}`));
      } else {
        setSubmitError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">{t("consultation.new")}</h1>
      <p className="mb-6 text-sm text-slate-600">{stage === "edit" ? t("consultation.stepDetails") : t("consultation.stepReview")}</p>
      <Alert variant="warning">{t("consultation.notEmergency")}</Alert>

      <Card className="mt-6">
        <section aria-labelledby="selected-doctor-heading">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AvatarFallback name={doctor.full_name} size="sm" />
              <div>
                <h2 id="selected-doctor-heading" className="font-semibold text-slate-900">{doctor.full_name}</h2>
                <p className="text-sm text-slate-600">{doctor.specialty.name}</p>
              </div>
            </div>
            {stage === "edit" && <Link className="text-sm font-medium text-primary-700 underline" to="/app/patient/doctors">{t("consultation.changeDoctor")}</Link>}
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">{t("doctor.fee")}</dt><dd>{formatDoctorMoney(doctor.consultation_fee, locale)}</dd></div>
            <div><dt className="text-slate-500">{t("doctor.responseTime")}</dt><dd>{formatEstimatedResponse(doctor.estimated_response_minutes, t)}</dd></div>
          </dl>
        </section>

        {!canCreate ? (
          <div className="mt-6" role="alert">
            <Alert variant="warning">{t(`doctor.unavailableReason.${doctor.unavailable_reason || "not_accepting_consultations"}`)}</Alert>
            <Link className="mt-3 inline-flex text-primary-700 underline" to="/app/patient/doctors">{t("consultation.chooseAnotherDoctor")}</Link>
          </div>
        ) : stage === "edit" ? (
          <form className="mt-6 space-y-3 border-t border-slate-200 pt-6" onSubmit={review} noValidate>
            <Textarea
              id="consultation-description"
              label={t("consultation.chiefComplaint")}
              maxLength={2000}
              rows={7}
              error={form.formState.errors.description?.message}
              aria-describedby={`consultation-description-help consultation-description-count${form.formState.errors.description ? " consultation-description-error" : ""}`}
              {...form.register("description")}
            />
            <p id="consultation-description-help" className="text-sm text-slate-600">{t("consultation.descriptionHelp")}</p>
            <p id="consultation-description-count" className="text-end text-sm text-slate-500" aria-live="polite">
              {t("consultation.characterCount", { count: formatNumber(description.length), max: formatNumber(2000) })}
            </p>
            {submitError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
            <Button type="submit" className="w-full">{t("consultation.review")}</Button>
          </form>
        ) : (
          <section className="mt-6 border-t border-slate-200 pt-6" aria-labelledby="review-heading">
            <h2 id="review-heading" className="text-lg font-semibold text-slate-900">{t("consultation.reviewTitle")}</h2>
            <div className="mt-3 rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-medium text-slate-700">{t("consultation.chiefComplaint")}</h3>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{normalizedDescription}</p>
            </div>
            <p className="mt-4 text-sm text-slate-600">{t("consultation.submissionNotice")}</p>
            {submitError && <div role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
            <div className="mt-5 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" disabled={submitting} onClick={() => setStage("edit")}>{t("common.back")}</Button>
              <Button type="button" className="flex-1" loading={submitting} disabled={submitting} onClick={submit}>{t("consultation.submit")}</Button>
            </div>
            <div className="sr-only" aria-live="assertive">{submitting ? t("consultation.submitting") : ""}</div>
          </section>
        )}
      </Card>
    </main>
  );
}
