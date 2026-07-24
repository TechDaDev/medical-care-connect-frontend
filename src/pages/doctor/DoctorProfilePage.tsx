import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import type { DoctorProfileUpdateInput } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { PageHeader } from "../../components/common/PageHeader";
import { FormField } from "../../components/common/FormField";
import { AccountDetailsForm } from "../../components/common/AccountDetailsForm";
import { Spinner } from "../../components/common/Spinner";

const LANGUAGES = [
  { value: "ar", labelKey: "doctorProfile.arabic" },
  { value: "en", labelKey: "doctorProfile.english" },
  { value: "ckb", labelKey: "doctorProfile.kurdish" },
];

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

export function DoctorProfilePage() {
  const { t } = useI18n();
  const { user, updateCurrentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-doctor-profile"],
    queryFn: doctorsApi.getProfile,
  });

  const { data: specialties, isLoading: specsLoading, error: specsError, refetch: refetchSpecs } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });

  // ── Personal form state ──────────────────────────────────────────
  const [personal, setPersonal] = useState({ first_name: "", last_name: "", phone_number: "" });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState("");

  const [prof, setProf] = useState({
    specialty: "",
    professional_title: "",
    workplace_name: "",
    years_of_experience: 0,
    biography: "",
    qualifications: "",
    consultation_fee: "",
    languages: [] as string[],
    estimated_response_minutes: 60,
  });
  const [profErrors, setProfErrors] = useState<Record<string, string>>({});
  const [profSuccess, setProfSuccess] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Seed form from loaded profile — runs once when data arrives
  if (profile && !initialized) {
    setPersonal({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone_number: profile.phone_number || "",
    });
    setProf({
      specialty: profile.specialty || "",
      professional_title: profile.professional_title || "",
      workplace_name: profile.workplace_name || "",
      years_of_experience: profile.years_of_experience || 0,
      biography: profile.biography || "",
      qualifications: profile.qualifications || "",
      consultation_fee: profile.consultation_fee || "",
      languages: profile.languages || [],
      estimated_response_minutes: profile.estimated_response_minutes || 60,
    });
    setInitialized(true);
  }

  const langOptions = LANGUAGES.map((l) => ({
    value: l.value,
    label: t(l.labelKey),
  }));

  const specialtyOptions = (specialties || []).map((s: { id: string; name: string }) => ({
    value: s.id,
    label: s.name,
  }));

  // ── Personal save ──────────────────────────────────────────────────
  const handlePersonalSave = useCallback(async () => {
    setPersonalSaving(true);
    setPersonalErrors({});
    setPersonalSuccess("");
    try {
      await updateCurrentUser({
        first_name: personal.first_name,
        last_name: personal.last_name,
        phone_number: personal.phone_number,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });
      setProfSuccess(t("doctorProfile.professionalSaved"));
      setProfErrors({});
    },
    onError: (err: unknown) => {
      setProfErrors(parseDrfErrors(err));
    },
  });

  const handleProfSave = useCallback(() => {
    setProfSuccess("");
    profMutation.mutate({
      specialty: prof.specialty || undefined,
      professional_title: prof.professional_title || undefined,
      workplace_name: prof.workplace_name || undefined,
      years_of_experience: prof.years_of_experience,
      biography: prof.biography || undefined,
      qualifications: prof.qualifications || undefined,
      consultation_fee: prof.consultation_fee || undefined,
      languages: prof.languages.length > 0 ? prof.languages : undefined,
      estimated_response_minutes: prof.estimated_response_minutes,
    });
  }, [prof, profMutation]);

  const toggleLanguage = (code: string) => {
    setProf((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  };

  if (profileLoading || !user) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const approvalStatus = profile?.approval_status || "pending";
  const statusBanner = STATUS_BANNERS[approvalStatus] || STATUS_BANNERS.pending;

  const bannerColors: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

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
          <p className="mt-2 text-sm text-status-error-600" role="alert">{personalErrors._form}</p>
        )}
        {personalSuccess && (
          <p className="mt-2 text-sm text-green-600" role="status">{personalSuccess}</p>
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

        {/* Specialty */}
        <FormField className="mb-4">
          {specsLoading ? (
            <div className="text-sm text-slate-500">{t("registration.loadingSpecialties")}</div>
          ) : specsError ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-status-error-600">{t("registration.loadSpecialtiesError")}</span>
              <Button variant="outline" size="sm" onClick={() => refetchSpecs()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <Select
              label={t("doctorProfile.specialty")}
              options={specialtyOptions}
              value={prof.specialty}
              error={profErrors.specialty}
              placeholder={t("common.select")}
              onChange={(e) => setProf((p) => ({ ...p, specialty: e.target.value }))}
            />
          )}
        </FormField>

        {/* Professional title */}
        <FormField className="mb-4">
          <Input
            label={t("doctorProfile.professionalTitle")}
            value={prof.professional_title}
            error={profErrors.professional_title}
            onChange={(e) => setProf((p) => ({ ...p, professional_title: e.target.value }))}
          />
        </FormField>

        {/* Workplace */}
        <FormField className="mb-4">
          <Input
            label={t("doctorProfile.workplace")}
            value={prof.workplace_name}
            maxLength={255}
            error={profErrors.workplace_name}
            onChange={(e) => setProf((p) => ({ ...p, workplace_name: e.target.value }))}
          />
        </FormField>

        {/* Years of experience */}
        <FormField className="mb-4">
          <Input
            label={t("doctorProfile.yearsOfExperience")}
            type="number"
            min={0}
            max={70}
            value={prof.years_of_experience}
            error={profErrors.years_of_experience}
            onChange={(e) => setProf((p) => ({ ...p, years_of_experience: Math.min(70, Math.max(0, Number(e.target.value) || 0)) }))}
          />
        </FormField>

        {/* Biography */}
        <FormField className="mb-4">
          <Textarea
            label={t("doctorProfile.biography")}
            value={prof.biography}
            maxLength={2000}
            error={profErrors.biography}
            onChange={(e) => setProf((p) => ({ ...p, biography: e.target.value }))}
          />
          <p className="text-xs text-slate-400 mt-1">{prof.biography.length}/2000</p>
        </FormField>

        {/* Qualifications */}
        <FormField className="mb-4">
          <Textarea
            label={t("doctorProfile.qualifications")}
            value={prof.qualifications}
            error={profErrors.qualifications}
            onChange={(e) => setProf((p) => ({ ...p, qualifications: e.target.value }))}
          />
        </FormField>

        {/* Consultation fee */}
        <FormField className="mb-4">
          <Input
            label={t("doctorProfile.consultationFee")}
            type="number"
            step="0.01"
            min="0"
            value={prof.consultation_fee}
            error={profErrors.consultation_fee}
            onChange={(e) => setProf((p) => ({ ...p, consultation_fee: e.target.value }))}
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
                    checked={prof.languages.includes(o.value)}
                    onChange={() => toggleLanguage(o.value)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {profErrors.languages && (
              <p className="mt-1 text-sm text-status-error-600" role="alert">{profErrors.languages}</p>
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
            value={prof.estimated_response_minutes}
            error={profErrors.estimated_response_minutes}
            onChange={(e) => setProf((p) => ({ ...p, estimated_response_minutes: Math.max(1, Number(e.target.value) || 1) }))}
          />
        </FormField>

        {profErrors._form && (
          <p className="mt-2 text-sm text-status-error-600" role="alert">{profErrors._form}</p>
        )}
        {profSuccess && (
          <p className="mt-2 text-sm text-green-600" role="status">{profSuccess}</p>
        )}

        <div className="mt-4 flex gap-3">
          <Button onClick={handleProfSave} loading={profMutation.isPending} disabled={profMutation.isPending}>
            {t("doctorProfile.saveProfessional")}
          </Button>
        </div>
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
