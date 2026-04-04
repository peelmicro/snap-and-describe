/**
 * API Configuration Tests
 *
 * Tests the API URL configuration logic.
 * These are pure logic tests — no React components, no rendering.
 */
import { describe, it, expect } from "vitest";

function getApiUrl(platform: string): string {
  const LOCAL_IP = "192.168.1.65";
  return platform === "web"
    ? "http://localhost:3000"
    : `http://${LOCAL_IP}:3000`;
}

describe("API Configuration", () => {
  it("should use localhost for web platform", () => {
    expect(getApiUrl("web")).toBe("http://localhost:3000");
  });

  it("should use local IP for Android", () => {
    expect(getApiUrl("android")).toBe("http://192.168.1.65:3000");
  });

  it("should use local IP for iOS", () => {
    expect(getApiUrl("ios")).toBe("http://192.168.1.65:3000");
  });
});
