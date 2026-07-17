import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Stethoscope,
  MessageSquare,
  Bell,
  User,
  LogOut,

} from "lucide-react";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";
import { clsx } from "../../utils/clsx";
import { useI18n, type SupportedLocale } from "../../i18n";
import { AvatarFallback } from "../common/AvatarFallback";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, locale, direction, setLocale } = useI18n();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role as UserRole;

  const navItems = useMemo(() => {
    const items =
      role === UserRole.PATIENT
        ? [
            { label: t("nav.dashboard"), path: "/app/patient" },
            { label: t("nav.findDoctor"), path: "/app/patient/doctors" },
            { label: t("nav.consultations"), path: "/app/patient/consultations" },
            { label: t("nav.notifications"), path: "/app/notifications" },
            { label: t("nav.profile"), path: "/app/profile" },
          ]
        : role === UserRole.DOCTOR
        ? [
            { label: t("nav.dashboard"), path: "/app/doctor" },
            { label: t("nav.consultations"), path: "/app/doctor/consultations" },
            { label: t("nav.notifications"), path: "/app/notifications" },
            { label: t("nav.profile"), path: "/app/profile" },
          ]
        : [
            { label: t("nav.dashboard"), path: "/app/staff" },
            { label: t("nav.staffConsultations"), path: "/app/staff/consultations" },
            { label: t("nav.doctorWorkload"), path: "/app/staff/doctors" },
            { label: t("nav.notifications"), path: "/app/notifications" },
            { label: t("nav.profile"), path: "/app/profile" },
          ];
    return items.map((item) => ({
      ...item,
      icon:
        item.path.includes("dashboard") || item.path === "/app/patient" || item.path === "/app/doctor" || item.path === "/app/staff"
          ? <LayoutDashboard className="h-5 w-5" />
          : item.path.includes("doctor") || item.path.includes("workload")
          ? <Stethoscope className="h-5 w-5" />
          : item.path.includes("consultation")
          ? <MessageSquare className="h-5 w-5" />
          : item.path.includes("notification")
          ? <Bell className="h-5 w-5" />
          : <User className="h-5 w-5" />,
    }));
  }, [role, t]);

  return (
    <div className="min-h-screen bg-slate-50 flex" dir={direction === "rtl" ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link to="/" className="text-lg font-bold text-primary-600">
            {t("app.name")}
          </Link>
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="text-sm border-slate-300 rounded px-2 py-1 bg-white focus:border-primary-500 focus:ring-primary-500/20"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="ckb">کوردی</option>
            </select>
            {user && (
              <div className="flex items-center gap-2">
                <AvatarFallback name={user.full_name} size="sm" />
                <span className="text-sm text-slate-700 hidden sm:block">
                  {user.full_name}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-slate-500 hover:text-slate-700 p-1"
              title={t("nav.logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}