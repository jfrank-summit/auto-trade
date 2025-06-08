// Auto-Trade: Raw Data Ingestion Service
// Main entry point for fetching DEX swap data
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import config from "./config"; // Load service configuration
import {
  fetchLatestBlock,
  fetchSwapsFromTimestamp,
} from "./fetchers/aerodromeFetcher";
import type { Swap } from "./queries/aerodromeQueries";

console.log("🚀 Auto-Trade Raw Data Ingestion Service starting...");
console.log("📊 Loaded config:", config); // Log the loaded config to verify

const main = async () => {
  try {
    console.log("🔗 Initializing connections...");
    // TODO: Initialize Redis and PostgreSQL connections using:
    // - config.redisUrl
    // - config.postgresUrl

    console.log("📡 Starting data fetching from Aerodrome...");

    // Get the latest block to understand current state
    const latestBlock = await fetchLatestBlock();
    console.log(
      `📊 Latest block: ${latestBlock.blockNumber} (${new Date(latestBlock.timestamp * 1000).toISOString()})`
    );

    // Fetch recent swaps (last 24 hours)
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    console.log(
      `📈 Fetching swaps from last 24 hours (${new Date(oneDayAgo * 1000).toISOString()})...`
    );

    const recentSwaps = await fetchSwapsFromTimestamp(oneDayAgo, 100);
    console.log(`✅ Fetched ${recentSwaps.length} recent swaps`);

    if (recentSwaps.length > 0) {
      console.log("📝 Sample swap data:");
      const sample = recentSwaps[0];
      console.log(`   ${sample.dexId}: ${sample.tradeTimestamp.toISOString()}`);
      console.log(`   TX: ${sample.transactionHash}`);
      console.log(`   Trade: ${sample.amountIn} → ${sample.amountOut}`);
      console.log(`   Price: ${sample.price}`);
    } else {
      console.log("⚠️  No recent swaps found, trying historical data...");

      // Fallback to historical data for demonstration
      const historicalTimestamp = 1729153055; // October 2024
      const historicalSwaps = await fetchSwapsFromTimestamp(
        historicalTimestamp,
        10
      );
      console.log(
        `📚 Fetched ${historicalSwaps.length} historical swaps for demonstration`
      );

      if (historicalSwaps.length > 0) {
        const sample = historicalSwaps[0];
        console.log("📝 Historical sample:");
        console.log(
          `   ${sample.dexId}: ${sample.tradeTimestamp.toISOString()}`
        );
        console.log(`   TX: ${sample.transactionHash}`);
        const sourceSwap = sample.sourceData as Swap;
        if (sourceSwap?.pool) {
          console.log(
            `   Tokens: ${sourceSwap.pool.token0.symbol}/${sourceSwap.pool.token1.symbol}`
          );
          console.log(
            `   Amount: ${sample.amountIn} ${sourceSwap.pool.token0.symbol} → ${sample.amountOut} ${sourceSwap.pool.token1.symbol}`
          );
        }
      }
    }

    // TODO: Process trades for Redis buffering and PostgreSQL storage
    console.log("\n🔄 Next steps:");
    console.log("   - Buffer trades in Redis for processing");
    console.log("   - Store raw trades in PostgreSQL raw_trades table");
    console.log("   - Signal Data Aggregation Service for bar generation");

    console.log("\n✅ Raw Data Ingestion Service completed successfully");
  } catch (error) {
    console.error("❌ Error in Raw Data Ingestion Service:", error);
    throw error;
  }
};

// Start the service
main().catch((err) => {
  console.error("💥 Fatal error in Raw Data Ingestion Service:", err);
  process.exit(1);
});
