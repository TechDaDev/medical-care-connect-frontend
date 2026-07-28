import { useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBeforeUnload, useBlocker, Link } from "react-router-dom";
import { useForm, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { accountsApi } from "../../api/auth";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import type { PatientProfileComposite } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";

type Tab = "account" | "medical" | "emergency" | "preferences";
type AccountForm = {
  first_name: string;
  last_name: string;
  phone_number: string;
};
type ProfileForm = {
  date_of_birth: string;
  gender: string;
  preferred_language: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  notes: string;
};

const accountDefaults = (data: PatientProfileComposite): AccountForm => ({
  first_name: data.account.first_name,
  last_name: data.account.last_name,
  phone_number: data.account.phone_number,
});

const profileDefaults = (data: PatientProfileComposite): ProfileForm => ({
  date_of_birth: data.profile.date_of_birth || "",
  gender: data.profile.gender,
  preferred_language: data.profile.preferred_language,
  address: data.profile.address,
  emergency_contact_name: data.profile.emergency_contact_name,
  emergency_contact_phone: data.profile.emergency_contact_phone,
  blood_type: data.profile.blood_type || "unknown",
  notes: data.profile.notes || "",
});

export function PatientProfilePage() {
  const query = useQuery({
    queryKey: ["patient-profile"],
    queryFn: accountsApi.getPatientProfile,
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }
  return <PatientProfileEditor data={query.data} />;
}

function PatientProfileEditor({ data }: { data: PatientProfileComposite }) {
  const { t } = useI18n();
  const { updateCurrentUser } = useAuth();
  const queryClient = useQueryClient();
  const [displayData, setDisplayData] = useState(data);
  const [tab, setTab] = useState<Tab>("account");
  const [notice, setNotice] = useState("");
  const accountForm = useForm<AccountForm>({ defaultValues: accountDefaults(data) });
  const profileForm = useForm<ProfileForm>({ defaultValues: profileDefaults(data) });
  const dirty = accountForm.formState.isDirty || profileForm.formState.isDirty;

  useBeforeUnload((event) => {
    if (dirty) event.preventDefault();
  });
  const blocker = useBlocker(dirty);

  const acceptAuthoritative = async (authoritative: PatientProfileComposite) => {
    setDisplayData(authoritative);
    accountForm.reset(accountDefaults(authoritative));
    profileForm.reset(profileDefaults(authoritative));
    queryClient.setQueryData(["patient-profile"], authoritative);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["current-user"] }),
    ]);
  };

  const saveAccount = useMutation({
    mutationFn: async (values: AccountForm) => {
      const payload = changedValues(values, accountForm.formState.dirtyFields);
      if (!Object.keys(payload).length) return { synced: true };
      const user = await updateCurrentUser(payload);
      try {
        await acceptAuthoritative(await accountsApi.getPatientProfile());
        return { synced: true };
      } catch {
        setDisplayData((current) => ({ ...current, account: { ...current.account, ...user } }));
        accountForm.reset({
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
        });
        await queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
        return { synced: false };
      }
    },
    onSuccess: ({ synced }) => setNotice(t(synced ? "patientProfile.accountSaved" : "patientProfile.partialSaved")),
    onError: (error) => applyServerErrors(error, accountForm),
  });

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const payload = changedValues(values, profileForm.formState.dirtyFields);
      if ("date_of_birth" in payload && !payload.date_of_birth) {
        payload.date_of_birth = null as unknown as string;
      }
      if (!Object.keys(payload).length) return;
      await acceptAuthoritative(await accountsApi.updatePatientProfile(payload));
    },
    onSuccess: () => setNotice(t("patientProfile.saved")),
    onError: (error) => applyServerErrors(error, profileForm),
  });

  const tabs: Tab[] = ["account", "medical", "emergency", "preferences"];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("patientProfile.title")} />
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700" aria-hidden="true">
            {displayData.account.first_name.slice(0, 1)}
            {displayData.account.last_name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{displayData.account.full_name}</p>
            <p className="text-sm text-slate-500">{displayData.account.email}</p>
            <p className="text-sm font-medium text-primary-700" role="status">
              {t("patientProfile.complete", { percent: displayData.completion.percent })}
            </p>
            <div className="mt-1 h-2 rounded bg-slate-200" role="progressbar" aria-valuenow={displayData.completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label={t("patientProfile.completion")}>
              <div className="h-2 rounded bg-primary-600" style={{ width: `${displayData.completion.percent}%` }} />
            </div>
            {displayData.completion.missing_fields.length > 0 && (
              <div className="mt-3 text-sm text-amber-800">
                <p className="font-medium">{t("patientProfile.incomplete")}</p>
                <ul className="list-inside list-disc">
                  {displayData.completion.missing_fields.map((field) => (
                    <li key={field}>{t(`patientProfile.missing.${field}`)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map((name) => (
          <Button key={name} role="tab" aria-selected={tab === name} variant={tab === name ? "primary" : "secondary"} size="sm" onClick={() => { setNotice(""); setTab(name); }}>
            {t(`patientProfile.tabs.${name}`)}
          </Button>
        ))}
      </div>

      <Card>
        <form
          className="space-y-4"
          noValidate
          onSubmit={
            tab === "account"
              ? accountForm.handleSubmit((values) => saveAccount.mutate(values))
              : profileForm.handleSubmit((values) => saveProfile.mutate(values))
          }
        >
          {tab === "account" && <AccountFields form={accountForm} email={displayData.account.email} t={t} />}
          {tab === "medical" && <MedicalFields form={profileForm} t={t} />}
          {tab === "emergency" && (
            <fieldset className="space-y-4">
              <legend className="font-semibold">{t("patientProfile.emergencySection")}</legend>
              {!displayData.completion.emergency_contact_complete && (
                <p className="text-sm text-amber-800" role="status">{t("patientProfile.emergencyWarning")}</p>
              )}
              <Input label={t("patientProfile.emergencyName")} error={profileForm.formState.errors.emergency_contact_name?.message} {...profileForm.register("emergency_contact_name")} />
              <Input label={t("patientProfile.emergencyPhone")} error={profileForm.formState.errors.emergency_contact_phone?.message} {...profileForm.register("emergency_contact_phone")} />
            </fieldset>
          )}
          {tab === "preferences" && <PreferenceFields form={profileForm} t={t} />}

          <Button type="submit" loading={saveAccount.isPending || saveProfile.isPending} disabled={!dirty}>
            {t("common.save")}
          </Button>
          {notice && <p className="text-sm text-status-success-700" role="status">{notice}</p>}
          {(saveAccount.isError || saveProfile.isError) && (
            <p className="text-sm text-status-error-700" role="alert">{t("patientProfile.saveError")}</p>
          )}
        </form>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">{t("patientProfile.accountPrivacy")}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <Link className="font-medium text-primary-700 hover:underline" to="/app/patient/privacy">{t("nav.privacy")}</Link>
          <Link className="font-medium text-primary-700 hover:underline" to="/app/patient/privacy/exports">{t("privacy.exportData")}</Link>
          <Link className="font-medium text-primary-700 hover:underline" to="/app/patient/privacy/deletion">{t("privacy.requestDeletion")}</Link>
        </div>
      </Card>

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
          <Card className="max-w-md">
            <h2 id="unsaved-title" className="font-semibold">{t("patientProfile.unsaved")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("patientProfile.unsavedDescription")}</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => blocker.proceed()}>{t("patientProfile.leave")}</Button>
              <Button variant="secondary" onClick={() => blocker.reset()}>{t("common.cancel")}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function AccountFields({ form, email, t }: { form: UseFormReturn<AccountForm>; email: string; t: (key: string) => string }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-semibold">{t("patientProfile.accountSection")}</legend>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label={t("auth.firstName")} error={form.formState.errors.first_name?.message} {...form.register("first_name", { required: t("common.required") })} />
        <Input label={t("auth.lastName")} error={form.formState.errors.last_name?.message} {...form.register("last_name", { required: t("common.required") })} />
      </div>
      <Input label={t("auth.email")} value={email} disabled />
      <Input label={t("auth.phone")} error={form.formState.errors.phone_number?.message} {...form.register("phone_number")} />
    </fieldset>
  );
}

function MedicalFields({ form, t }: { form: UseFormReturn<ProfileForm>; t: (key: string) => string }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-semibold">{t("patientProfile.medicalSection")}</legend>
      <Input type="date" label={t("patientProfile.dateOfBirth")} max={new Date().toISOString().slice(0, 10)} error={form.formState.errors.date_of_birth?.message} {...form.register("date_of_birth")} />
      <SelectField label={t("patientProfile.gender")} options={["male", "female", "other", "prefer_not_to_say"]} {...form.register("gender")} />
      <SelectField label={t("patientProfile.bloodType")} options={["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} {...form.register("blood_type")} />
      <TextArea label={t("patientProfile.notes")} maxLength={2000} error={form.formState.errors.notes?.message} {...form.register("notes", { maxLength: { value: 2000, message: t("patientProfile.notesTooLong") } })} />
    </fieldset>
  );
}

function PreferenceFields({ form, t }: { form: UseFormReturn<ProfileForm>; t: (key: string) => string }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-semibold">{t("patientProfile.contactSection")}</legend>
      <SelectField label={t("patientProfile.preferredLanguage")} options={["en", "ar", "ku"]} {...form.register("preferred_language")} />
      <TextArea label={t("patientProfile.address")} maxLength={1000} error={form.formState.errors.address?.message} {...form.register("address", { maxLength: { value: 1000, message: t("patientProfile.addressTooLong") } })} />
    </fieldset>
  );
}

function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  const id = `select-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select id={id} className="w-full rounded-lg border border-slate-300 px-3 py-2" {...props}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const id = `textarea-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea id={id} className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={4} aria-invalid={error ? "true" : "false"} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <p id={`${id}-error`} className="text-sm text-status-error-600" role="alert">{error}</p>}
    </div>
  );
}

function changedValues<T extends FieldValues>(values: T, dirtyFields: Partial<Record<keyof T, unknown>>): Partial<T> {
  return Object.fromEntries(Object.keys(dirtyFields).map((key) => [key, values[key]])) as Partial<T>;
}

function applyServerErrors<T extends FieldValues>(error: unknown, form: UseFormReturn<T>) {
  if (!isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") return;
  for (const [field, messages] of Object.entries(error.response.data)) {
    if (field === "detail" || !Array.isArray(messages)) continue;
    form.setError(field as Path<T>, { type: "server", message: String(messages[0]) }, { shouldFocus: true });
  }
}
