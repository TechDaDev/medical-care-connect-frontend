import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsApi } from "../../api/medicalRecords";
import { consultationsApi } from "../../api/consultations";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Alert } from "../../components/common/Alert";
import { Modal } from "../../components/common/Modal";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

export function MedicalRecordPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ["medical-record", recordId],
    queryFn: () => medicalRecordsApi.getById(recordId!),
    enabled: !!recordId,
  });

  const { data: consultation } = useQuery({
    queryKey: ["consultation", record?.consultation],
    queryFn: () => consultationsApi.getById(record!.consultation),
    enabled: !!record?.consultation,
  });

  const confirmMutation = useMutation({
    mutationFn: () => medicalRecordsApi.confirm(recordId!, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-record", recordId] });
      setConfirmOpen(false);
      if (record?.consultation) {
        navigate(`/app/patient/consultations/${record.consultation}`);
      }
    },
  });

  const isPatient = user?.role === UserRole.PATIENT;
  const isFinalized = record?.status === "finalized";

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState />;
  if (!record) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("record.title")}
        </h1>
      </div>

      {!isFinalized && (
        <Alert variant="info">
          {t("record.draft")}
        </Alert>
      )}
      {isFinalized && (
        <Alert variant="success">
          {t("record.finalized")}
        </Alert>
      )}

      <Card className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Chief Complaint" value={record.chief_complaint} />
          <Field label="Symptoms" value={record.symptoms} />
          <Field label="Duration" value={record.duration} />
          <Field label="Severity" value={record.severity} />
          <Field label="Associated Symptoms" value={record.associated_symptoms} />
          <Field label="Chronic Conditions" value={record.chronic_conditions} />
          <Field label="Current Medications" value={record.current_medications} />
          <Field label="Allergies" value={record.allergies} />
          <Field label="Surgical History" value={record.surgical_history} />
          <Field label="Family History" value={record.family_history} />
          <Field label="Pregnancy Status" value={record.pregnancy_status} />
          <Field label="Test Results" value={record.relevant_test_results} />
          {record.missing_information && (
            <div className="md:col-span-2">
              <Field
                label="Missing Information"
                value={record.missing_information}
              />
            </div>
          )}
          {record.emergency_summary && (
            <div className="md:col-span-2">
              <Alert variant="warning">{record.emergency_summary}</Alert>
            </div>
          )}
        </div>
      </Card>

      {isPatient && !isFinalized && (
        <div className="flex gap-3 mt-6">
          <Button onClick={() => setConfirmOpen(true)}>
            {t("record.confirm")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => medicalRecordsApi.confirm(recordId!, false)}
          >
            {t("record.revision")}
          </Button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("record.confirm")}
      >
        <p className="text-sm text-gray-600 mb-4">
          {t("record.confirmModal")}
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            loading={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
          >
            {t("record.confirm")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
