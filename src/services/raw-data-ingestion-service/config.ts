// src/services/raw-data-ingestion-service/config.ts
import type { ServiceConfig } from "./types"; // Assuming types.ts is in the same directory

// Helper function to get environment variables or throw an error if not set
const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new Error(
      `Environment variable ${name} is not set and no default value provided.`
    );
  }
  return value;
};

const config: ServiceConfig = {
  redisUrl: getEnvVar("REDIS_URL", "redis://localhost:6379"),
  postgresUrl: getEnvVar(
    "POSTGRES_URL",
    "postgresql://user:password@localhost:5432/autotrade_dev"
  ),
  targetDexSubgraphUrl: getEnvVar("TARGET_DEX_SUBGRAPH_URL"), // No default, must be set
  // Add other config variables here as needed
  // e.g., polling interval, batch sizes
  // pollingIntervalMs: parseInt(getEnvVar("POLLING_INTERVAL_MS", "60000"), 10), // Default to 1 minute
};

export default config;
