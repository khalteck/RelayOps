import { disconnectDatabase } from "../core/database.js";
import { logger } from "../core/logger.js";
import { seedDemo } from "./seed/index.js";

seedDemo()
  .then(disconnectDatabase)
  .catch((error: unknown) => {
    logger.error({ err: error }, "Demo seed failed");
    process.exitCode = 1;
  });
