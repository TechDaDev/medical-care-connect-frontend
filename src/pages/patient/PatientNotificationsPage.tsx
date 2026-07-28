import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../api/notifications";
import type { Notification } from "../../types";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";

export function PatientNotificationsPage() {
  const { t, formatDateTime } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [opening, setOpening] = useState<string | null>(null);
  const filters = {
    page: Number(params.get("page") || "1"),
    unread: params.get("unread") || undefined,
    type: params.get("type") || undefined,
    created_after: params.get("created_after") || undefined,
    created_before: params.get("created_before") || undefined,
  };
  const query = useQuery({
    queryKey: ["notifications", filters],
    queryFn: () => notificationsApi.list(filters),
    refetchInterval: Number(import.meta.env.VITE_NOTIFICATION_POLL_INTERVAL_MS) || 30000,
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
  };
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: invalidate,
  });
  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: invalidate,
  });
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const openNotification = async (notification: Notification) => {
    setOpening(notification.id);
    try {
      if (!notification.is_read) await markOne.mutateAsync(notification.id);
      const path = notification.link.path;
      if (path && path.startsWith("/app/") && !path.startsWith("//")) navigate(path);
    } finally {
      setOpening(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("notification.title")}
        actions={<Button size="sm" variant="secondary" onClick={() => query.refetch()}>{t("common.refresh")}</Button>}
      />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            {t("common.status")}
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={params.get("unread") || ""} onChange={(event) => set("unread", event.target.value)}>
              <option value="">{t("common.all")}</option>
              <option value="true">{t("notification.unreadOnly")}</option>
            </select>
          </label>
          <Input label={t("notification.type")} value={params.get("type") || ""} onChange={(event) => set("type", event.target.value)} />
          <Input type="date" label={t("common.createdAfter")} value={params.get("created_after") || ""} onChange={(event) => set("created_after", event.target.value)} />
          <Input type="date" label={t("common.createdBefore")} value={params.get("created_before") || ""} onChange={(event) => set("created_before", event.target.value)} />
        </div>
        <Button className="mt-3" variant="secondary" size="sm" loading={markAll.isPending} onClick={() => markAll.mutate()}>{t("notification.markAllRead")}</Button>
      </Card>
      {query.isLoading && <Spinner />}
      {query.isError && <ErrorState onRetry={() => query.refetch()} />}
      {query.data?.results.length === 0 && <EmptyState message={t("notification.empty")} />}
      <div className="space-y-2">
        {query.data?.results.map((notification) => (
          <Card key={notification.id} className={notification.is_read ? "opacity-70" : "border-primary-300"}>
            <button
              className="w-full text-start disabled:cursor-wait"
              disabled={opening === notification.id}
              onClick={() => openNotification(notification)}
              aria-label={`${notification.title}. ${notification.is_read ? t("notification.read") : t("notification.unread")}`}
            >
              <div className="flex items-start gap-3">
                {!notification.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />}
                <div>
                  <p className="font-medium">{notification.title}</p>
                  {notification.body && <p className="mt-1 text-sm text-slate-600">{notification.body}</p>}
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(notification.created_at)}</p>
                </div>
              </div>
            </button>
          </Card>
        ))}
      </div>
      {query.data && query.data.count > query.data.results.length && (
        <nav className="mt-4 flex justify-between" aria-label={t("common.pagination")}>
          <Button variant="secondary" disabled={!query.data.previous} onClick={() => set("page", String(filters.page - 1))}>{t("common.previous")}</Button>
          <Button variant="secondary" disabled={!query.data.next} onClick={() => set("page", String(filters.page + 1))}>{t("common.next")}</Button>
        </nav>
      )}
    </div>
  );
}
