import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Shield,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { useI18n } from "../../i18n";
import { staffApi } from "../../api/staff";
import { UserRole } from "../../types";
import type { AdminUserRole, AdminUserAction } from "../../types/staff";
import { clsx } from "../../utils/clsx";

const roleBadgeColors: Record<AdminUserRole, string> = {
  patient: "bg-blue-100 text-blue-800",
  doctor: "bg-green-100 text-green-800",
  coordinator: "bg-purple-100 text-purple-800",
  administrator: "bg-red-100 text-red-800",
};

function RoleBadge({ role }: { role: AdminUserRole }) {
  const { t } = useI18n();
  const label = t(`adminUsers.role${role.charAt(0).toUpperCase() + role.slice(1)}`);
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", roleBadgeColors[role])}>
      {label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useI18n();
  const label = active ? t("adminUsers.active") : t("adminUsers.inactive");
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
      )}
    >
      {active ? (
        <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full inline-block" />
      ) : (
        <span className="w-1.5 h-1.5 mr-1.5 bg-slate-400 rounded-full inline-block" />
      )}
      {label}
    </span>
  );
}

export function AdminUserListPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const roleFilter = (searchParams.get("role") || "") as AdminUserRole | "";
  const activeFilter = searchParams.get("active") || "";
  const searchValue = searchParams.get("search") || "";
  const ordering = searchParams.get("ordering") || "-date_joined";

  const [searchInput, setSearchInput] = useState(searchValue);
  const debouncedSearch = useDebounce(searchInput, 400);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val) newParams.set(key, val);
        else newParams.delete(key);
      });
      if (updates.page === undefined && !updates.search && !updates.role && !updates.active && !updates.ordering) {
        newParams.set("page", "1");
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const search = debouncedSearch || undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-users", page, roleFilter, activeFilter, search, ordering],
    queryFn: () =>
      staffApi.adminUsers({
        page,
        page_size: 20,
        role: roleFilter || undefined,
        active: activeFilter || undefined,
        search,
        ordering,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t("adminUsers.listTitle")}</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("adminUsers.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                updateParams({ search: e.target.value, page: "1" });
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label={t("adminUsers.searchPlaceholder")}
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => updateParams({ role: e.target.value, page: "1" })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            aria-label={t("adminUsers.role")}
          >
            <option value="">{t("common.all") || "All Roles"}</option>
            <option value={UserRole.PATIENT}>{t("adminUsers.rolePatient")}</option>
            <option value={UserRole.DOCTOR}>{t("adminUsers.roleDoctor")}</option>
            <option value={UserRole.COORDINATOR}>{t("adminUsers.roleCoordinator")}</option>
            <option value={UserRole.ADMINISTRATOR}>{t("adminUsers.roleAdministrator")}</option>
          </select>

          {/* Active filter */}
          <select
            value={activeFilter}
            onChange={(e) => updateParams({ active: e.target.value, page: "1" })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            aria-label={t("adminUsers.status")}
          >
            <option value="">{t("common.all") || "All"}</option>
            <option value="true">{t("adminUsers.active")}</option>
            <option value="false">{t("adminUsers.inactive")}</option>
          </select>

          {/* Ordering */}
          <select
            value={ordering}
            onChange={(e) => updateParams({ ordering: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            aria-label="Ordering"
          >
            <option value="-date_joined">{t("adminUsers.dateJoined")} ↓</option>
            <option value="date_joined">{t("adminUsers.dateJoined")} ↑</option>
            <option value="-last_login">{t("adminUsers.lastLogin")} ↓</option>
            <option value="email">{t("adminUsers.email")} ↑</option>
            <option value="-email">{t("adminUsers.email")} ↓</option>
            <option value="role">{t("adminUsers.role")} ↑</option>
            <option value="-role">{t("adminUsers.role")} ↓</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div aria-busy="true" className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
          </div>
          <p className="mt-4 text-slate-500 text-sm">{t("adminUsers.loading")}</p>
        </div>
      ) : isError ? (
        <div role="alert" className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
          <p className="text-red-600 mb-4">{t("adminUsers.errorLoading")}</p>
          <p className="text-sm text-red-500 mb-4">{error instanceof Error ? error.message : ""}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            {t("adminUsers.retry")}
          </button>
        </div>
      ) : data && data.results.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200" role="table">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t("adminUsers.fullName")}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t("adminUsers.role")}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t("adminUsers.status")}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t("adminUsers.dateJoined")}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t("adminUsers.lastLogin")}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <span className="sr-only">{t("adminUsers.viewDetails")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.results.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge active={user.is_active} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : <span className="italic">{t("adminUsers.neverLoggedIn")}</span>
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/app/staff/users/${user.id}`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {t("adminUsers.viewDetails")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.count > 20 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  {data.count} total
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateParams({ page: String(page - 1) })}
                    disabled={!data.previous}
                    className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-slate-600">{page}</span>
                  <button
                    onClick={() => updateParams({ page: String(page + 1) })}
                    disabled={!data.next}
                    className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {data.results.map((user) => (
              <Link
                key={user.id}
                to={`/app/staff/users/${user.id}`}
                className="block bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-slate-900">{user.full_name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge active={user.is_active} />
                  <span className="text-xs text-slate-400">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <UserIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">{t("adminUsers.noUsers")}</h3>
          <p className="text-slate-500">{t("adminUsers.noUsersDescription")}</p>
        </div>
      )}
    </div>
  );
}
