import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Alert } from "../../components/common/Alert";

export function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">
            {t("app.name")}
          </h1>
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="ghost">{t("nav.login")}</Button>
            </Link>
            <Link to="/register">
              <Button>{t("nav.register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {t("landing.title")}
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {t("landing.description")}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link to="/doctors">
            <Button size="lg">{t("landing.findDoctor")}</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              {t("landing.login")}
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="ghost" size="lg">
              {t("landing.register")}
            </Button>
          </Link>
        </div>

        <Alert variant="info" >
          {t("landing.aiNote")}
        </Alert>

        <div className="mt-4">
          <Alert variant="warning">
            {t("landing.emergency")}
          </Alert>
        </div>
      </main>
    </div>
  );
}
