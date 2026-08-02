import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorPhaseDApi } from "../../api/doctorPhaseD";
import { Card, ErrorState, PageHeader, Spinner } from "../../components/common";
import { useI18n } from "../../i18n";

export function DoctorPrivacyPage() {
  const { t } = useI18n(); const query = useQuery({ queryKey: ["doctor-privacy"], queryFn: doctorPhaseDApi.privacy });
  if (query.isLoading) return <Spinner />; if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  const data = query.data!; return <div><PageHeader title={t("doctorD.privacy.title")} />
    <div className="grid gap-4 md:grid-cols-2"><Card><h2 className="font-semibold">{t("doctorD.privacy.visibility")}</h2><p>{t(`doctorD.privacy.visibility.${data.profile_visibility}`)}</p><p>{data.profile_completion.completion_percent}%</p><Link className="text-primary-700" to={data.links.profile}>{t("nav.profile")}</Link></Card>
    <Card><h2 className="font-semibold">{t("doctorD.privacy.retention")}</h2><p>{t("doctorD.privacy.retentionClinical")}</p><p>{t("doctorD.privacy.retentionAudit")}</p></Card>
    <Card><h2 className="font-semibold">{t("doctorD.privacy.export")}</h2><p>{t("doctorD.privacy.exportHelp")}</p><Link className="text-primary-700" to={data.links.exports}>{t("doctorD.privacy.manageExport")}</Link></Card>
    <Card><h2 className="font-semibold">{t("doctorD.privacy.deletion")}</h2><p>{t("doctorD.privacy.deletionHelp")}</p><Link className="text-primary-700" to={data.links.deletion}>{t("doctorD.privacy.manageDeletion")}</Link></Card></div>
  </div>;
}
