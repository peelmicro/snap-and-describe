/**
 * Quick test script for the vision service.
 * Usage: node --experimental-transform-types src/vision/test-vision.ts <path-to-image>
 *
 * Requires ANTHROPIC_API_KEY in .env
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { analyzeImage } from "./vision-service.ts";

// Load .env from apps/api/
config({ path: resolve(import.meta.dirname, "../../../../.env") });

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: node --experimental-transform-types src/vision/test-vision.ts <image-path>");
  console.error("Example: node --experimental-transform-types src/vision/test-vision.ts /tmp/photo.jpg");
  process.exit(1);
}

const buffer = readFileSync(imagePath);
const ext = imagePath.toLowerCase().split(".").pop();
const mimeMap: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};
const mimeType = mimeMap[ext || ""] || "image/jpeg";

console.log(`Analyzing ${imagePath} (${mimeType})...\n`);

try {
  const result = await analyzeImage(buffer, mimeType);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Analysis failed:", err);
  process.exit(1);
}
