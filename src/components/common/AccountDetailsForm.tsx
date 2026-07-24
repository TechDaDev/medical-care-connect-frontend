import { Input } from "./Input";
import { FormField } from "./FormField";
import { useI18n } from "../../i18n";

interface Props {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  errors: Record<string, string>;
  onChange: (field: "first_name" | "last_name" | "phone_number", value: string) => void;
}

export function AccountDetailsForm({ firstName, lastName, email, phoneNumber, errors, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField>
        <Input
          label={t("auth.firstName")}
          value={firstName}
          error={errors.first_name}
          onChange={(e) => onChange("first_name", e.target.value)}
        />
      </FormField>
      <FormField>
        <Input
          label={t("auth.lastName")}
          value={lastName}
          error={errors.last_name}
          onChange={(e) => onChange("last_name", e.target.value)}
        />
      </FormField>
      <FormField>
        <Input label={t("auth.email")} value={email} disabled />
      </FormField>
      <FormField>
        <Input
          label={t("auth.phoneNumber")}
          value={phoneNumber}
          error={errors.phone_number}
          onChange={(e) => onChange("phone_number", e.target.value)}
        />
      </FormField>
    </div>
  );
}
