import { Link } from "react-router-dom";
import { Button } from "../common/Button";
import { useI18n } from "../../i18n";
import { PatientConsultationDetail } from "../../types";

export function PatientConsultationActions({
  consultation, onCancel,
}: { consultation: PatientConsultationDetail; onCancel: () => void }) {
  const { t } = useI18n();
  const id = consultation.id;
  const recordId = consultation.medical_record_summary.id;
  return (
    <div className="flex flex-wrap gap-2">
      {(consultation.actions.can_start_intake || consultation.actions.can_continue_intake) && (
        <Link to={`/app/patient/consultations/${id}/intake`}><Button>{t("intake.continue")}</Button></Link>
      )}
      {consultation.actions.can_message && (
        <Link to={`/app/patient/messages/${id}`}><Button variant="secondary">{t("message.title")}</Button></Link>
      )}
      {consultation.actions.can_view_record && recordId && (
        <Link to={`/app/patient/medical-records/${recordId}`}><Button variant="secondary">{t("record.title")}</Button></Link>
      )}
      {consultation.actions.can_cancel && (
        <Button variant="danger" onClick={onCancel}>{t("consultation.cancel")}</Button>
      )}
    </div>
  );
}
