import { Link } from "react-router-dom";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";

export function PrivacyPage() {
  const { user } = useAuth();
  const isStaff = user?.role === UserRole.ADMINISTRATOR;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("privacy.title")}</h1>

      <div className="space-y-4">
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("privacy.exportData")}</h2>
            <p className="text-sm text-gray-600 mb-4">{t("privacy.exportDescription")}</p>
            <Link to="/app/privacy/exports">
              <Button>{t("privacy.manageExports")}</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("privacy.deactivateAccount")}</h2>
            <p className="text-sm text-gray-600 mb-4">{t("privacy.deactivateDescription")}</p>
            <Link to="/app/privacy/deletion">
              <Button variant="secondary">{t("privacy.manageDeletion")}</Button>
            </Link>
          </div>
        </Card>

        {isStaff && (
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("privacy.staffDeletionReview")}</h2>
              <p className="text-sm text-gray-600 mb-4">{t("privacy.staffDeletionDescription")}</p>
              <Link to="/app/staff/operations">
                <Button variant="secondary">{t("nav.staff")}</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
