import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner } from "../../components/common";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";

export function DoctorPrivacyExportsPage() {
  const { t, formatDateTime } = useI18n(); const qc = useQueryClient(); const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["doctor-privacy-exports"], queryFn: () => doctorPhaseDApi.exports({ page_size: 50 }) });
  const request = useMutation({ mutationFn: doctorPhaseDApi.requestExport, onSuccess: async () => { setError(""); await Promise.all([qc.invalidateQueries({ queryKey: ["doctor-privacy-exports"] }), qc.invalidateQueries({ queryKey: ["doctor-privacy"] })]); }, onError: e => setError(getErrorMessage(e)) });
  const active = query.data?.results.some(item => item.status === "pending" || item.status === "processing");
  const download = async (id: string) => { setError(""); try { const blob = await doctorPhaseDApi.downloadExport(id); const url = URL.createObjectURL(blob); try { const anchor = document.createElement("a"); anchor.href = url; anchor.download = `doctor-data-export-${id}.zip`; anchor.click(); } finally { URL.revokeObjectURL(url); } } catch (e) { setError(getErrorMessage(e)); } };
  return <div aria-busy={query.isLoading}><PageHeader title={t("doctorD.exports.title")} actions={<Button disabled={active} loading={request.isPending} onClick={() => request.mutate()}>{t("doctorD.exports.request")}</Button>} />
    <p className="mb-4 text-sm text-slate-600">{t("doctorD.exports.scope")}</p>{error && <p role="alert" className="text-red-700">{error}</p>}
    {query.isLoading && <Spinner />}{query.isError && <ErrorState onRetry={() => query.refetch()} />}{query.data?.results.length === 0 && <EmptyState message={t("doctorD.exports.empty")} />}
    <div className="space-y-3">{query.data?.results.map(item => <Card key={item.id}><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">{t(`doctorD.exports.status.${item.status}`)}</h2><p className="text-xs text-slate-500">{formatDateTime(item.requested_at)}</p>{item.failure_code && <p className="text-sm text-red-700">{t("doctorD.exports.failed")}</p>}</div>{item.status === "completed" && <Button size="sm" onClick={() => download(item.id)}>{t("common.download")}</Button>}</div></Card>)}</div>
    <Link className="mt-6 inline-block text-primary-700" to="/app/doctor/privacy">{t("common.back")}</Link>
  </div>;
}
