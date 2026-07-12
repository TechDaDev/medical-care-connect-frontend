import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../api/notifications";
import { t } from "../../utils/i18n";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly),
    refetchInterval:
      Number(import.meta.env.VITE_NOTIFICATION_POLL_INTERVAL_MS) || 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div>
      <PageHeader
        title={t("notification.title")}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {t("notification.unreadOnly")}
          </Button>
        }
      />

      <div className="mb-4">
        <Button
          variant="secondary"
          size="sm"
          loading={markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
        >
          {t("notification.markAllRead")}
        </Button>
      </div>

      {isLoading && <Spinner />}
      {notifications && notifications.length === 0 && (
        <EmptyState message={t("notification.empty")} />
      )}
      {notifications && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0" />
                    )}
                    <p className="font-medium text-sm text-gray-900">
                      {n.title}
                    </p>
                  </div>
                  {n.body && (
                    <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {n.consultation && (
                  <Link
                    to={`/app/patient/consultations/${n.consultation}`}
                    className="text-blue-600 text-sm hover:underline shrink-0 ml-2"
                  >
                    View
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
