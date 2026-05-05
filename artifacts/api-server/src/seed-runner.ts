import { ensureSeed } from "./lib/seed.js";
import { logger } from "./lib/logger.js";

async function main() {
  try {
    logger.info("Starting database seeding...");
    await ensureSeed();
    logger.info("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Seeding failed");
    process.exit(1);
  }
}

main();
