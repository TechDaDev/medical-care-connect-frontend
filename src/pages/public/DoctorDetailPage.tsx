import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../../api/doctors";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/common/Badge";
import { AvatarFallback } from "../../components/common/AvatarFallback";
import { PublicHeader } from "../../components/layout/PublicHeader";
import { useAuth } from "../../auth";

export function DoctorDetailPage() {
  const { t } = useI18n();
  const { doctorId } = useParams<{ doctorId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => doctorsApi.getById(doctorId!),
    enabled: !!doctorId,
  });

  if (isLoading) return <><PublicHeader /><Spinner /></>;
  if (error) return <><PublicHeader /><ErrorState /></>;
  if (!doctor) return null;

  return (
    <>
      <PublicHeader />
      <div className="max-w-3xl mx-auto pt-16" style={{ backgroundColor: "var(--page-bg)", minHeight: "100vh" }}>
      <Card>
        <div className="flex items-start gap-4 mb-6">
          <AvatarFallback name={doctor.full_name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--page-text)" }}>
              {doctor.full_name}
            </h1>
            {doctor.professional_title && (
              <p style={{ color: "var(--page-text-secondary)" }}>{doctor.professional_title}</p>
            )}
            {doctor.specialty_name && (
              <Badge variant="info">{doctor.specialty_name}</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          {doctor.years_of_experience > 0 && (
            <div>
              <span style={{ color: "var(--page-text-secondary)" }}>
                {t("doctor.experience")}:
              </span>{" "}
              <span className="font-medium" style={{ color: "var(--page-text)" }}>{doctor.years_of_experience}</span>
            </div>
          )}
          {doctor.consultation_fee && (
            <div>
              <span style={{ color: "var(--page-text-secondary)" }}>{t("doctor.fee")}:</span>{" "}
              <span className="font-medium" style={{ color: "var(--page-text)" }}>${doctor.consultation_fee}</span>
            </div>
          )}
          {doctor.languages?.length > 0 && (
            <div>
              <span style={{ color: "var(--page-text-secondary)" }}>{t("doctor.languages")}:</span>{" "}
              <span className="font-medium" style={{ color: "var(--page-text)" }}>{doctor.languages.join(", ")}</span>
            </div>
          )}
          {doctor.estimated_response_minutes && (
            <div>
              <span style={{ color: "var(--page-text-secondary)" }}>
                {t("doctor.responseTime")}:
              </span>{" "}
              <span className="font-medium" style={{ color: "var(--page-text)" }}>
                {doctor.estimated_response_minutes} min
              </span>
            </div>
          )}
        </div>

        {doctor.biography && (
          <div className="mb-6">
            <h3 className="font-medium mb-2" style={{ color: "var(--page-text)" }}>Biography</h3>
            <p className="text-sm" style={{ color: "var(--page-text-secondary)" }}>{doctor.biography}</p>
          </div>
        )}

        {doctor.qualifications && (
          <div className="mb-6">
            <h3 className="font-medium mb-2" style={{ color: "var(--page-text)" }}>Qualifications</h3>
            <p className="text-sm" style={{ color: "var(--page-text-secondary)" }}>{doctor.qualifications}</p>
          </div>
        )}

        {doctor.is_accepting_consultations ? (
          <Button
            className="w-full"
            onClick={() => {
              if (!isAuthenticated) {
                navigate(`/login?redirect=/doctors/${doctorId}`);
              } else {
                navigate(`/app/patient/consultations/new?doctor=${doctorId}`);
              }
            }}
          >
            {t("doctor.book")}
          </Button>
        ) : (
          <Badge variant="neutral">{t("doctor.notAccepting")}</Badge>
        )}
      </Card>
    </div>
    </>
  );
}
