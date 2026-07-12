import { useState } from "react";
import { useAuth } from "../../auth";
import { accountsApi } from "../../api/auth";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { PageHeader } from "../../components/common/PageHeader";

export function ProfilePage() {
  const { user, updateCurrentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone_number || "",
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateCurrentUser(form);
      setSuccess(t("profile.saved"));
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("profile.title")} />

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("auth.firstName")}
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
            />
            <Input
              label={t("auth.lastName")}
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
            />
          </div>
          <Input label={t("auth.email")} value={user.email} disabled />
          <Input
            label={t("auth.phone")}
            value={form.phone_number}
            onChange={(e) =>
              setForm({ ...form, phone_number: e.target.value })
            }
          />

          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleSave} loading={saving}>
            {t("profile.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
