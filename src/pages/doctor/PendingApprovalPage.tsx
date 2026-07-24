import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { doctorsApi } from "../../api/doctors";
import { useAuth } from "../../auth";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { useI18n } from "../../i18n";

export function PendingApprovalPage() {
  const { logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: profile } = useQuery({ queryKey: ["my-doctor-profile"], queryFn: doctorsApi.getProfile });
  const status = profile?.approval_status || "pending";
  const heading = status === "rejected" ? "Application update" : status === "suspended" ? "Application suspended" : t("registration.pendingTitle");
  return <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--page-bg)" }}><Card className="max-w-lg w-full">
    <h1 className="text-2xl font-bold">{heading}</h1>
    <p className="mt-3" style={{ color: "var(--page-text-secondary)" }}>{status === "pending" ? t("registration.pendingBody") : "Your doctor application cannot access approved doctor operations."}</p>
    {profile && <dl className="mt-5 text-sm"><dt className="font-semibold">Specialty</dt><dd>{profile.specialty_name || "—"}</dd><dt className="font-semibold mt-2">Workplace</dt><dd>{profile.workplace_name || "—"}</dd></dl>}
    <div className="mt-6 flex gap-3"><Button onClick={() => navigate("/app/doctor/profile")}>Update profile</Button><Button variant="outline" onClick={() => logout().then(() => navigate("/login"))}>Logout</Button></div>
  </Card></div>;
}
