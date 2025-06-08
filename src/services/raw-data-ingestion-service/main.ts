// Auto-Trade: Raw Data Ingestion Service
// Main entry point for fetching DEX swap data
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import config from "./config.ts"; // Load service configuration
import {
  fetchLatestBlock,
  fetchSwapsFromTimestamp,
} from "./fetchers/aerodromeFetcher.ts";
import type { Swap } from "./queries/aerodromeQueries.ts";

console.log("🚀 Auto-Trade Raw Data Ingestion Service starting...");
console.log("📊 Loaded config:", config); // Log the loaded config to verify

const main = async () => {
  try {
    console.log("🔗 Initializing connections...");
    // TODO: Initialize Redis and PostgreSQL connections using:
    // - config.redisUrl
    // - config.postgresUrl

    console.log("📡 Starting continuous data ingestion from Aerodrome...");

    // Get the latest block to understand current state
    const latestBlock = await fetchLatestBlock();
    console.log(
      `📊 Latest block: ${latestBlock.blockNumber} (${new Date(latestBlock.timestamp * 1000).toISOString()})`
    );

    // TODO: Get last processed timestamp from PostgreSQL checkpoint
    // For now, start from 1 hour ago
    let lastProcessedTimestamp = Math.floor(Date.now() / 1000) - 60 * 60;
    console.log(
      `🔄 Starting ingestion from: ${new Date(lastProcessedTimestamp * 1000).toISOString()}`
    );

    // Main ingestion loop
    while (true) {
      try {
        // Fetch new swaps since last processed timestamp
        const newSwaps = await fetchSwapsFromTimestamp(
          lastProcessedTimestamp,
          config.batchSize
        );

        if (newSwaps.length > 0) {
          console.log(`📈 Processing ${newSwaps.length} new swaps...`);

          // TODO: Process swaps in production:
          // 1. Buffer in Redis for downstream processing
          // 2. Store in PostgreSQL raw_trades table
          // 3. Update checkpoint timestamp
          // 4. Publish event to Data Aggregation Service

          // For now, just log the activity
          const latestSwap = newSwaps[newSwaps.length - 1];
          lastProcessedTimestamp = Math.floor(
            latestSwap.tradeTimestamp.getTime() / 1000
          );

          console.log(
            `✅ Processed ${newSwaps.length} swaps. Latest: ${latestSwap.tradeTimestamp.toISOString()}`
          );

          // Show sample for monitoring
          const sample = newSwaps[0];
          const sourceSwap = sample.sourceData as Swap;
          if (sourceSwap?.pool) {
            console.log(
              `   Sample: ${sample.amountIn} ${sourceSwap.pool.token0.symbol} → ${sample.amountOut} ${sourceSwap.pool.token1.symbol}`
            );
          }
        } else {
          console.log("📊 No new swaps found, waiting...");
        }

        // Wait for polling interval before next fetch
        console.log(
          `⏱️  Waiting ${config.pollingIntervalMs / 1000}s for next poll...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, config.pollingIntervalMs)
        );
      } catch (error) {
        console.error("❌ Error in ingestion loop:", error);
        console.log("🔄 Retrying in 30 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }
  } catch (error) {
    console.error("❌ Fatal error in Raw Data Ingestion Service:", error);
    throw error;
  }
};

// Start the service
main().catch((err) => {
  console.error("💥 Fatal error in Raw Data Ingestion Service:", err);
  process.exit(1);
});
