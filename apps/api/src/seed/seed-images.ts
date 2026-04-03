import sharp from "sharp";
import { db } from "../db/index.ts";
import { images } from "../db/schema.ts";
import { generateCode } from "../common/code-generator.ts";
import { uploadBuffer } from "../storage/minio-client.ts";

const SEED_IMAGES = [
  {
    name: "sunset-beach.jpg",
    suggestedName: "Tropical Sunset at the Beach",
    tags: ["sunset", "beach", "palm trees", "ocean", "tropical"],
    description:
      "A breathtaking tropical sunset over a sandy beach with palm trees silhouetted against an orange and purple sky. Gentle waves lap at the shore while seagulls fly in the distance.",
    color: { r: 255, g: 140, b: 50 },
    metadata: {
      width: 800,
      height: 600,
      format: "jpeg",
      size: 245000,
      takenAt: "2026-03-15T18:45:00Z",
      longitude: -80.128,
      latitude: 25.7617,
    },
  },
  {
    name: "coffee-latte.jpg",
    suggestedName: "Artisan Coffee Latte Art",
    tags: ["coffee", "latte", "cafe", "breakfast", "art"],
    description:
      "A beautifully crafted latte with intricate leaf-pattern foam art, served in a ceramic cup on a rustic wooden table. A croissant sits on a plate beside it.",
    color: { r: 139, g: 90, b: 43 },
    metadata: {
      width: 800,
      height: 600,
      format: "jpeg",
      size: 189000,
      takenAt: "2026-03-20T09:15:00Z",
      longitude: -3.7038,
      latitude: 40.4168,
    },
  },
  {
    name: "cathedral-facade.jpg",
    suggestedName: "Gothic Cathedral Facade",
    tags: ["cathedral", "gothic", "architecture", "landmark", "stone"],
    description:
      "The ornate facade of a Gothic cathedral featuring pointed arches, detailed stone carvings, and towering spires reaching into a clear blue sky. Visitors gather at the entrance plaza.",
    color: { r: 180, g: 180, b: 200 },
    metadata: {
      width: 600,
      height: 800,
      format: "jpeg",
      size: 312000,
      takenAt: "2026-02-10T14:30:00Z",
      longitude: 2.3522,
      latitude: 48.8566,
    },
  },
  {
    name: "mountain-lake.jpg",
    suggestedName: "Alpine Mountain Lake Reflection",
    tags: ["mountain", "lake", "reflection", "alpine", "nature"],
    description:
      "A crystal-clear alpine lake perfectly mirrors snow-capped mountains and evergreen forests. Wildflowers dot the grassy shoreline under a bright blue sky with scattered clouds.",
    color: { r: 50, g: 130, b: 200 },
    metadata: {
      width: 800,
      height: 600,
      format: "jpeg",
      size: 278000,
      takenAt: "2026-01-25T11:00:00Z",
      longitude: 10.4515,
      latitude: 47.3769,
    },
  },
  {
    name: "street-sign.jpg",
    suggestedName: "Vintage Street Sign Collection",
    tags: ["sign", "street", "text", "vintage", "urban"],
    description:
      "A collection of vintage street signs at an intersection, showing directions to various neighborhoods. The weathered metal signs display hand-painted lettering against a brick wall backdrop.",
    color: { r: 60, g: 120, b: 60 },
    metadata: {
      width: 800,
      height: 600,
      format: "jpeg",
      size: 156000,
      takenAt: "2026-03-28T16:20:00Z",
      longitude: -73.9857,
      latitude: 40.7484,
    },
  },
];

async function generateImage(
  color: { r: number; g: number; b: number },
  width: number,
  height: number
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function seedImages() {
  console.log("Seeding images...");

  for (let i = 0; i < SEED_IMAGES.length; i++) {
    const seed = SEED_IMAGES[i];
    const code = generateCode("IMG", i + 1);

    // Generate and upload image to MinIO
    const buffer = await generateImage(
      seed.color,
      seed.metadata.width,
      seed.metadata.height
    );
    const storageKey = `${code}.jpg`;
    const storagePath = await uploadBuffer(storageKey, buffer, "image/jpeg");

    await db
      .insert(images)
      .values({
        code,
        name: seed.name,
        suggestedName: seed.suggestedName,
        tags: seed.tags,
        description: seed.description,
        storagePath,
        imageMetadata: { ...seed.metadata, size: buffer.length },
      })
      .onConflictDoNothing({ target: images.code });
  }

  console.log(`  ✓ ${SEED_IMAGES.length} images seeded and uploaded to MinIO`);
}
