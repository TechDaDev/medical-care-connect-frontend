import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../auth";
import { UserRole } from "../../types";
import { clsx } from "../../utils/clsx";
import { t, setLanguage, getLanguage, type Lang } from "../../utils/i18n";
import { Badge } from "../common/Badge";
import { AvatarFallback } from "../common/AvatarFallback";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const patientNav: NavItem[] = [
  { label: t("nav.dashboard"), path: "/app/patient", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: t("nav.findDoctor"), path: "/doctors", icon: <Stethoscope className="h-5 w-5" /> },
  { label: t("nav.consultations"), path: "/app/patient/consultations", icon: <MessageSquare className="h-5 w-5" /> },
  { label: t("nav.notifications"), path: "/app/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: t("nav.profile"), path: "/app/profile", icon: <User className="h-5 w-5" /> },
];

const doctorNav: NavItem[] = [
  { label: t("nav.dashboard"), path: "/app/doctor", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: t("nav.consultations"), path: "/app/doctor/consultations", icon: <MessageSquare className="h-5 w-5" /> },
  { label: t("nav.notifications"), path: "/app/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: t("nav.profile"), path: "/app/profile", icon: <User className="h-5 w-5" /> },
];

const staffNav: NavItem[] = [
  { label: t("nav.dashboard"), path: "/app/staff", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: t("nav.notifications"), path: "/app/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: t("nav.profile"), path: "/app/profile", icon: <User className="h-5 w-5" /> },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langSwitch, setLangSwitch] = useState<Lang>(getLanguage());

  const role = user?.role as UserRole;
  const navItems =
    role === UserRole.PATIENT
      ? patientNav
      : role === UserRole.DOCTOR
      ? doctorNav
      : staffNav;

  const toggleLang = () => {
    const next: Lang = langSwitch === "en" ? "ar" : "en";
    setLangSwitch(next);
    setLanguage(next);
  };

  const roleLabel = user?.role ? t(`role.${user.role}`) : "";

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={getLanguage() === "ar" ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="text-lg font-bold text-blue-600">
            {t("app.name")}
          </Link>
          <button
            className="lg:hidden text-gray-500"
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
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={langSwitch}
              onChange={(e) => toggleLang()}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            {user && (
              <div className="flex items-center gap-2">
                <AvatarFallback name={user.full_name} size="sm" />
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user.full_name}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 p-1"
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
