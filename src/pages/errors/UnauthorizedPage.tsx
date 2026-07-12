import { Link } from "react-router-dom";
import { t } from "../../utils/i18n";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">403</h1>
        <p className="text-xl text-gray-600 mb-6">
          {t("common.error")}
        </p>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
