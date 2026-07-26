import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";

import { specialtiesAdminApi } from "../../api/specialtiesAdmin";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import type { AdminSpecialtyWriteInput } from "../../types/adminPhaseE";
import { getErrorMessage } from "../../utils/errors";

const emptyForm: AdminSpecialtyWriteInput = {
  code: "",
  name_en: "",
  name_ar: "",
  name_ckb: "",
  description: "",
  display_order: 0,
};

export function SpecialtyAdminListPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");

  const page = Number(params.get("page") || 1);
  const activeValue = params.get("active") || "";
  const search = params.get("search") || "";
  const ordering = params.get("ordering") || "display_order";

  const query = useQuery({
    queryKey: ["admin-specialties", page, activeValue, search, ordering],
    queryFn: () =>
      specialtiesAdminApi.list({
        page,
        page_size: 20,
        active: activeValue ? activeValue === "true" : undefined,
        search: search || undefined,
        ordering,
      }),
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-specialties"] }),
      queryClient.invalidateQueries({ queryKey: ["specialties"] }),
      queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-workload"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-applications"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: () => specialtiesAdminApi.create(form),
    onSuccess: async () => {
      setCreateOpen(false);
      setForm(emptyForm);
      setStatusMessage(t("specialtyAdmin.created"));
      await invalidate();
    },
  });

  const stateMutation = useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      input.active
        ? specialtiesAdminApi.activate(input.id)
        : specialtiesAdminApi.deactivate(input.id),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => {
      const all = await specialtiesAdminApi.list({
        page: 1,
        page_size: 100,
        ordering: "display_order",
      });
      if (all.count > all.results.length) {
        throw new Error(t("specialtyAdmin.reorderLimit"));
      }
      const items = [...all.results];
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return items;
      [items[index], items[target]] = [items[target], items[index]];
      return specialtiesAdminApi.reorder(
        items.map((item, itemIndex) => ({
          id: item.id,
          display_order: itemIndex + 1,
        })),
      );
    },
    onSuccess: invalidate,
  });

  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next, { replace: true });
  };

  if (query.isLoading) return <Spinner />;
  if (query.isError) {
    return (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  }

  const data = query.data;
  return (
    <div aria-busy={query.isFetching} className="space-y-5">
      <PageHeader
        title={t("specialtyAdmin.title")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("specialtyAdmin.create")}
          </Button>
        }
      />
      {statusMessage && <p role="status" className="text-sm text-green-700">{statusMessage}</p>}
      {(createMutation.isError || stateMutation.isError || reorderMutation.isError) && (
        <p role="alert" className="text-sm text-red-700">
          {getErrorMessage(
            createMutation.error || stateMutation.error || reorderMutation.error,
          )}
        </p>
      )}

      <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3">
        <Input
          label={t("common.search")}
          value={search}
          onChange={(event) => updateParams({ search: event.target.value, page: "1" })}
        />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t("specialtyAdmin.status")}</span>
          <select
            className="block w-full rounded-lg border border-slate-300 px-3 py-2"
            value={activeValue}
            onChange={(event) => updateParams({ active: event.target.value, page: "1" })}
          >
            <option value="">{t("common.all")}</option>
            <option value="true">{t("specialtyAdmin.active")}</option>
            <option value="false">{t("specialtyAdmin.inactive")}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t("specialtyAdmin.ordering")}</span>
          <select
            className="block w-full rounded-lg border border-slate-300 px-3 py-2"
            value={ordering}
            onChange={(event) => updateParams({ ordering: event.target.value, page: "1" })}
          >
            <option value="display_order">{t("specialtyAdmin.displayOrder")}</option>
            <option value="name_en">{t("specialtyAdmin.nameEn")}</option>
            <option value="-doctor_count">{t("specialtyAdmin.doctorCount")}</option>
            <option value="-created_at">{t("specialtyAdmin.createdAt")}</option>
          </select>
        </label>
      </div>

      {!data?.results.length ? (
        <EmptyState message={t("specialtyAdmin.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["code", "translations", "status", "usage", "ordering", "actions"].map((key) => (
                  <th key={key} scope="col" className="px-4 py-3 text-start text-xs font-semibold text-slate-600">
                    {t(`specialtyAdmin.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.results.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-sm">{item.code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div lang="en" dir="ltr">{item.name_en}</div>
                    <div lang="ar" dir="rtl">{item.name_ar}</div>
                    <div lang="ckb" dir="rtl">{item.name_ckb}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.is_active ? "success" : "neutral"}>
                      {item.is_active ? t("specialtyAdmin.active") : t("specialtyAdmin.inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{t("specialtyAdmin.doctors")}: {item.doctor_count}</div>
                    <div>{t("specialtyAdmin.consultations")}: {item.active_consultation_count}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("specialtyAdmin.moveUp")}
                        onClick={() => reorderMutation.mutate({ id: item.id, direction: -1 })}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="min-w-6 text-center">{item.display_order}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("specialtyAdmin.moveDown")}
                        onClick={() => reorderMutation.mutate({ id: item.id, direction: 1 })}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/app/staff/specialties/${item.id}`}>
                        <Button size="sm" variant="outline">{t("common.edit")}</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant={item.is_active ? "danger" : "secondary"}
                        loading={stateMutation.isPending}
                        onClick={() =>
                          stateMutation.mutate({ id: item.id, active: !item.is_active })
                        }
                      >
                        {item.is_active
                          ? t("specialtyAdmin.deactivate")
                          : t("specialtyAdmin.activate")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.count > 20 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={!data.previous}
            onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm text-slate-600">{page}</span>
          <Button
            variant="outline"
            disabled={!data.next}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            {t("common.next")}
          </Button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        title={t("specialtyAdmin.create")}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <SpecialtyFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function SpecialtyFields({
  form,
  setForm,
}: {
  form: AdminSpecialtyWriteInput;
  setForm: React.Dispatch<React.SetStateAction<AdminSpecialtyWriteInput>>;
}) {
  const { t } = useI18n();
  const update = (key: keyof AdminSpecialtyWriteInput, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <>
      <Input required label={t("specialtyAdmin.code")} value={form.code} onChange={(e) => update("code", e.target.value)} />
      <Input required lang="en" dir="ltr" label={t("specialtyAdmin.nameEn")} value={form.name_en} onChange={(e) => update("name_en", e.target.value)} />
      <Input required lang="ar" dir="rtl" label={t("specialtyAdmin.nameAr")} value={form.name_ar} onChange={(e) => update("name_ar", e.target.value)} />
      <Input required lang="ckb" dir="rtl" label={t("specialtyAdmin.nameCkb")} value={form.name_ckb} onChange={(e) => update("name_ckb", e.target.value)} />
      <Input label={t("specialtyAdmin.description")} value={form.description || ""} onChange={(e) => update("description", e.target.value)} />
      <Input required min={0} type="number" label={t("specialtyAdmin.displayOrder")} value={form.display_order} onChange={(e) => update("display_order", Number(e.target.value))} />
    </>
  );
}
