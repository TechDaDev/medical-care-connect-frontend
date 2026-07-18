import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { useI18n } from "../../i18n";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Card } from "../../components/common/Card";
import { ApiRequestError } from "../../utils/errors";
import { useState, useMemo } from "react";

export function LoginPage() {
  const { t } = useI18n();
  const schema = useMemo(() => z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(1, t("auth.required")),
  }), [t]);
  type FormData = z.infer<typeof schema>;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const user = await login(data.email, data.password);
      if (user.role === "doctor") navigate("/app/doctor");
      else if (user.role === "coordinator" || user.role === "administrator") navigate("/app/staff");
      else navigate("/app/patient");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--page-bg)" }}>
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "var(--page-text)" }}>
          {t("auth.login")}
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label={t("auth.password")}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("auth.submit")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center" style={{ color: "var(--page-text-secondary)" }}>
          {t("auth.noAccount")}{" "}
          <Link to="/register" style={{ color: "var(--lp-accent)" }} className="hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
