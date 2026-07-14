import { useRouteError, isRouteErrorResponse, useNavigate, Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";

interface ErrorPageProps {
  resetErrorBoundary?: () => void;
}

export function ErrorPage({ resetErrorBoundary }: ErrorPageProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const error = useRouteError();

  const isDev = import.meta.env.DEV;
  const isHttpError = isRouteErrorResponse(error);

  let statusCode = 500;
  let message = t("error.unknown");

  if (isHttpError) {
    statusCode = error.status;
    if (statusCode === 404) message = t("error.notFound");
    else if (statusCode === 403) message = t("error.forbidden");
    else if (statusCode >= 500) message = t("error.server");
  }

  const handleRetry = () => {
    if (resetErrorBoundary) resetErrorBoundary();
    else navigate(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">
          {isHttpError ? statusCode : "500"}
        </h1>
        <p className="text-lg text-gray-700 mb-6">{message}</p>
        {isDev && !isHttpError && (
          <details className="mb-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Stack trace
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
              {error instanceof Error ? error.stack || error.message : String(error)}
            </pre>
          </details>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={handleRetry}>
            {t("common.retry")}
          </Button>
          <Link to="/">
            <Button variant="primary">
              {t("common.back")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
