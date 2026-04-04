/**
 * TypeScript Interface Tests
 *
 * Validates that our TypeScript interfaces match the expected API response shapes.
 * These aren't runtime tests per se — they verify that sample data conforms
 * to our type definitions, catching mismatches between frontend types and API responses.
 */
import { describe, it, expect } from "vitest";
import type {
  ImageItem,
  ImageDetail,
  Classification,
  ChatResponse,
  SearchResponse,
} from "../types";

describe("TypeScript Interfaces", () => {
  it("should accept a valid ImageItem", () => {
    const item: ImageItem = {
      id: "abc-123",
      code: "IMG-2026-04-000001",
      name: "sunset.jpg",
      suggestedName: "Tropical Sunset",
      tags: ["sunset", "beach"],
      description: "A beautiful sunset",
      storagePath: "images/IMG-2026-04-000001.jpg",
      imageMetadata: {
        width: 800,
        height: 600,
        format: "jpeg",
        size: 245000,
      },
      createdAt: "2026-04-03T10:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z",
    };

    expect(item.id).toBe("abc-123");
    expect(item.tags).toHaveLength(2);
    expect(item.imageMetadata?.width).toBe(800);
  });

  it("should accept nullable fields", () => {
    const item: ImageItem = {
      id: "abc-123",
      code: "IMG-2026-04-000001",
      name: "photo.jpg",
      suggestedName: null,
      tags: null,
      description: null,
      storagePath: null,
      imageMetadata: null,
      createdAt: "2026-04-03T10:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z",
    };

    expect(item.suggestedName).toBeNull();
    expect(item.tags).toBeNull();
    expect(item.description).toBeNull();
  });

  it("should accept a valid Classification", () => {
    const clf: Classification = {
      id: "clf-123",
      code: "CLF-2026-04-000001",
      typeId: "type-1",
      typeCode: "nature",
      typeName: "Nature and Wildlife",
      properties: [
        { propertyName: "confidence", propertyContent: "0.95" },
        { propertyName: "elements", propertyContent: "sun, water" },
      ],
      createdAt: "2026-04-03T10:00:00Z",
    };

    expect(clf.typeCode).toBe("nature");
    expect(clf.properties).toHaveLength(2);
  });

  it("should accept a valid ChatResponse", () => {
    const response: ChatResponse = {
      conversationId: "conv-123",
      response: "This is a sunset over the ocean.",
    };

    expect(response.conversationId).toBe("conv-123");
    expect(response.response).toContain("sunset");
  });

  it("should accept a valid SearchResponse", () => {
    const response: SearchResponse = {
      query: "sunset",
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    };

    expect(response.query).toBe("sunset");
    expect(response.items).toHaveLength(0);
    expect(response.total).toBe(0);
  });
});
