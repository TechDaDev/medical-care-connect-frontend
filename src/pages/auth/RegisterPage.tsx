import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Card } from "../../components/common/Card";
import { PublicHeader } from "../../components/common/PublicHeader";
import { ApiRequestError } from "../../utils/errors";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { specialtiesApi } from "../../api/doctors";
import type { AccountType, DoctorRegistrationInput } from "../../types";

const LANG_MAP: Record<string, string> = {
  en: "English", ar: "العربية", ckb: "کوردی",
};

const accountSchema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1),
  email: z.string().email(), phone_number: z.string().min(1),
  password: z.string().min(8), password_confirm: z.string().min(1),
  specialty: z.string().optional(), medical_license_number: z.string().trim().min(3).max(100).optional(),
  years_of_experience: z.number().int().min(0).max(70).optional(),
  workplace_name: z.string().max(255).optional(), professional_bio: z.string().max(2000).optional(),
  languages: z.array(z.string()).optional(),
}).refine(d => d.password === d.password_confirm, { path: ["password_confirm"], message: "Passwords do not match" });
type FormData = z.infer<typeof accountSchema>;

const LANG_CODES = ["ar", "en", "ckb"] as const;

export function RegisterPage() {
  const { t } = useI18n();
  const { registerPatient, registerDoctor } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [error, setError] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const { data: specialties = [], isLoading: specialtiesLoading, isError, refetch } = useQuery({
    queryKey: ["registration-specialties"], queryFn: specialtiesApi.list, enabled: accountType === "doctor",
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(accountSchema), defaultValues: { languages: [] },
  });
  const specialtyOptions = useMemo(() => specialties.map(s => ({ value: s.id, label: s.name })), [specialties]);

  const chooseType = (type: AccountType) => { setAccountType(type); setError(""); };
  const goBack = () => { setAccountType(null); setError(""); reset(undefined, { keepValues: true }); setLicenseFile(null); };
  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      if (accountType === "patient") {
        await registerPatient(data as Required<Pick<FormData, "first_name" | "last_name" | "email" | "phone_number" | "password" | "password_confirm">>);
        navigate("/app/patient");
        return;
      }
      if (!data.specialty || !data.medical_license_number || data.years_of_experience === undefined || !data.workplace_name || !data.professional_bio || !data.languages?.length) {
        setError(t("registration.completeFields")); return;
      }
      if (!licenseFile) { setError(t("registration.licenseDocRequired")); return; }
      const response = await registerDoctor({ ...data, medical_license_document: licenseFile } as DoctorRegistrationInput);
      navigate(response.next_path);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("registration.failed"));
    }
  };

  return <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
    <PublicHeader />
    <div className="min-h-screen flex items-center justify-center px-4 py-8 pt-24">
    <Card className="w-full max-w-2xl">
      {!accountType ? <section aria-labelledby="account-type-title">
        <h1 id="account-type-title" className="text-2xl font-bold text-center" style={{ color: "var(--page-text)" }}>{t("registration.createAccount")}</h1>
        <p className="text-center mt-2 mb-6" style={{ color: "var(--page-text-secondary)" }}>{t("registration.chooseUse")}</p>
        <div role="radiogroup" aria-label="Account type" className="grid gap-4 md:grid-cols-2">
          {(["patient", "doctor"] as const).map(type => <button key={type} type="button" role="radio" aria-checked={false} onClick={() => chooseType(type)} className="text-left rounded-lg border-2 border-primary-200 p-5 hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <span className="block text-lg font-bold">{t(`registration.${type}`)}</span>
            <span className="block mt-2 text-sm" style={{ color: "var(--page-text-secondary)" }}>{t(`registration.${type}Description`)}</span>
          </button>)}
        </div>
      </section> : <section aria-labelledby="registration-title">
        <div className="flex justify-between items-center mb-5"><Button type="button" variant="ghost" onClick={goBack}>{t("common.back")}</Button><span className="text-sm" aria-label="Registration step">{accountType === "doctor" ? t("registration.professionalApplication") : t("registration.patientRegistration")}</span></div>
        <h1 id="registration-title" className="text-2xl font-bold mb-5 text-center">{accountType === "doctor" ? t("registration.doctorApplication") : t("auth.register")}</h1>
        {error && <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><Input label={t("auth.firstName")} error={errors.first_name?.message} {...register("first_name")} /><Input label={t("auth.lastName")} error={errors.last_name?.message} {...register("last_name")} /></div>
          <Input label={t("auth.email")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label={t("auth.phone")} type="tel" autoComplete="tel" error={errors.phone_number?.message} {...register("phone_number")} />
          <div className="grid grid-cols-2 gap-4"><Input label={t("auth.password")} type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} /><Input label={t("auth.confirmPassword")} type="password" autoComplete="new-password" error={errors.password_confirm?.message} {...register("password_confirm")} /></div>
          {accountType === "doctor" && <fieldset className="space-y-4 border-t pt-4"><legend className="font-semibold">{t("registration.professionalInformation")}</legend>
            {specialtiesLoading ? <p>{t("registration.loadingSpecialties")}</p> : isError ? <p role="alert">{t("registration.loadSpecialtiesError")} <Button type="button" variant="ghost" onClick={() => refetch()}>{t("registration.retry")}</Button></p> : <Select label={t("registration.specialty")} placeholder={t("registration.specialty")} options={specialtyOptions} error={errors.specialty?.message} {...register("specialty")} />}
            <Input label={t("registration.license")} error={errors.medical_license_number?.message} {...register("medical_license_number")} />
            <div className="grid grid-cols-2 gap-4"><Input label={t("registration.experience")} type="number" error={errors.years_of_experience?.message} {...register("years_of_experience", { valueAsNumber: true })} /><Input label={t("registration.workplace")} error={errors.workplace_name?.message} {...register("workplace_name")} /></div>
            <label className="block text-sm font-medium">{t("registration.biography")}<textarea className="mt-1 block w-full rounded-lg border border-slate-300 p-2" rows={4} {...register("professional_bio")} /></label>
            <div><label className="block text-sm font-medium mb-1">{t("registration.licenseDoc")} <span className="text-red-500">*</span></label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setLicenseFile(e.target.files?.[0] || null)} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" /></div>
            <fieldset><legend className="text-sm font-medium">{t("registration.spokenLanguages")}</legend>{LANG_CODES.map(code => <label key={code} className="mr-4 inline-flex items-center gap-1"><input type="checkbox" value={code} {...register("languages")} />{LANG_MAP[code] || code}</label>)}</fieldset>
          </fieldset>}
          <Button type="submit" loading={isSubmitting} className="w-full">{accountType === "doctor" ? t("registration.submitApplication") : t("auth.submit")}</Button>
        </form>
      </section>}
      <p className="mt-4 text-sm text-center" style={{ color: "var(--page-text-secondary)" }}>{t("auth.hasAccount")} <Link to="/login" style={{ color: "var(--lp-accent)" }}>{t("auth.login")}</Link></p>
    </Card>
    </div>
  </div>;
}
