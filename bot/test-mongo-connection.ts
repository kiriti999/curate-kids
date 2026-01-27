/**
 * Quick test to verify MongoDB connection
 */

import { validateConnection } from "./src/services/payload.ts";
import * as logger from "./src/utils/logger.ts";

logger.info("Testing MongoDB connection...");

const isConnected = await validateConnection();

if (isConnected) {
  logger.info("✅ MongoDB connection test PASSED");
  Deno.exit(0);
} else {
  logger.error("❌ MongoDB connection test FAILED");
  Deno.exit(1);
}
