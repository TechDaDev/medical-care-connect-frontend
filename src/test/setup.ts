import "@testing-library/jest-dom/vitest";

// jsdom does not always provide crypto.randomUUID (used for idempotency keys).
if (typeof window !== "undefined" && window.crypto && !window.crypto.randomUUID) {
  Object.defineProperty(window.crypto, "randomUUID", {
    value: () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
  });
}

