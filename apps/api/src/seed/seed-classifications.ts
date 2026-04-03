import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { types, images, imageClassifications } from "../db/schema.ts";
import { generateCode } from "../common/code-generator.ts";

// Maps image name → array of { typeCode, properties }
const CLASSIFICATION_MAP: Record<
  string,
  { typeCode: string; properties: { propertyName: string; propertyContent: string }[] }[]
> = {
  "sunset-beach.jpg": [
    {
      typeCode: "nature",
      properties: [
        { propertyName: "confidence", propertyContent: "0.97" },
        { propertyName: "detectedElements", propertyContent: "sunset, ocean, palm trees, sand" },
        { propertyName: "dominantColors", propertyContent: "orange, purple, gold" },
      ],
    },
    {
      typeCode: "objects",
      properties: [
        { propertyName: "confidence", propertyContent: "0.82" },
        { propertyName: "detectedObjects", propertyContent: "palm tree, seagull, waves" },
        { propertyName: "sceneType", propertyContent: "outdoor, beach" },
      ],
    },
  ],
  "coffee-latte.jpg": [
    {
      typeCode: "food",
      properties: [
        { propertyName: "confidence", propertyContent: "0.95" },
        { propertyName: "ingredients", propertyContent: "espresso, steamed milk, foam" },
        { propertyName: "cuisine", propertyContent: "cafe, breakfast" },
      ],
    },
    {
      typeCode: "objects",
      properties: [
        { propertyName: "confidence", propertyContent: "0.78" },
        { propertyName: "detectedObjects", propertyContent: "ceramic cup, plate, croissant, wooden table" },
        { propertyName: "sceneType", propertyContent: "indoor, cafe" },
      ],
    },
  ],
  "cathedral-facade.jpg": [
    {
      typeCode: "buildings",
      properties: [
        { propertyName: "confidence", propertyContent: "0.98" },
        { propertyName: "architecturalStyle", propertyContent: "Gothic" },
        { propertyName: "features", propertyContent: "pointed arches, spires, stone carvings, rose window" },
      ],
    },
    {
      typeCode: "objects",
      properties: [
        { propertyName: "confidence", propertyContent: "0.70" },
        { propertyName: "detectedObjects", propertyContent: "stone statues, iron gates, plaza" },
        { propertyName: "sceneType", propertyContent: "outdoor, urban" },
      ],
    },
  ],
  "mountain-lake.jpg": [
    {
      typeCode: "nature",
      properties: [
        { propertyName: "confidence", propertyContent: "0.99" },
        { propertyName: "detectedElements", propertyContent: "mountains, lake, evergreen forest, wildflowers" },
        { propertyName: "dominantColors", propertyContent: "blue, green, white" },
      ],
    },
    {
      typeCode: "objects",
      properties: [
        { propertyName: "confidence", propertyContent: "0.65" },
        { propertyName: "detectedObjects", propertyContent: "rocks, clouds, tree line" },
        { propertyName: "sceneType", propertyContent: "outdoor, alpine" },
      ],
    },
  ],
  "street-sign.jpg": [
    {
      typeCode: "text",
      properties: [
        { propertyName: "confidence", propertyContent: "0.93" },
        { propertyName: "detectedText", propertyContent: "Broadway, 5th Ave, Central Park" },
        { propertyName: "textType", propertyContent: "street sign, directional" },
      ],
    },
    {
      typeCode: "objects",
      properties: [
        { propertyName: "confidence", propertyContent: "0.85" },
        { propertyName: "detectedObjects", propertyContent: "metal signs, brick wall, pole" },
        { propertyName: "sceneType", propertyContent: "outdoor, urban" },
      ],
    },
  ],
};

export async function seedClassifications() {
  console.log("Seeding classifications...");

  // Load all types and images for lookup
  const allTypes = await db.select().from(types);
  const allImages = await db.select().from(images);

  const typeByCode = new Map(allTypes.map((t) => [t.code, t]));
  const imageByName = new Map(allImages.map((img) => [img.name, img]));

  let seq = 0;
  for (const [imageName, classifications] of Object.entries(CLASSIFICATION_MAP)) {
    const image = imageByName.get(imageName);
    if (!image) continue;

    for (const clf of classifications) {
      const type = typeByCode.get(clf.typeCode);
      if (!type) continue;

      seq++;
      const code = generateCode("CLF", seq);

      await db
        .insert(imageClassifications)
        .values({
          code,
          typeId: type.id,
          imageId: image.id,
          properties: clf.properties,
        })
        .onConflictDoNothing({ target: imageClassifications.code });
    }
  }

  console.log(`  ✓ ${seq} classifications seeded`);
}
