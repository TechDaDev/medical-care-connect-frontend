import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { specialtiesAdminApi } from "../../api/specialtiesAdmin";
import { Button } from "../../components/common/Button";
import { ErrorState } from "../../components/common/ErrorState";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import type { AdminSpecialtyWriteInput } from "../../types/adminPhaseE";
import { getErrorMessage } from "../../utils/errors";
import { SpecialtyFields } from "./SpecialtyAdminListPage";

export function SpecialtyAdminDetailPage() {
  const { specialtyId = "" } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-specialty", specialtyId],
    queryFn: () => specialtiesAdminApi.detail(specialtyId),
    enabled: Boolean(specialtyId),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  return (
    <SpecialtyEditForm
      key={query.data.updated_at}
      detail={query.data}
      specialtyId={specialtyId}
      t={t}
      navigate={navigate}
      queryClient={queryClient}
    />
  );
}

function SpecialtyEditForm({
  detail,
  specialtyId,
  t,
  navigate,
  queryClient,
}: {
  detail: Awaited<ReturnType<typeof specialtiesAdminApi.detail>>;
  specialtyId: string;
  t: ReturnType<typeof useI18n>["t"];
  navigate: ReturnType<typeof useNavigate>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [form, setForm] = useState<AdminSpecialtyWriteInput>({
    code: detail.code,
    name_en: detail.name_en,
    name_ar: detail.name_ar,
    name_ckb: detail.name_ckb,
    description: detail.description,
    display_order: detail.display_order,
    expected_updated_at: detail.updated_at,
  });
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: () => specialtiesAdminApi.update(specialtyId, form),
    onSuccess: async (detail) => {
      setSaved(true);
      queryClient.setQueryData(["admin-specialty", specialtyId], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-specialties"] }),
        queryClient.invalidateQueries({ queryKey: ["specialties"] }),
        queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-workload"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-applications"] }),
      ]);
    },
  });

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      const dirty =
        form.code !== detail.code ||
        form.name_en !== detail.name_en ||
        form.name_ar !== detail.name_ar ||
        form.name_ckb !== detail.name_ckb ||
        form.description !== detail.description ||
        form.display_order !== detail.display_order;
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [form, detail]);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t("specialtyAdmin.edit")}
        subtitle={detail.code}
        actions={
          <Link to="/app/staff/specialties">
            <Button variant="outline">{t("common.back")}</Button>
          </Link>
        }
      />
      {saved && <p role="status" className="mb-4 text-sm text-green-700">{t("specialtyAdmin.saved")}</p>}
      {mutation.isError && <p role="alert" className="mb-4 text-sm text-red-700">{getErrorMessage(mutation.error)}</p>}
      <form
        className="space-y-4 rounded-lg border bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(false);
          mutation.mutate();
        }}
      >
        <SpecialtyFields form={form} setForm={setForm} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate("/app/staff/specialties")}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending}>{t("common.save")}</Button>
        </div>
      </form>
    </div>
  );
}
