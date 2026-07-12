import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { consultationsApi } from "../../api/consultations";
import { messagesApi } from "../../api/messages";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { AvatarFallback } from "../../components/common/AvatarFallback";

export function DoctorDashboard() {
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["doctor-consultations"],
    queryFn: () => consultationsApi.list(),
  });

  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-counts"],
    queryFn: messagesApi.allUnreadCounts,
  });

  const pendingCount =
    consultations?.results.filter((c) => c.status === "submitted")
      .length || 0;

  const activeCount =
    consultations?.results.filter(
      (c) => !["completed", "cancelled"].includes(c.status)
    ).length || 0;

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("nav.dashboard")}
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Unread</p>
          <p className="text-2xl font-bold text-purple-600">
            {unreadCounts?.reduce((s, c) => s + c.unread_count, 0) || 0}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {consultations?.results.slice(0, 10).map((c) => (
          <Link
            key={c.id}
            to={`/app/doctor/consultations/${c.id}`}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarFallback
                    name={c.patient.user.full_name}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.patient.user.full_name}
                    </p>
                    <p className="text-sm text-gray-500">{c.status}</p>
                  </div>
                </div>
                <Badge variant="info">{c.status.replace(/_/g, " ")}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
