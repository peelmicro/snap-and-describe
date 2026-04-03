import { db } from "../db/index.ts";
import { types } from "../db/schema.ts";

const SEED_TYPES = [
  { code: "objects", name: "Objects and Scenes" },
  { code: "food", name: "Food and Drinks" },
  { code: "buildings", name: "Buildings and Landmarks" },
  { code: "text", name: "Text in Images" },
  { code: "nature", name: "Nature and Wildlife" },
];

export async function seedTypes() {
  console.log("Seeding types...");

  for (const t of SEED_TYPES) {
    await db
      .insert(types)
      .values(t)
      .onConflictDoNothing({ target: types.code });
  }

  console.log(`  ✓ ${SEED_TYPES.length} types seeded`);
}
