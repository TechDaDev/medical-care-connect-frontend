import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { PageHeader } from "../../components/common/PageHeader";

export function PatientPrivacyPage() {
  const { t } = useI18n();
  const exportsQuery = useQuery({
    queryKey: ["privacy-exports"],
    queryFn: async () => {
      const response = await fetch("/api/privacy/exports/", { credentials: "include" });
      if (!response.ok) throw new Error("privacy exports unavailable");
      return response.json() as Promise<Array<{ id: string; status: string }>>;
    },
  });
  const deletionQuery = useQuery({
    queryKey: ["privacy-deletion-requests"],
    queryFn: async () => {
      const response = await fetch("/api/privacy/deletion-requests/", { credentials: "include" });
      if (!response.ok) throw new Error("privacy deletion requests unavailable");
      return response.json() as Promise<Array<{ id: string; status: string }>>;
    },
  });
  const activeExport = exportsQuery.data?.find((item) => ["pending", "processing"].includes(item.status));
  const activeDeletion = deletionQuery.data?.find((item) => ["pending", "approved", "processing"].includes(item.status));
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("patientPrivacy.title")} />
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">{t("patientPrivacy.summaryTitle")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("patientPrivacy.summary")}</p>
        </Card>
        <Card aria-busy={exportsQuery.isLoading || deletionQuery.isLoading}>
          <h2 className="font-semibold">{t("patientPrivacy.activeTitle")}</h2>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-700">{t("privacy.exportData")}</dt>
              <dd className="text-slate-600">{activeExport ? t(`privacy.exportStatus.${activeExport.status}`) : t("patientPrivacy.noActiveExport")}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">{t("privacy.requestDeletion")}</dt>
              <dd className="text-slate-600">{activeDeletion ? t(`privacy.deletionStatus.${activeDeletion.status}`) : t("patientPrivacy.noActiveDeletion")}</dd>
            </div>
          </dl>
          {(exportsQuery.isError || deletionQuery.isError) && <p className="mt-2 text-sm text-status-error-700" role="alert">{t("patientPrivacy.activeError")}</p>}
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-semibold">{t("privacy.exportData")}</h2>
            <p className="my-2 text-sm text-slate-600">{t("patientPrivacy.exportDescription")}</p>
            <Link className="text-sm font-medium text-primary-700 hover:underline" to="/app/patient/privacy/exports">{t("patientPrivacy.manageExports")}</Link>
          </Card>
          <Card>
            <h2 className="font-semibold">{t("privacy.requestDeletion")}</h2>
            <p className="my-2 text-sm text-slate-600">{t("patientPrivacy.deletionDescription")}</p>
            <Link className="text-sm font-medium text-primary-700 hover:underline" to="/app/patient/privacy/deletion">{t("patientPrivacy.manageDeletion")}</Link>
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold">{t("patientPrivacy.retentionTitle")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("patientPrivacy.retention")}</p>
          <Link className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline" to="/app/patient/profile">{t("patientPrivacy.profileLink")}</Link>
        </Card>
        <Card>
          <h2 className="font-semibold">{t("patientPrivacy.securityTitle")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("patientPrivacy.security")}</p>
        </Card>
      </div>
    </div>
  );
}
