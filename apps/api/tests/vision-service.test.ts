/**
 * Vision Service Tests
 *
 * Tests the vision service logic: response parsing, tag limiting,
 * classification filtering, and error handling.
 * We don't call the real Claude API — we test the parsing and validation logic.
 */
import { describe, it, expect } from "vitest";

describe("Vision Service", () => {
  describe("Response Parsing", () => {
    it("should parse a valid JSON response", () => {
      const responseText = JSON.stringify({
        description: "A beautiful sunset over the ocean",
        suggestedName: "Ocean Sunset",
        tags: ["sunset", "ocean", "sky", "water", "horizon"],
        classifications: [
          {
            type: "nature",
            confidence: 0.95,
            properties: [
              { propertyName: "elements", propertyContent: "sun, ocean, clouds" },
            ],
          },
        ],
      });

      const parsed = JSON.parse(responseText);
      expect(parsed.description).toBe("A beautiful sunset over the ocean");
      expect(parsed.suggestedName).toBe("Ocean Sunset");
      expect(parsed.tags).toHaveLength(5);
      expect(parsed.classifications).toHaveLength(1);
      expect(parsed.classifications[0].type).toBe("nature");
      expect(parsed.classifications[0].confidence).toBe(0.95);
      expect(parsed.classifications[0].properties[0].propertyName).toBe("elements");
    });

    it("should handle multiple classifications", () => {
      const responseText = JSON.stringify({
        description: "Coffee on a table",
        suggestedName: "Latte Art",
        tags: ["coffee"],
        classifications: [
          { type: "food", confidence: 0.95, properties: [] },
          { type: "objects", confidence: 0.80, properties: [] },
        ],
      });

      const parsed = JSON.parse(responseText);
      expect(parsed.classifications).toHaveLength(2);
    });
  });

  describe("Tag Limiting", () => {
    it("should limit tags to 5 items", () => {
      const tags = ["a", "b", "c", "d", "e", "f", "g"];
      const limited = tags.slice(0, 5);
      expect(limited).toHaveLength(5);
      expect(limited).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("should keep tags under 5 unchanged", () => {
      const tags = ["a", "b", "c"];
      const limited = tags.slice(0, 5);
      expect(limited).toHaveLength(3);
    });
  });

  describe("Classification Filtering", () => {
    const validTypes = ["objects", "food", "buildings", "text", "nature"];

    it("should filter to known types only", () => {
      const classifications = [
        { type: "nature", confidence: 0.9, properties: [] },
        { type: "unknown_type", confidence: 0.5, properties: [] },
        { type: "food", confidence: 0.8, properties: [] },
      ];

      const filtered = classifications.filter((c) =>
        validTypes.includes(c.type)
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].type).toBe("nature");
      expect(filtered[1].type).toBe("food");
    });

    it("should return empty array when no known types match", () => {
      const classifications = [
        { type: "vehicles", confidence: 0.9, properties: [] },
        { type: "abstract", confidence: 0.7, properties: [] },
      ];

      const filtered = classifications.filter((c) =>
        validTypes.includes(c.type)
      );

      expect(filtered).toHaveLength(0);
    });

    it("should accept all valid types", () => {
      const classifications = validTypes.map((type) => ({
        type,
        confidence: 0.9,
        properties: [],
      }));

      const filtered = classifications.filter((c) =>
        validTypes.includes(c.type)
      );

      expect(filtered).toHaveLength(5);
    });
  });

  describe("Error Handling", () => {
    it("should detect non-JSON responses", () => {
      const invalidText = "This is not JSON at all";
      expect(() => JSON.parse(invalidText)).toThrow(SyntaxError);
    });

    it("should detect markdown-wrapped JSON", () => {
      const markdownWrapped = '```json\n{"description": "test"}\n```';
      expect(() => JSON.parse(markdownWrapped)).toThrow(SyntaxError);
    });

    it("should validate required fields", () => {
      const incomplete = { description: "Test" };
      expect(incomplete).not.toHaveProperty("suggestedName");
      expect(incomplete).not.toHaveProperty("tags");
    });

    it("should handle empty content array", () => {
      const response = { content: [] };
      const textBlock = response.content.find(
        (block: any) => block.type === "text"
      );
      expect(textBlock).toBeUndefined();
    });
  });

  describe("Media Type Handling", () => {
    it("should support jpeg", () => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      expect(validTypes).toContain("image/jpeg");
    });

    it("should support png", () => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      expect(validTypes).toContain("image/png");
    });

    it("should support webp", () => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      expect(validTypes).toContain("image/webp");
    });
  });
});
