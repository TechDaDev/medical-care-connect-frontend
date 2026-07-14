import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { consultationsApi } from "../../api/consultations";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { Alert } from "../../components/common/Alert";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { ApiRequestError, getErrorMessage } from "../../utils/errors";

const schema = z.object({
  doctor: z.string().min(1, t("auth.required")),
  specialty: z.string().min(1, t("auth.required")),
  description: z.string().min(1, t("auth.required")),
});

type FormData = z.infer<typeof schema>;

export function NewConsultationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get("doctor") || "";
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors", "accepting"],
    queryFn: () => doctorsApi.list({ page_size: 100 }),
  });

  const doctorOptions = useMemo(
    () =>
      doctors?.results.map((d) => ({
        value: d.id,
        label: `${d.full_name}${d.specialty_name ? ` - ${d.specialty_name}` : ""}`,
      })) || [],
    [doctors]
  );

  const selectedDoctor = useMemo(
    () => doctors?.results.find((d) => d.id === preselectedDoctor) || doctors?.results[0],
    [doctors, preselectedDoctor]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { doctor: preselectedDoctor, specialty: "", description: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    setFieldErrors({});
    try {
      const consultation = await consultationsApi.create({
        doctor: data.doctor,
        specialty: data.specialty,
        description: data.description,
      });
      navigate(`/app/patient/consultations/${consultation.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.data?.fields) {
          const mapped: Record<string, string> = {};
          Object.entries(err.data.fields).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setFieldErrors(mapped);
        } else {
          setError(getErrorMessage(err));
        }
      } else {
        setError(getErrorMessage(err));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("consultation.new")}
      </h1>

      <Alert variant="warning">
        {t("consultation.notEmergency")}
      </Alert>

      <Card className="mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label={t("consultation.doctor")}
            options={doctorOptions}
            placeholder={t("doctor.search")}
            error={errors.doctor?.message || fieldErrors.doctor}
            {...register("doctor")}
          />

          {selectedDoctor && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <AvatarFallback name={selectedDoctor.full_name} size="sm" />
              <div>
                <p className="font-medium text-gray-900">{selectedDoctor.full_name}</p>
                <p className="text-sm text-gray-500">{t("doctor.fee")}: ${selectedDoctor.consultation_fee}</p>
              </div>
            </div>
          )}

          <Select
            label={t("doctor.specialty")}
            options={specialties?.map((s) => ({ value: s.id, label: s.name })) || []}
            placeholder={t("doctor.specialty")}
            error={errors.specialty?.message || fieldErrors.specialty}
            {...register("specialty")}
          />

          <Textarea
            label={t("consultation.chiefComplaint")}
            error={errors.description?.message || fieldErrors.description}
            {...register("description")}
          />

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("consultation.submit")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
