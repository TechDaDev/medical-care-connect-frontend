import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import type { DoctorReviewItem } from "../../types";
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Spinner, Textarea } from "../../components/common";
import { useI18n } from "../../i18n";
import { getErrorMessage } from "../../utils/errors";

function uuid() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12)}`; }

export function DoctorReviewsPage() {
  const { t, formatDate } = useI18n(); const qc = useQueryClient(); const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<DoctorReviewItem | null>(null); const [body, setBody] = useState(""); const [notice, setNotice] = useState("");
  const filters = { page: Number(params.get("page") || 1), responded: params.get("responded") || undefined, awaiting_response: params.get("awaiting") || undefined, rating: params.get("rating") || undefined, ordering: params.get("ordering") || "priority" };
  const query = useQuery({ queryKey: ["doctor-reviews", filters], queryFn: () => doctorPhaseDApi.reviews(filters) });
  const mutation = useMutation({
    mutationFn: () => editing?.response
      ? doctorPhaseDApi.updateReviewResponse(editing.id, body, editing.response.updated_at, uuid())
      : doctorPhaseDApi.createReviewResponse(editing!.id, body, uuid()),
    onSuccess: async () => { setNotice(t("doctorD.reviews.saved")); setEditing(null); setBody(""); await Promise.all([qc.invalidateQueries({ queryKey: ["doctor-reviews"] }), qc.invalidateQueries({ queryKey: ["doctor-dashboard"] }), qc.invalidateQueries({ queryKey: ["doctors"] })]); },
  });
  const set = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== "page") next.delete("page"); setParams(next); };
  const start = (review: DoctorReviewItem) => { setEditing(review); setBody(review.response?.body || ""); setNotice(""); };
  return <div aria-busy={query.isLoading}>
    <PageHeader title={t("doctorD.reviews.title")} actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>} />
    <p role="status" aria-live="polite" className="text-sm text-green-700">{notice}</p>
    {query.data && <Card className="mb-4"><div className="grid gap-3 sm:grid-cols-4"><div><span className="text-sm text-slate-500">{t("doctorD.reviews.average")}</span><p className="text-2xl font-bold">{query.data.summary.average_rating.toFixed(1)}</p></div><div><span className="text-sm text-slate-500">{t("doctorD.reviews.total")}</span><p className="text-2xl font-bold">{query.data.summary.total_published}</p></div><div><span className="text-sm text-slate-500">{t("doctorD.reviews.awaiting")}</span><p className="text-2xl font-bold">{query.data.summary.awaiting_response}</p></div><div aria-label={t("doctorD.reviews.distribution")}>{Object.entries(query.data.summary.rating_distribution).map(([rating, count]) => <span key={rating} className="me-2 text-sm"><span>{rating}★</span> <span>{count}</span></span>)}</div></div></Card>}
    <Card className="mb-4"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium">{t("common.status")}<select className="mt-1 w-full rounded-lg border p-2" value={params.get("responded") || ""} onChange={e => set("responded", e.target.value)}><option value="">{t("common.all")}</option><option value="false">{t("doctorD.reviews.awaiting")}</option><option value="true">{t("doctorD.reviews.responded")}</option></select></label><Input type="number" min="1" max="5" label={t("doctorD.reviews.rating")} value={params.get("rating") || ""} onChange={e => set("rating", e.target.value)} /><Input label={t("doctorD.reviews.ordering")} value={params.get("ordering") || ""} onChange={e => set("ordering", e.target.value)} /></div></Card>
    {query.isLoading && <Spinner />}{query.isError && <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />}{query.data?.results.length === 0 && <EmptyState message={t("doctorD.reviews.empty")} />}
    <div className="space-y-4">{query.data?.results.map(review => <Card key={review.id}><div className="flex justify-between gap-3"><div><h2 className="font-semibold">{review.rating}★ · {review.is_anonymous ? t("doctorD.reviews.anonymous") : review.reviewer_display_name}</h2><p className="text-xs text-slate-500">{formatDate(review.created_at)}</p></div><span className="text-xs">{review.status}</span></div>{review.title && <h3 className="mt-3 font-medium">{review.title}</h3>}<p className="mt-1 text-sm" dir="auto">{review.body}</p>{review.response && <div className="mt-3 rounded-lg bg-primary-50 p-3"><h3 className="text-sm font-semibold">{t("doctorD.reviews.response")}</h3><p dir="auto">{review.response.body}</p></div>}{(review.can_respond || review.can_edit_response) && <Button className="mt-3" size="sm" variant="secondary" onClick={() => start(review)}>{review.response ? t("doctorD.reviews.edit") : t("doctorD.reviews.respond")}</Button>}{review.response_unavailable_reason && <p className="mt-2 text-xs text-slate-500">{t(`doctorD.reviews.reason.${review.response_unavailable_reason}`)}</p>}</Card>)}</div>
    {editing && <Card className="mt-4"><h2 className="font-semibold">{editing.response ? t("doctorD.reviews.edit") : t("doctorD.reviews.respond")}</h2><Textarea label={t("doctorD.reviews.responseLabel")} value={body} maxLength={2000} onChange={e => setBody(e.target.value)} /><p className="mt-1 text-xs text-slate-600">{t("doctorD.reviews.confidentialityWarning")}</p><p className="text-end text-xs">{body.length}/2000</p>{mutation.isError && <p role="alert" className="text-sm text-red-700">{getErrorMessage(mutation.error)}</p>}<div className="mt-2 flex gap-2"><Button disabled={body.trim().length < 10} loading={mutation.isPending} onClick={() => mutation.mutate()}>{t("common.submit")}</Button><Button variant="secondary" onClick={() => setEditing(null)}>{t("common.cancel")}</Button></div></Card>}
  </div>;
}
