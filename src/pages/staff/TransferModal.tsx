import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../../api/staff";
import { doctorsApi } from "../../api/doctors";
import { t } from "../../utils/i18n";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Select } from "../../components/common/Select";
import { Textarea } from "../../components/common/Textarea";
import { ApiRequestError } from "../../utils/errors";

interface Props {
  consultationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferModal({ consultationId, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [doctorId, setDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: doctors } = useQuery({
    queryKey: ["approved-doctors"],
    queryFn: () => doctorsApi.list({ page_size: 100 }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      staffApi.transfer(consultationId, {
        doctor_id: doctorId,
        reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-consultations"] });
      qc.invalidateQueries({ queryKey: ["staff-consultation-detail"] });
      qc.invalidateQueries({ queryKey: ["staff-dashboard"] });
      onSuccess();
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.data?.fields) {
        const mapped: Record<string, string> = {};
        Object.entries(err.data.fields).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFieldErrors(mapped);
      }
    },
  });

  const handleSubmit = () => {
    setFieldErrors({});
    if (!reason.trim()) {
      setFieldErrors({ reason: t("staff.reasonRequired") });
      return;
    }
    if (!doctorId) {
      setFieldErrors({ doctor_id: t("staff.selectDoctor") });
      return;
    }
    mutation.mutate();
  };

  const doctorOptions = (doctors?.results || []).map((d) => ({
    value: d.id,
    label: `${d.full_name} - ${d.specialty_name}`,
  }));

  return (
    <Modal open title={t("transfer.title")} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("consultation.transferTo")}
          </label>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[
              { value: "", label: t("staff.selectDoctor") },
              ...doctorOptions,
            ]}
          />
          {fieldErrors.doctor_id && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.doctor_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transfer.reason")}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t("transfer.reason")}
          />
          {fieldErrors.reason && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.reason}</p>
          )}
        </div>

        {mutation.isError && !fieldErrors.reason && !fieldErrors.doctor_id && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof ApiRequestError
              ? mutation.error.data?.detail || t("error.unknown")
              : t("error.unknown")}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            {t("staff.confirmTransfer")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
