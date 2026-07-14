import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../../api/staff";
import { useI18n } from "../../i18n";

import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Select } from "../../components/common/Select";
import { Textarea } from "../../components/common/Textarea";
import { ApiRequestError } from "../../utils/errors";

interface Props {
  consultationId: string;
  currentPriority: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PriorityControl({
  consultationId,
  currentPriority,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const priorityOptions = useMemo(() => [
    { value: "routine", label: t("consultation.priorityRoutine") },
    { value: "urgent", label: t("consultation.priorityUrgent") },
    { value: "emergency", label: t("consultation.priorityEmergency") },
  ], [t]);
  const [priority, setPriority] = useState(currentPriority);
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      staffApi.updatePriority(consultationId, {
        priority: priority as "routine" | "urgent" | "emergency",
        reason: reason || undefined,
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
    if (priority === "emergency" && !confirmEmergency) {
      setConfirmEmergency(true);
      return;
    }
    mutation.mutate();
  };

  if (confirmEmergency) {
    return (
      <Modal open title={t("staff.confirmEmergency")} onClose={onClose}>
        <p className="text-gray-600 mb-4">{t("staff.confirmEmergencyMsg")}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmEmergency(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {t("common.confirm")}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title={t("priority.title")} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("consultation.priority")}
          </label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityOptions}
          />
          {fieldErrors.priority && (
            <p className="text-sm text-red-600 mt-1">{fieldErrors.priority}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("staff.reason")} ({t("common.or")})
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("staff.reason")}
          />
        </div>

        {mutation.isError && (
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
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
