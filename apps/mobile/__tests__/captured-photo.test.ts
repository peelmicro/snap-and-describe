/**
 * Captured Photo Shared State Tests
 *
 * Tests the useCapturedPhoto module that passes photo data
 * from the camera screen to the home screen via in-memory state.
 */
import { describe, it, expect } from "vitest";
import { setCapturedPhoto, getCapturedPhoto } from "../hooks/useCapturedPhoto";

describe("Captured Photo Shared State", () => {
  it("should store and retrieve a photo", () => {
    setCapturedPhoto({ uri: "data:image/png;base64,abc", mimeType: "image/png" });

    const photo = getCapturedPhoto();
    expect(photo).not.toBeNull();
    expect(photo!.uri).toBe("data:image/png;base64,abc");
    expect(photo!.mimeType).toBe("image/png");
  });

  it("should consume photo on first get (returns null on second get)", () => {
    setCapturedPhoto({ uri: "test-uri", mimeType: "image/jpeg" });

    const first = getCapturedPhoto();
    expect(first).not.toBeNull();

    const second = getCapturedPhoto();
    expect(second).toBeNull();
  });

  it("should return null when no photo is set", () => {
    const photo = getCapturedPhoto();
    expect(photo).toBeNull();
  });

  it("should overwrite previous photo", () => {
    setCapturedPhoto({ uri: "first", mimeType: "image/jpeg" });
    setCapturedPhoto({ uri: "second", mimeType: "image/png" });

    const photo = getCapturedPhoto();
    expect(photo!.uri).toBe("second");
    expect(photo!.mimeType).toBe("image/png");
  });

  it("should handle setting null (clear)", () => {
    setCapturedPhoto({ uri: "test", mimeType: "image/jpeg" });
    setCapturedPhoto(null);

    const photo = getCapturedPhoto();
    expect(photo).toBeNull();
  });
});
