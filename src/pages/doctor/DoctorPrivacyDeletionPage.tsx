import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import { Button, Card, ErrorState, PageHeader, Spinner, Textarea } from "../../components/common";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";

export function DoctorPrivacyDeletionPage() {
  const { t, formatDateTime } = useI18n(); const qc = useQueryClient(); const [reason, setReason] = useState(""); const [confirmed, setConfirmed] = useState(false); const [status, setStatus] = useState("");
  const query = useQuery({ queryKey: ["doctor-privacy-deletions"], queryFn: () => doctorPhaseDApi.deletions({ page_size: 50 }) });
  const invalidate = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ["doctor-privacy-deletions"] }), qc.invalidateQueries({ queryKey: ["doctor-privacy"] })]); };
  const create = useMutation({ mutationFn: () => doctorPhaseDApi.requestDeletion(reason), onSuccess: async () => { setReason(""); setConfirmed(false); setStatus(t("doctorD.deletion.requested")); await invalidate(); } });
  const cancel = useMutation({ mutationFn: doctorPhaseDApi.cancelDeletion, onSuccess: invalidate });
  const active = query.data?.results.some(item => ["pending", "approved", "processing"].includes(item.status));
  return <div aria-busy={query.isLoading}><PageHeader title={t("doctorD.deletion.title")} />
    <Card className="mb-4"><h2 className="font-semibold">{t("doctorD.deletion.warning")}</h2><p className="text-sm text-slate-700">{t("doctorD.deletion.retention")}</p><p className="text-sm text-slate-700">{t("doctorD.deletion.admin")}</p></Card>
    <Card className="mb-4"><h2 className="font-semibold">{t("doctorD.deletion.request")}</h2><Textarea label={t("doctorD.deletion.reason")} value={reason} minLength={10} maxLength={1000} onChange={e => setReason(e.target.value)} /><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{t("doctorD.deletion.confirm")}</label>{create.isError && <p role="alert" className="text-red-700">{getErrorMessage(create.error)}</p>}<Button className="mt-3" disabled={reason.trim().length < 10 || !confirmed || active} loading={create.isPending} onClick={() => create.mutate()}>{t("doctorD.deletion.submit")}</Button></Card>
    <p role="status" aria-live="polite" className="text-green-700">{status}</p>{query.isLoading && <Spinner />}{query.isError && <ErrorState onRetry={() => query.refetch()} />}
    <div className="space-y-3">{query.data?.results.map(item => <Card key={item.id}><div className="flex items-center justify-between"><div><h2 className="font-semibold">{t(`doctorD.deletion.status.${item.status}`)}</h2><p className="text-xs text-slate-500">{formatDateTime(item.requested_at)}</p></div>{item.can_cancel && <Button size="sm" variant="secondary" loading={cancel.isPending} onClick={() => cancel.mutate(item.id)}>{t("common.cancel")}</Button>}</div></Card>)}</div>
    <Link className="mt-6 inline-block text-primary-700" to="/app/doctor/privacy">{t("common.back")}</Link>
  </div>;
}
