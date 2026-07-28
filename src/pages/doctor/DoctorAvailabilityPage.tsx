import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { doctorsApi } from "../../api/doctors";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { ErrorState } from "../../components/common/ErrorState";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { useI18n } from "../../i18n";
import type { DoctorAvailabilityInput, DoctorAvailabilitySlot } from "../../types";
import { getErrorMessage } from "../../utils/errors";

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const emptyForm: Required<Omit<DoctorAvailabilityInput, "expected_updated_at">> = {
  day_of_week: "monday",
  start_time: "09:00",
  end_time: "12:00",
  is_active: true,
};

export function DoctorAvailabilityPage() {
  const { t, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const availabilityQuery = useQuery({
    queryKey: ["doctor-availability"],
    queryFn: doctorsApi.getAvailability,
  });
  const accessQuery = useQuery({
    queryKey: ["doctor-access-state"],
    queryFn: doctorsApi.getAccessState,
  });
  const [editing, setEditing] = useState<DoctorAvailabilitySlot | null>(null);
  const [deleting, setDeleting] = useState<DoctorAvailabilitySlot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [actionError, setActionError] = useState("");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-access-state"] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: DoctorAvailabilityInput) =>
      editing
        ? doctorsApi.updateAvailability(editing.id, {
            ...payload,
            expected_updated_at: editing.updated_at,
          })
        : doctorsApi.createAvailability(payload),
    onSuccess: async () => {
      setFormOpen(false);
      setEditing(null);
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (slot: DoctorAvailabilitySlot) =>
      doctorsApi.deleteAvailability(slot.id, slot.updated_at),
    onSuccess: async () => {
      setDeleting(null);
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: (accepting: boolean) =>
      doctorsApi.toggleAccepting(accepting, accessQuery.data?.updated_at ?? undefined),
    onSuccess: refresh,
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const openCreate = () => {
    setActionError("");
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (slot: DoctorAvailabilitySlot) => {
    setActionError("");
    setEditing(slot);
    setForm({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      is_active: slot.is_active,
    });
    setFormOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setActionError("");
    saveMutation.mutate(form);
  };

  if (availabilityQuery.isLoading) return <Spinner />;
  if (availabilityQuery.error) {
    return (
      <ErrorState
        message={getErrorMessage(availabilityQuery.error)}
        onRetry={() => availabilityQuery.refetch()}
      />
    );
  }
  if (!availabilityQuery.data) return <ErrorState onRetry={() => availabilityQuery.refetch()} />;

  const data = availabilityQuery.data;

  return (
    <main>
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("doctor.availability.title")}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {t("doctor.availability.guidance", { timezone: data.timezone })}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("doctor.availability.add")}
        </Button>
      </header>

      {actionError && (
        <div role="alert" className="mb-4 rounded-lg border border-status-error-200 bg-status-error-50 p-3 text-sm text-status-error-700">
          {actionError}
        </div>
      )}

      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">{t("doctor.acceptingStatus")}</h2>
            <p className="text-sm text-slate-600">
              {data.is_accepting_consultations ? t("doctor.accepting") : t("doctor.notAccepting")}
            </p>
          </div>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <span className="sr-only">{t("doctor.availability.acceptingControl")}</span>
            <input
              type="checkbox"
              role="switch"
              aria-label={t("doctor.availability.acceptingControl")}
              className="h-5 w-10 accent-primary-600"
              checked={data.is_accepting_consultations}
              disabled={toggleMutation.isPending || !data.can_manage}
              onChange={(event) => toggleMutation.mutate(event.target.checked)}
              aria-describedby="accepting-help"
            />
            <span id="accepting-help" className="text-sm text-slate-600">
              {t("doctor.availability.acceptingHelp")}
            </span>
          </label>
        </div>
      </Card>

      <section aria-labelledby="weekly-availability-title">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-5 w-5 text-primary-600" aria-hidden="true" />
          <h2 id="weekly-availability-title" className="text-lg font-semibold text-slate-900">
            {t("doctor.availability.weekly")}
          </h2>
        </div>
        {data.slots.length === 0 ? (
          <Card className="p-8 text-center text-slate-600">
            <p>{t("doctor.availability.empty")}</p>
            <Button className="mt-4" onClick={openCreate}>{t("doctor.availability.add")}</Button>
          </Card>
        ) : (
          <ul className="space-y-3" aria-label={t("doctor.availability.weekly")}>
            {data.slots.map((slot) => (
              <li key={slot.id}>
                <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {t(`doctor.weekday.${slot.day_of_week}`)}
                    </p>
                    <p className="text-sm text-slate-600" dir="ltr">
                      {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {slot.is_active ? t("common.active") : t("common.inactive")} · {formatDateTime(slot.updated_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(slot)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t("common.edit")}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleting(slot)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={formOpen}
        onClose={() => !saveMutation.isPending && setFormOpen(false)}
        title={editing ? t("doctor.availability.edit") : t("doctor.availability.add")}
        closeLabel={t("common.close")}
      >
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {t("doctor.availability.weekday")}
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              value={form.day_of_week}
              onChange={(event) => setForm({ ...form, day_of_week: event.target.value })}
            >
              {weekdays.map((day) => (
                <option key={day} value={day}>{t(`doctor.weekday.${day}`)}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t("doctor.availability.startTime")}
            <input
              required
              type="time"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              value={form.start_time}
              onChange={(event) => setForm({ ...form, start_time: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t("doctor.availability.endTime")}
            <input
              required
              type="time"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              value={form.end_time}
              onChange={(event) => setForm({ ...form, end_time: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            {t("doctor.availability.active")}
          </label>
          {actionError && <p role="alert" className="text-sm text-status-error-700">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => !deleteMutation.isPending && setDeleting(null)}
        title={t("doctor.availability.deleteTitle")}
        closeLabel={t("common.close")}
      >
        <p className="text-sm text-slate-600">{t("doctor.availability.deleteBody")}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>{t("common.cancel")}</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting)}
          >
            {t("common.delete")}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
