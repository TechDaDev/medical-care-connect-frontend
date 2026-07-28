import { describe, expect, it } from "vitest";
import { buildNavigationItems } from "../components/layout/navigation";
import { UserRole } from "../types";

describe("patient Phase D navigation", () => {
  it("uses patient-specific profile, records, messages, notifications, and privacy routes", () => {
    const paths = buildNavigationItems(UserRole.PATIENT, (key) => key).map(
      (item) => item.path,
    );

    expect(paths).toContain("/app/patient/profile");
    expect(paths).toContain("/app/patient/medical-records");
    expect(paths).toContain("/app/patient/messages");
    expect(paths).toContain("/app/patient/notifications");
    expect(paths).toContain("/app/patient/privacy");
    expect(paths).not.toContain("/app/profile");
    expect(paths).not.toContain("/app/notifications");
  });
});
