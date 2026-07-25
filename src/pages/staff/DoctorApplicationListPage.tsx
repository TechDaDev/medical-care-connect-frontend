import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { staffApi } from "../../api/staff";
import { useI18n } from "../../i18n";
import { Spinner } from "../../components/common/Spinner";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/common/Button";
import { RefreshButton } from "../../components/common/RefreshButton";
import { getErrorMessage } from "../../utils/errors";
import type { DoctorApplicationStatus } from "../../types/staff";

const STATUS_TABS: DoctorApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
];

export function DoctorApplicationListPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const status =
    (searchParams.get("status") as DoctorApplicationStatus) || "pending";
  const search = searchParams.get("search") || "";
  const specialty = searchParams.get("specialty") || "";
  const createdAfter = searchParams.get("created_after") || "";
  const createdBefore = searchParams.get("created_before") || "";
  const ordering = searchParams.get("ordering") || "created_at";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "staff-doctor-applications",
      status,
      search,
      specialty,
      createdAfter,
      createdBefore,
      ordering,
      page,
    ],
    queryFn: () =>
      staffApi.doctorApplications({
        status,
        search: search || undefined,
        specialty: specialty || undefined,
        created_after: createdAfter || undefined,
        created_before: createdBefore || undefined,
        ordering: ordering !== "created_at" ? ordering : undefined,
        page,
      }),
  });

  const updateParam = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      if (key !== "page") newParams.delete("page");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearch = useCallback(() => {
    updateParam("search", searchInput);
  }, [searchInput, updateParam]);

  const statusBadgeClass = (s: string) => {
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("doctorApplications.title")}
        </h1>
        <RefreshButton onClick={() => refetch()} />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => updateParam("status", s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              status === s
                ? "bg-primary-100 text-primary-700 border border-primary-300"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t(`doctorApplications.status.${s}`)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("doctorApplications.search")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t("doctorApplications.search")}
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            {t("doctorApplications.retry")}
          </Button>
        </div>

        <select
          value={ordering}
          onChange={(e) => updateParam("ordering", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          aria-label={t("doctorApplications.sort")}
        >
          <option value="created_at">{t("doctorApplications.sort.oldest")}</option>
          <option value="-created_at">{t("doctorApplications.sort.newest")}</option>
          <option value="-years_of_experience">
            {t("doctorApplications.sort.experience")}
          </option>
        </select>
      </div>

      {/* Content */}
      {isLoading && <Spinner />}

      {error && (
        <ErrorState
          message={`${t("doctorApplications.error")}: ${getErrorMessage(error)}`}
          onRetry={refetch}
        />
      )}

      {data && data.results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("doctorApplications.empty")}
        </div>
      )}

      {data && data.results.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
                  <th className="py-3 px-4">{t("doctorApplications.columns.name")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.specialty")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.title")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.workplace")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.experience")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.submitted")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.status")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.document")}</th>
                  <th className="py-3 px-4">{t("doctorApplications.columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {app.full_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {app.specialty_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {app.professional_title || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {app.workplace_name || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {app.years_of_experience}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(app.approval_status)}`}
                      >
                        {t(`doctorApplications.status.${app.approval_status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {app.has_license_document ? (
                        <span className="text-green-600">
                          {t("doctorApplications.document.present")}
                          {app.license_document_verified && (
                            <span className="ml-1 text-xs text-green-500">
                              ({t("doctorApplications.document.verified")})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          {t("doctorApplications.document.missing")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/app/staff/doctor-applications/${app.id}`}
                      >
                        <Button variant="secondary" size="sm">
                          {t("doctorApplications.view")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.results.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    {app.full_name}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(app.approval_status)}`}
                  >
                    {t(`doctorApplications.status.${app.approval_status}`)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    {app.specialty_name || "-"} — {app.professional_title || "-"}
                  </p>
                  <p>
                    {app.workplace_name || "-"} · {app.years_of_experience}{" "}
                    {t("doctorApplications.columns.experience").toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("doctorApplications.submittedDate", {
                      date: new Date(app.created_at).toLocaleDateString(),
                    })}
                  </p>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/app/staff/doctor-applications/${app.id}`}
                  >
                    <Button variant="secondary" size="sm">
                      {t("doctorApplications.view")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.count > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                {data.count}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!data.previous}
                  onClick={() =>
                    updateParam("page", String(Math.max(1, page - 1)))
                  }
                >
                  {"<"}
                </Button>
                <span className="px-3 py-1">{page}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!data.next}
                  onClick={() => updateParam("page", String(page + 1))}
                >
                  {">"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
