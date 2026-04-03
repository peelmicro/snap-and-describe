import { seedTypes } from "./seed-types.ts";
import { seedImages } from "./seed-images.ts";
import { seedClassifications } from "./seed-classifications.ts";

async function main() {
  console.log("Starting seed...\n");

  await seedTypes();
  await seedImages();
  await seedClassifications();

  console.log("\nSeed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
