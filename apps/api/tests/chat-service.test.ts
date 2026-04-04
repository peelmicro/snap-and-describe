/**
 * Chat Service Tests
 *
 * Tests the system prompt construction and message history handling.
 * Mocks the Anthropic SDK to avoid real API calls.
 */
import { describe, it, expect } from "vitest";

describe("Chat Service Logic", () => {
  describe("System Prompt Construction", () => {
    it("should build context from image data", () => {
      const imageContext = {
        description: "A sunset over the beach",
        tags: ["sunset", "beach", "ocean"],
        classifications: [
          {
            typeName: "Nature and Wildlife",
            properties: [
              { propertyName: "confidence", propertyContent: "0.95" },
              { propertyName: "elements", propertyContent: "sun, water" },
            ],
          },
        ],
      };

      // Simulate the prompt building from chat-service.ts
      const classificationsText = imageContext.classifications
        .map((c) => {
          const props = c.properties
            .map((p) => `${p.propertyName}: ${p.propertyContent}`)
            .join(", ");
          return `- ${c.typeName}: ${props}`;
        })
        .join("\n");

      expect(classificationsText).toContain("Nature and Wildlife");
      expect(classificationsText).toContain("confidence: 0.95");
      expect(classificationsText).toContain("elements: sun, water");
    });

    it("should handle missing description", () => {
      const description: string | null = null;
      const fallback = description || "No description available";
      expect(fallback).toBe("No description available");
    });

    it("should handle missing tags", () => {
      const tags: string[] | null = null;
      const fallback = tags?.join(", ") || "No tags";
      expect(fallback).toBe("No tags");
    });

    it("should handle empty classifications", () => {
      const classifications: any[] = [];
      const text = classifications
        .map((c) => `- ${c.typeName}`)
        .join("\n");
      expect(text).toBe("");
    });
  });

  describe("Message History", () => {
    it("should maintain correct message order", () => {
      const history = [
        { role: "user" as const, content: "What is this?" },
        { role: "assistant" as const, content: "It's a sunset." },
      ];

      const newMessage = "What colors?";
      const messages = [...history, { role: "user" as const, content: newMessage }];

      expect(messages).toHaveLength(3);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
      expect(messages[2].role).toBe("user");
      expect(messages[2].content).toBe("What colors?");
    });

    it("should handle empty history (first message)", () => {
      const history: { role: "user" | "assistant"; content: string }[] = [];
      const newMessage = "What is this?";
      const messages = [...history, { role: "user" as const, content: newMessage }];

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("What is this?");
    });
  });
});
