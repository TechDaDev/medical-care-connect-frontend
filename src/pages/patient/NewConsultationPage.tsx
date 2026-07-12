import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doctorsApi, specialtiesApi } from "../../api/doctors";
import { consultationsApi } from "../../api/consultations";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Textarea } from "../../components/common/Textarea";
import { Select } from "../../components/common/Select";
import { Alert } from "../../components/common/Alert";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { ApiRequestError } from "../../utils/errors";

const schema = z.object({
  doctor_id: z.string().min(1, t("auth.required")),
  chief_complaint: z.string().min(1, t("auth.required")),
  patient_note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewConsultationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDoctor = searchParams.get("doctor") || "";
  const [error, setError] = useState("");

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: specialtiesApi.list,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors", "accepting"],
    queryFn: () => doctorsApi.list({ accepting: true }),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { doctor_id: preselectedDoctor },
  });

  const selectedDocId = watch("doctor_id");
  const selectedDoctor = doctors?.results.find(
    (d) => d.id === selectedDocId
  );

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const consultation = await consultationsApi.create(data);
      navigate(`/app/patient/consultations/${consultation.id}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to create consultation."
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("consultation.new")}
      </h1>

      <Alert variant="warning" >
        {t("consultation.notEmergency")}
      </Alert>

      <Card className="mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Doctor"
            options={
              doctors?.results.map((d) => ({
                value: d.id,
                label: `${d.user.full_name}${d.specialty ? ` - ${d.specialty.name}` : ""}`,
              })) || []
            }
            placeholder="Select a doctor"
            error={errors.doctor_id?.message}
            {...register("doctor_id")}
          />

          {selectedDoctor && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <AvatarFallback
                name={selectedDoctor.user.full_name}
                size="sm"
              />
              <div>
                <p className="font-medium text-gray-900">
                  {selectedDoctor.user.full_name}
                </p>
                <p className="text-sm text-gray-500">
                  Fee: ${selectedDoctor.consultation_fee}
                </p>
              </div>
            </div>
          )}

          <Textarea
            label={t("consultation.chiefComplaint")}
            error={errors.chief_complaint?.message}
            {...register("chief_complaint")}
          />

          <Textarea
            label={t("consultation.patientNote")}
            {...register("patient_note")}
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
