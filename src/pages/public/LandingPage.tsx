
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Alert } from "../../components/common/Alert";
import { PublicHeader } from "../../components/common/PublicHeader";
import {
  Stethoscope, HeartPulse, Shield, MessageSquare,
  Users, Clock, ArrowRight, Sparkles,
} from "lucide-react";

const features = [
  { icon: Stethoscope, title: "landing.features.expertDoctors.title", description: "landing.features.expertDoctors.description" },
  { icon: HeartPulse, title: "landing.features.personalizedCare.title", description: "landing.features.personalizedCare.description" },
  { icon: Shield, title: "landing.features.securePrivate.title", description: "landing.features.securePrivate.description" },
  { icon: MessageSquare, title: "landing.features.instantMessaging.title", description: "landing.features.instantMessaging.description" },
  { icon: Users, title: "landing.features.continuousSupport.title", description: "landing.features.continuousSupport.description" },
  { icon: Clock, title: "landing.features.available247.title", description: "landing.features.available247.description" },
];

const howItWorksSteps = [
  { step: "01", title: "landing.steps.register.title", description: "landing.steps.register.description", icon: Users },
  { step: "02", title: "landing.steps.find.title", description: "landing.steps.find.description", icon: Stethoscope },
  { step: "03", title: "landing.steps.consult.title", description: "landing.steps.consult.description", icon: MessageSquare },
] as const;

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl shadow-lg shadow-slate-900/5 ${className}`}
      style={{
        backgroundColor: "var(--lp-card-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid var(--lp-card-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CTASection() {
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A2B3C] via-[#2563EB] to-[#60A5FA] p-8 sm:p-12 lg:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2036v-4H4v4H0v2h4v4h2v-4h4v-2H6zm0-30V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-5" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("landing.ctaTitle")}</h2>
            <p className="text-lg text-white/70 mb-8">{t("landing.ctaDescription")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2 !border-0" style={{ backgroundColor: "var(--lp-accent)", color: "#fff" }}>
                  {t("landing.startFree")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/doctors">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2" style={{ color: "#fff" }}>
                  {t("landing.browseDoctors")}
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/50">{t("landing.ctaNoCard")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--lp-bg)" }}>
      <PublicHeader />

      <main>
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-screen flex items-center">
          {/* Ambient background blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, var(--lp-accent) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, var(--lp-text-secondary) 0%, transparent 70%)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, var(--lp-accent) 0%, transparent 60%)" }} />
          </div>

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <GlassCard className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium mb-6 !shadow-none"
                style={{ color: "var(--lp-text-secondary)" }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "var(--lp-accent)" }} />
                {t("landing.badge")}
              </GlassCard>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6" style={{ color: "var(--lp-text)" }}>
                {t("landing.title")}
              </h1>
              <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--lp-text-secondary)" }}>
                {t("landing.description")}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link to="/doctors">
                  <Button size="lg" className="gap-2 w-full sm:w-auto !text-white !border-0"
                    style={{ backgroundColor: "var(--lp-accent)" }}
                  >
                    <Stethoscope className="h-5 w-5" />
                    {t("landing.findDoctor")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto"
                    style={{
                      borderColor: "var(--lp-text-secondary)",
                      color: "var(--lp-text-secondary)",
                      opacity: 0.8,
                    }}
                  >
                    {t("landing.getStarted")}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: "var(--lp-text-secondary)" }}>
                <GlassCard className="px-4 py-2 flex items-center gap-2 !shadow-none">
                  <Shield className="h-4 w-4" style={{ color: "var(--lp-accent)" }} />
                  <span>{t("landing.secureCompliant")}</span>
                </GlassCard>
                <GlassCard className="px-4 py-2 flex items-center gap-2 !shadow-none">
                  <HeartPulse className="h-4 w-4" style={{ color: "var(--lp-accent)" }} />
                  <span>{t("landing.patientFirst")}</span>
                </GlassCard>
                <GlassCard className="px-4 py-2 flex items-center gap-2 !shadow-none">
                  <Clock className="h-4 w-4" style={{ color: "var(--lp-accent)" }} />
                  <span>{t("landing.available247")}</span>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Section ──────────────────────────────────────── */}
        <section className="py-20 sm:py-28" style={{ backgroundColor: "var(--lp-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--lp-text)" }}>
                {t("landing.featuresTitle")}
              </h2>
              <p className="text-lg" style={{ color: "var(--lp-text-secondary)" }}>
                {t("landing.featuresDescription")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <GlassCard
                  key={index}
                  className="group p-6 hover:-translate-y-1 transition-all duration-300 cursor-default text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 border"
                    style={{
                      backgroundColor: "var(--lp-glass-bg)",
                      borderColor: "var(--lp-card-border)",
                    }}
                  >
                    <feature.icon className="h-12 w-12" style={{ color: "var(--lp-accent)" }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--lp-text)" }}>
                    {t(feature.title)}
                  </h3>
                  <p className="leading-relaxed" style={{ color: "var(--lp-text-secondary)" }}>
                    {t(feature.description)}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-28" style={{ backgroundColor: "var(--lp-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--lp-text)" }}>
                {t("landing.howItWorksTitle")}
              </h2>
              <p className="text-lg" style={{ color: "var(--lp-text-secondary)" }}>
                {t("landing.howItWorksDescription")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {howItWorksSteps.map((item, index) => (
                <div key={index} className="relative text-center">
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px z-0"
                      style={{ backgroundColor: "var(--lp-card-border)" }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Step number */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 font-bold text-xl shadow-md"
                      style={{
                        backgroundColor: "var(--lp-step-circle)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid var(--lp-card-border)",
                        color: "var(--lp-text)",
                      }}
                    >
                      {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 border"
                      style={{
                        backgroundColor: "var(--lp-glass-bg)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderColor: "var(--lp-card-border)",
                      }}
                    >
                      <item.icon className="h-7 w-7" style={{ color: "var(--lp-accent)" }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--lp-text)" }}>
                      {t(item.title)}
                    </h3>
                    <p style={{ color: "var(--lp-text-secondary)" }}>{t(item.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection />

        {/* Emergency Notice */}
        <section className="py-8" style={{ backgroundColor: "var(--lp-bg)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <Alert variant="warning" className="!bg-white/60 dark:!bg-slate-800/60 !backdrop-blur-md"
              style={{ borderColor: "var(--lp-card-border)" }}
            >
              <strong>{t("landing.emergency.title")}: </strong>
              {t("landing.emergency.description")}
            </Alert>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: "var(--lp-footer-bg)", color: "var(--lp-footer-text)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/" className="text-xl font-bold mb-4 block text-white">
                {t("app.name")}
              </Link>
              <p className="max-w-sm" style={{ color: "var(--lp-footer-text)" }}>
                {t("landing.footerDescription")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("footer.quickLinks")}</h4>
              <ul className="space-y-2">
                <li><Link to="/doctors" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("nav.findDoctor")}</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("nav.login")}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("nav.register")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">{t("footer.support")}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.helpCenter")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.contact")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.privacy")}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "#2C3E50" }}>
            <p className="text-sm">{t("footer.copyright")}</p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.terms")}</a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.privacy")}</a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: "var(--lp-footer-text)" }}>{t("footer.cookies")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}