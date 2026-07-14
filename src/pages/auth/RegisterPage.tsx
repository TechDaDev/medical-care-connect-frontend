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

export function RegisterPage() {
  const { t } = useI18n();
  const schema = useMemo(() => z
    .object({
      first_name: z.string().min(1, t("auth.required")),
      last_name: z.string().min(1, t("auth.required")),
      email: z.string().email(t("auth.invalidEmail")),
      phone_number: z.string().min(1, t("auth.required")),
      password: z.string().min(6, "Minimum 6 characters"),
      password_confirm: z.string().min(1, t("auth.required")),
    })
    .refine((d) => d.password === d.password_confirm, {
      message: t("auth.passwordMismatch"),
      path: ["password_confirm"],
    }), [t]);
  type FormData = z.infer<typeof schema>;
  const { registerPatient } = useAuth();
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
      await registerPatient(data);
      navigate("/app/patient");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t("auth.register")}
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("auth.firstName")}
              error={errors.first_name?.message}
              {...register("first_name")}
            />
            <Input
              label={t("auth.lastName")}
              error={errors.last_name?.message}
              {...register("last_name")}
            />
          </div>
          <Input
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label={t("auth.phone")}
            type="tel"
            error={errors.phone_number?.message}
            {...register("phone_number")}
          />
          <Input
            label={t("auth.password")}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label={t("auth.confirmPassword")}
            type="password"
            autoComplete="new-password"
            error={errors.password_confirm?.message}
            {...register("password_confirm")}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            {t("auth.submit")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            {t("auth.login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
