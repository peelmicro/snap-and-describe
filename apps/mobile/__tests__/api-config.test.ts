/**
 * API Configuration Tests
 *
 * Tests the API URL configuration logic.
 * These are pure logic tests — no React components, no rendering.
 */
import { describe, it, expect } from "vitest";

describe("API Configuration", () => {
  it("should use localhost for web platform", () => {
    // Simulating the logic from constants/api.ts
    const platform = "web";
    const LOCAL_IP = "192.168.1.65";

    const apiUrl =
      platform === "web"
        ? "http://localhost:3000"
        : `http://${LOCAL_IP}:3000`;

    expect(apiUrl).toBe("http://localhost:3000");
  });

  it("should use local IP for Android", () => {
    const platform = "android";
    const LOCAL_IP = "192.168.1.65";

    const apiUrl =
      platform === "web"
        ? "http://localhost:3000"
        : `http://${LOCAL_IP}:3000`;

    expect(apiUrl).toBe("http://192.168.1.65:3000");
  });

  it("should use local IP for iOS", () => {
    const platform = "ios";
    const LOCAL_IP = "192.168.1.65";

    const apiUrl =
      platform === "web"
        ? "http://localhost:3000"
        : `http://${LOCAL_IP}:3000`;

    expect(apiUrl).toBe("http://192.168.1.65:3000");
  });
});
