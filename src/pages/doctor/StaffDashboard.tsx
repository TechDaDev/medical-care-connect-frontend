import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";

export function StaffDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("nav.dashboard")}
      </h1>
      <Card>
        <p className="text-gray-600">
          Staff dashboard — coming in a future phase.
        </p>
      </Card>
    </div>
  );
}
