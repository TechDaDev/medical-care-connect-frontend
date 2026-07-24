import { useEffect, useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import type { DoctorProfile, DoctorProfileUpdateInput } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { PageHeader } from "../../components/common/PageHeader";
import { FormField } from "../../components/common/FormField";
import { AccountDetailsForm } from "../../components/common/AccountDetailsForm";
import { Spinner } from "../../components/common/Spinner";

const LANGUAGES = [
  { value: "ar", labelKey: "doctorProfile.arabic" },
  { value: "en", labelKey: "doctorProfile.english" },
  { value: "ckb", labelKey: "doctorProfile.kurdish" },
] as const;

const STATUS_BANNERS: Record<string, { key: string; variant: "info" | "warning" | "error" | "success" }> = {
  pending: { key: "doctorProfile.statusPending", variant: "info" },
  rejected: { key: "doctorProfile.statusRejected", variant: "error" },
  suspended: { key: "doctorProfile.statusSuspended", variant: "warning" },
  approved: { key: "doctorProfile.statusApproved", variant: "success" },
};

function parseDrfErrors(err: unknown): Record<string, string> {
  if (!err || typeof err !== "object") return {};
  const axiosErr = (err as { response?: { data?: Record<string, unknown> } }).response;
  const data = axiosErr?.data;
  if (!data || typeof data !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(data)) {
    if (key === "detail") {
      result._form = String(msgs);
    } else if (Array.isArray(msgs)) {
      result[key] = String(msgs[0]);
    } else {
      result[key] = String(msgs);
    }
  }
  return result;
}

/** Convert backend DoctorProfile to form default values. */
function profileToForm(profile: DoctorProfile) {
  return {
    specialty: profile.specialty ?? "",
    professional_title: profile.professional_title ?? "",
    workplace_name: profile.workplace_name ?? "",
    years_of_experience: profile.years_of_experience ?? 0,
    biography: profile.biography ?? "",
    qualifications: profile.qualifications ?? "",
    consultation_fee:
      profile.consultation_fee != null ? String(profile.consultation_fee) : "",
    languages: Array.isArray(profile.languages) ? [...profile.languages] : [],
    estimated_response_minutes: profile.estimated_response_minutes ?? 60,
  };
}

type ProfFormValues = ReturnType<typeof profileToForm>;

export function DoctorProfilePage() {
  const { t } = useI18n();
  const { user, updateCurrentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Doctor profile query ────────────────────────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ["my-doctor-profile"],
    queryFn: doctorsApi.getProfile,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: specialties, isLoading: specsLoading, error: specsError, refetch: refetchSpecs } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
    staleTime: 5 * 60 * 1000,
  });

  // ── React Hook Form for professional fields ─────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors: rhfErrors, isDirty },
  } = useForm<ProfFormValues>({
    defaultValues: {
      specialty: "",
      professional_title: "",
      workplace_name: "",
      years_of_experience: 0,
      biography: "",
      qualifications: "",
      consultation_fee: "",
      languages: [],
      estimated_response_minutes: 60,
    },
  });

  const watchedLanguages = watch("languages");
  const watchedBio = watch("biography");

  // ── Track whether form has been initialized from server ──────────────
  const initializedRef = useRef(false);
  const prevProfileIdRef = useRef<string | undefined>(undefined);

  // Reset form when fresh profile arrives and form is not dirty
  useEffect(() => {
    if (!profile) return;

    const profileId = profile.id;
    if (!initializedRef.current || profileId !== prevProfileIdRef.current) {
      // First load or profile changed (e.g. after mutation cache update)
      reset(profileToForm(profile));
      initializedRef.current = true;
      prevProfileIdRef.current = profileId;
      return;
    }

    // Background refetch — only reset if form not dirty
    if (!isDirty) {
      reset(profileToForm(profile));
    }
  }, [profile, reset, isDirty]);

  // ── Personal form state ──────────────────────────────────────────────
  const [personal, setPersonal] = useState({ first_name: "", last_name: "", phone_number: "" });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState("");
  const personalInitRef = useRef(false);

  useEffect(() => {
    if (!profile || personalInitRef.current) return;
    setPersonal({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone_number: profile.phone_number ?? "",
    });
    personalInitRef.current = true;
  }, [profile]);

  // ── Professional save result state ───────────────────────────────────
  const [profSaveResult, setProfSaveResult] = useState<{
    kind: "success" | "error" | "verify-error" | null;
    message: string;
  }>({ kind: null, message: "" });
  const [profFieldErrors, setProfFieldErrors] = useState<Record<string, string>>({});

  const langOptions = LANGUAGES.map((l) => ({
    value: l.value,
    label: t(l.labelKey),
  }));

  const specialtyOptions = (specialties ?? []).map((s: { id: string; name: string }) => ({
    value: s.id,
    label: s.name,
  }));

  // ── Personal save ──────────────────────────────────────────────────
  const handlePersonalSave = useCallback(async () => {
    setPersonalSaving(true);
    setPersonalErrors({});
    setPersonalSuccess("");
    try {
      const updated = await updateCurrentUser({
        first_name: personal.first_name,
        last_name: personal.last_name,
        phone_number: personal.phone_number,
      });
      setPersonal({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        phone_number: updated.phone_number ?? "",
      });
      setPersonalSuccess(t("doctorProfile.personalSaved"));
    } catch (err: unknown) {
      setPersonalErrors(parseDrfErrors(err));
    } finally {
      setPersonalSaving(false);
    }
  }, [personal, updateCurrentUser, t]);

  // ── Professional save ──────────────────────────────────────────────
  const profMutation = useMutation({
    mutationFn: (payload: DoctorProfileUpdateInput) => doctorsApi.updateProfile(payload),
    onSuccess: async (updatedProfile) => {
      // Validate response has expected fields
      const required = [
        "id", "specialty", "professional_title", "workplace_name",
        "biography", "qualifications", "years_of_experience",
        "consultation_fee", "languages", "estimated_response_minutes",
        "approval_status",
      ] as const;
      const missing = required.filter((f) => !(f in updatedProfile));
      if (missing.length > 0) {
        setProfSaveResult({
          kind: "verify-error",
          message: "Server response incomplete. Try again.",
        });
        return;
      }

      // Set cache immediately with server response
      queryClient.setQueryData(["my-doctor-profile"], updatedProfile);
      // Reset form with updated data
      reset(profileToForm(updatedProfile));
      initializedRef.current = true;
      prevProfileIdRef.current = updatedProfile.id;

      // Invalidate to trigger background refetch
      await queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });

      setProfSaveResult({ kind: "success", message: t("doctorProfile.professionalSaved") });
      setProfFieldErrors({});
    },
    onError: (err: unknown) => {
      setProfFieldErrors(parseDrfErrors(err));
      setProfSaveResult({ kind: "error", message: "" });
    },
  });

  const onProfSubmit = useCallback(
    (data: ProfFormValues) => {
      setProfSaveResult({ kind: null, message: "" });
      setProfFieldErrors({});

      const payload: DoctorProfileUpdateInput = {
        specialty: data.specialty || undefined,
        professional_title: data.professional_title.trim(),
        workplace_name: data.workplace_name.trim(),
        years_of_experience: data.years_of_experience,
        biography: data.biography.trim(),
        qualifications: data.qualifications.trim(),
        consultation_fee: data.consultation_fee === "" ? "0.00" : data.consultation_fee,
        languages: data.languages,
        estimated_response_minutes: data.estimated_response_minutes,
      };
      profMutation.mutate(payload);
    },
    [profMutation],
  );

  const handleLanguageToggle = (code: string) => {
    const current = getValues("languages");
    const next = current.includes(code)
      ? current.filter((l) => l !== code)
      : [...current, code];
    setValue("languages", next, { shouldDirty: true });
  };

  if (profileLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const approvalStatus = profile?.approval_status ?? "pending";
  const statusBanner = STATUS_BANNERS[approvalStatus] ?? STATUS_BANNERS.pending;

  const bannerColors: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  const fieldError = (name: string) =>
    profFieldErrors[name] ?? rhfErrors[name as keyof ProfFormValues]?.message ?? undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={t("doctorProfile.title")} />

      {/* Status banner */}
      <div
        role="alert"
        className={`mb-6 p-4 rounded-lg border ${bannerColors[statusBanner.variant]}`}
      >
        <p className="text-sm font-medium">{t(statusBanner.key)}</p>
      </div>

      {/* Personal information */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">{t("doctorProfile.personalInfo")}</h2>
        <AccountDetailsForm
          firstName={personal.first_name}
          lastName={personal.last_name}
          email={user.email}
          phoneNumber={personal.phone_number}
          errors={personalErrors}
          onChange={(field, value) => {
            setPersonal((prev) => ({ ...prev, [field]: value }));
            setPersonalErrors((prev) => ({ ...prev, [field]: "" }));
          }}
        />
        {personalErrors._form && (
          <p className="mt-2 text-sm text-status-error-600" role="alert">
            {personalErrors._form}
          </p>
        )}
        {personalSuccess && (
          <p className="mt-2 text-sm text-green-600" role="status">
            {personalSuccess}
          </p>
        )}
        <div className="mt-4">
          <Button onClick={handlePersonalSave} loading={personalSaving} disabled={personalSaving}>
            {t("doctorProfile.savePersonal")}
          </Button>
        </div>
      </Card>

      {/* Professional information */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">{t("doctorProfile.professionalInfo")}</h2>

        <form onSubmit={handleSubmit(onProfSubmit)} noValidate>
          {/* Specialty */}
          <FormField className="mb-4">
            {specsLoading ? (
              <div className="text-sm text-slate-500">{t("registration.loadingSpecialties")}</div>
            ) : specsError ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-status-error-600">
                  {t("registration.loadSpecialtiesError")}
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchSpecs()}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : (
              <select
                id="specialty"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                {...register("specialty")}
                aria-invalid={!!fieldError("specialty")}
                aria-describedby={fieldError("specialty") ? "specialty-error" : undefined}
              >
                <option value="">{t("common.select")}</option>
                {specialtyOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {fieldError("specialty") && (
              <p id="specialty-error" className="mt-1 text-sm text-status-error-600" role="alert">
                {fieldError("specialty")}
              </p>
            )}
          </FormField>

          {/* Professional title */}
          <FormField className="mb-4">
            <Input
              label={t("doctorProfile.professionalTitle")}
              error={fieldError("professional_title")}
              {...register("professional_title")}
            />
          </FormField>

          {/* Workplace */}
          <FormField className="mb-4">
            <Input
              label={t("doctorProfile.workplace")}
              maxLength={255}
              error={fieldError("workplace_name")}
              {...register("workplace_name")}
            />
          </FormField>

          {/* Years of experience */}
          <FormField className="mb-4">
            <Input
              label={t("doctorProfile.yearsOfExperience")}
              type="number"
              min={0}
              max={70}
              error={fieldError("years_of_experience")}
              {...register("years_of_experience", { valueAsNumber: true })}
            />
          </FormField>

          {/* Biography */}
          <FormField className="mb-4">
            <Textarea
              label={t("doctorProfile.biography")}
              maxLength={2000}
              error={fieldError("biography")}
              {...register("biography")}
            />
            <p className="text-xs text-slate-400 mt-1">
              {watchedBio?.length ?? 0}/2000
            </p>
          </FormField>

          {/* Qualifications */}
          <FormField className="mb-4">
            <Textarea
              label={t("doctorProfile.qualifications")}
              error={fieldError("qualifications")}
              {...register("qualifications")}
            />
          </FormField>

          {/* Consultation fee */}
          <FormField className="mb-4">
            <Input
              label={t("doctorProfile.consultationFee")}
              type="number"
              step="0.01"
              min="0"
              error={fieldError("consultation_fee")}
              {...register("consultation_fee")}
            />
          </FormField>

          {/* Spoken languages */}
          <FormField className="mb-4">
            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 mb-2">
                {t("doctorProfile.spokenLanguages")}
              </legend>
              <div className="flex flex-wrap gap-4">
                {langOptions.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={watchedLanguages?.includes(o.value) ?? false}
                      onChange={() => handleLanguageToggle(o.value)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
              {fieldError("languages") && (
                <p className="mt-1 text-sm text-status-error-600" role="alert">
                  {fieldError("languages")}
                </p>
              )}
            </fieldset>
          </FormField>

          {/* Estimated response time */}
          <FormField className="mb-4">
            <Input
              label={`${t("doctorProfile.estimatedResponseTime")} (${t("doctorProfile.minutes")})`}
              type="number"
              min={1}
              max={1440}
              error={fieldError("estimated_response_minutes")}
              {...register("estimated_response_minutes", { valueAsNumber: true })}
            />
          </FormField>

          {profFieldErrors._form && (
            <p className="mt-2 text-sm text-status-error-600" role="alert">
              {profFieldErrors._form}
            </p>
          )}

          {profSaveResult.kind === "success" && (
            <p className="mt-2 text-sm text-green-600" role="status">
              {profSaveResult.message}
            </p>
          )}

          {profSaveResult.kind === "verify-error" && (
            <p
              className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              role="alert"
            >
              {profSaveResult.message}
            </p>
          )}

          <div className="mt-4">
            <Button
              type="submit"
              loading={profMutation.isPending}
              disabled={profMutation.isPending}
            >
              {t("doctorProfile.saveProfessional")}
            </Button>
          </div>
        </form>
      </Card>

      {/* License status */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">{t("doctorProfile.licenseInfo")}</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-600">{t("doctorProfile.documentReceived")}</dt>
            <dd>{profile?.has_license_document ? t("common.yes") : t("common.no")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">{t("doctorProfile.licenseVerified")}</dt>
            <dd>{profile?.license_document_verified ? t("common.yes") : t("common.no")}</dd>
          </div>
        </dl>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <Button variant="outline" onClick={() => navigate("/app/doctor/pending-approval")}>
          {t("doctorProfile.returnToStatus")}
        </Button>
      </div>
    </div>
  );
}
