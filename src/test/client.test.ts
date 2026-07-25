import { describe, it, expect, beforeEach } from "vitest";
import { readCookie } from "../api/client";

describe("readCookie", () => {
  // jsdom's document.cookie is stateful across tests within a file,
  // so we clear it by expiring every cookie.
  beforeEach(() => {
    document.cookie.split(";").forEach((c) => {
      const eq = c.indexOf("=");
      const name = eq > -1 ? c.slice(0, eq).trim() : c.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  });

  it("returns null when no cookies exist", () => {
    expect(readCookie("anything")).toBeNull();
  });

  it("returns null when the cookie does not exist", () => {
    document.cookie = "some_other=value";
    expect(readCookie("mcc_csrftoken")).toBeNull();
  });

  it("finds the cookie in a single-cookie document", () => {
    document.cookie = "mcc_csrftoken=abc123";
    expect(readCookie("mcc_csrftoken")).toBe("abc123");
  });

  it("finds the cookie among multiple cookies", () => {
    document.cookie = "sessionid=xyz";
    document.cookie = "mcc_csrftoken=def456";
    document.cookie = "theme=dark";
    expect(readCookie("mcc_csrftoken")).toBe("def456");
  });

  it("decodes URI-encoded values", () => {
    const raw = "token with spaces+and symbols";
    const encoded = encodeURIComponent(raw);
    document.cookie = `mcc_csrftoken=${encoded}`;
    expect(readCookie("mcc_csrftoken")).toBe(raw);
  });

  it("handles bare unencoded value", () => {
    document.cookie = "mcc_csrftoken=a1b2";
    expect(readCookie("mcc_csrftoken")).toBe("a1b2");
  });

  it("returns empty string for empty cookie value", () => {
    document.cookie = "mcc_csrftoken=";
    expect(readCookie("mcc_csrftoken")).toBe("");
  });
});
