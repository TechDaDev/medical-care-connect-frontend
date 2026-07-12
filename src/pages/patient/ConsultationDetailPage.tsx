import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

import { Modal } from "../../components/common/Modal";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  intake_in_progress: "Intake in Progress",
  intake_completed: "Intake Completed",
  doctor_review: "Doctor Review",
  awaiting_patient_response: "Awaiting Your Response",
  awaiting_doctor_response: "Awaiting Doctor Response",
  under_review: "Under Review",
  follow_up_required: "Follow-up Required",
  physical_visit_required: "Physical Visit Required",
  transferred: "Transferred",
  completed: "Completed",
  cancelled: "Cancelled",
  emergency_escalated: "Emergency Escalated",
};

export function ConsultationDetailPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: consultation } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getById(consultationId!),
    enabled: !!consultationId,
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      consultationsApi.cancel(consultationId!, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
      setCancelOpen(false);
    },
  });

  const isPatient = user?.role === UserRole.PATIENT;
  const isDoctor = user?.role === UserRole.DOCTOR;

  if (!consultation) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("consultation.title")}
        </h1>
        <Badge variant="info">
          {statusLabels[consultation.status] || consultation.status}
        </Badge>
      </div>

      <Card className="mb-6">
        {isPatient && consultation.doctor && (
          <div className="flex items-center gap-3 mb-4">
            <AvatarFallback
              name={consultation.doctor.user.full_name}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900">
                Dr. {consultation.doctor.user.full_name}
              </p>
              {consultation.doctor.specialty_name && (
                <p className="text-sm text-gray-500">
                  {consultation.doctor.specialty_name}
                </p>
              )}
            </div>
          </div>
        )}

        {isDoctor && consultation.patient && (
          <div className="flex items-center gap-3 mb-4">
            <AvatarFallback
              name={consultation.patient.user.full_name}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900">
                {consultation.patient.user.full_name}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">
              {t("consultation.chiefComplaint")}:
            </span>{" "}
            <span className="text-gray-900">
              {consultation.description || t("consultation.noDescription")}
            </span>
          </div>
          {consultation.submitted_at && (
            <p className="text-gray-400 text-xs">
              Submitted:{" "}
              {new Date(consultation.submitted_at).toLocaleString()}
            </p>
          )}
        </div>
      </Card>

      {/* Actions — based on backend action flags */}
      <div className="flex flex-wrap gap-3">
        {consultation.actions?.can_start_intake && (
          <Link to={`/app/patient/consultations/${consultationId}/intake`}>
            <Button>{t("intake.start")}</Button>
          </Link>
        )}

        {consultation.actions?.can_view_record && consultation.has_medical_record && (
          <Link to={`/app/medical-records/${consultation.id}`}>
            <Button variant="secondary">{t("intake.viewRecord")}</Button>
          </Link>
        )}

        {consultation.actions?.can_accept && isDoctor && (
          <Button
            onClick={async () => {
              await consultationsApi.accept(consultationId!);
              queryClient.invalidateQueries({
                queryKey: ["consultation", consultationId],
              });
            }}
          >
            {t("consultation.accept")}
          </Button>
        )}

        {consultation.actions?.can_message && (
          <Link to={`/app/${isPatient ? "patient" : "doctor"}/messages/${consultationId}`}>
            <Button variant="secondary">{t("message.title")}</Button>
          </Link>
        )}

        {consultation.actions?.can_cancel && (
          <Button variant="danger" onClick={() => setCancelOpen(true)}>
            {t("consultation.cancel")}
          </Button>
        )}
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("consultation.cancel")}
      >
        <textarea
          className="w-full border rounded-lg p-2 text-sm"
          rows={3}
          placeholder={t("consultation.cancelReason")}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <Button
            variant="secondary"
            onClick={() => setCancelOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {t("consultation.cancel")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
