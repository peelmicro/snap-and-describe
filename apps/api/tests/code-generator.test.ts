/**
 * Code Generator Tests
 *
 * Tests the generateCode utility that creates sequential codes
 * like IMG-2026-04-000001, CLF-2026-04-000003.
 */
import { describe, it, expect } from "vitest";
import { generateCode } from "../src/common/code-generator.ts";

describe("Code Generator", () => {
  it("should generate a code with correct prefix", () => {
    const code = generateCode("IMG", 1);
    expect(code).toMatch(/^IMG-/);
  });

  it("should include year and month", () => {
    const code = generateCode("IMG", 1);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    expect(code).toContain(`${year}-${month}`);
  });

  it("should pad sequence to 6 digits", () => {
    const code = generateCode("IMG", 1);
    expect(code).toMatch(/000001$/);

    const code2 = generateCode("IMG", 42);
    expect(code2).toMatch(/000042$/);

    const code3 = generateCode("IMG", 999999);
    expect(code3).toMatch(/999999$/);
  });

  it("should work with different prefixes", () => {
    const imgCode = generateCode("IMG", 1);
    const clfCode = generateCode("CLF", 1);

    expect(imgCode).toMatch(/^IMG-/);
    expect(clfCode).toMatch(/^CLF-/);
  });

  it("should generate correct full format", () => {
    const code = generateCode("IMG", 5);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    expect(code).toBe(`IMG-${year}-${month}-000005`);
  });
});
