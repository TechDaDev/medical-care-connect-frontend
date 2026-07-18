import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useI18n, type SupportedLocale } from "../../i18n";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../common/Button";

export function PublicHeader() {
  const { t, locale, setLocale } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b shadow-sm" : ""
      }`}
      style={{
        backgroundColor: scrolled ? "var(--lp-navbar-scrolled)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
        borderColor: scrolled ? "var(--lp-navbar-border)" : "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold" style={{ color: "var(--lp-text)" }}>
            {t("app.name")}
          </Link>

          {/* Desktop nav + controls */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/doctors" className="font-medium transition-colors text-sm" style={{ color: "var(--lp-text-secondary)" }}>
              {t("nav.findDoctor")}
            </Link>
            <Link to="/login" className="font-medium transition-colors text-sm" style={{ color: "var(--lp-text-secondary)" }}>
              {t("nav.login")}
            </Link>
            <Link to="/register">
              <Button size="sm" className="!border-0" style={{ backgroundColor: "var(--lp-accent)", color: "#fff" }}>
                {t("nav.register")}
              </Button>
            </Link>

            {/* Divider */}
            <div className="w-px h-6" style={{ backgroundColor: "var(--lp-card-border)" }} />

            {/* Language selector */}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="text-sm rounded px-2 py-1 border cursor-pointer"
              style={{
                backgroundColor: "var(--lp-glass-bg)",
                color: "var(--lp-text)",
                borderColor: "var(--lp-card-border)",
              }}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="ckb">کوردی</option>
            </select>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--lp-text-secondary)" }}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
