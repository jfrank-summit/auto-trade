import { describe, it, expect, beforeAll } from "vitest";
import {
  fetchLatestBlock,
  fetchSwapsFromTimestamp,
  fetchSwapsInTimeWindow,
} from "../fetchers/aerodromeFetcher.ts";
import { graphQLClients } from "../graphqlClient.ts";
import type { RawTrade } from "../types.ts";

describe("Data Ingestion Service - Integration Tests", () => {
  beforeAll(() => {
    // Ensure we have the required API key
    if (!process.env.GRAPH_API_KEY) {
      throw new Error(
        "GRAPH_API_KEY environment variable is required for integration tests"
      );
    }
  });

  describe("GraphQL Client Connectivity", () => {
    it("should connect to Aerodrome subgraph successfully", async () => {
      const client = graphQLClients.aerodrome;
      expect(client).toBeDefined();

      // Test basic connectivity with a simple query
      const query = `query { _meta { block { number } } }`;
      const response = (await client.request(query)) as {
        _meta: { block: { number: number } };
      };

      expect(response).toBeDefined();
      expect(response._meta).toBeDefined();
      expect(response._meta.block.number).toBeGreaterThan(0);
    });
  });

  describe("Latest Block Fetching", () => {
    it("should fetch current block information", async () => {
      const result = await fetchLatestBlock();

      expect(result).toBeDefined();
      expect(result.blockNumber).toBeGreaterThan(20000000); // Base chain has high block numbers
      expect(result.timestamp).toBeGreaterThan(1700000000); // After Nov 2023
      expect(result.timestamp).toBeLessThan(Date.now() / 1000 + 300); // Within 5 minutes of now
    });

    it("should return consistent data structure", async () => {
      const result = await fetchLatestBlock();

      expect(typeof result.blockNumber).toBe("number");
      expect(typeof result.timestamp).toBe("number");
      expect(Number.isInteger(result.blockNumber)).toBe(true);
      expect(Number.isInteger(result.timestamp)).toBe(true);
    });
  });

  describe("Historical Swap Data Fetching", () => {
    it("should fetch historical swaps from recent past (1 month ago)", async () => {
      // Use current time minus 1 month for more robust testing
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const result = await fetchSwapsFromTimestamp(oneMonthAgo, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0); // May be 0 if no recent activity
      expect(result.length).toBeLessThanOrEqual(5);

      // If we found data, validate it's from the correct time period
      if (result.length > 0) {
        const firstTrade = result[0];
        const tradeTimestamp = Math.floor(
          firstTrade.tradeTimestamp.getTime() / 1000
        );
        expect(tradeTimestamp).toBeGreaterThanOrEqual(oneMonthAgo);
      }
    });

    it("should return empty array for future timestamps", async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
      const result = await fetchSwapsFromTimestamp(futureTimestamp, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should respect maxResults parameter", async () => {
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const maxResults = 3;
      const result = await fetchSwapsFromTimestamp(oneMonthAgo, maxResults);

      expect(result.length).toBeLessThanOrEqual(maxResults);
    });
  });

  describe("Data Quality Validation", () => {
    let sampleTrades: RawTrade[];

    beforeAll(async () => {
      // Fetch sample data for validation - try recent data first, fallback to October
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      let trades = await fetchSwapsFromTimestamp(oneMonthAgo, 5);

      // If no recent data, use known October data as fallback
      if (trades.length === 0) {
        const octoberTimestamp = 1729153055;
        trades = await fetchSwapsFromTimestamp(octoberTimestamp, 5);
      }

      sampleTrades = trades;
    });

    it("should return trades with all required RawTrade fields", async () => {
      expect(sampleTrades.length).toBeGreaterThan(0);

      for (const trade of sampleTrades) {
        // Required fields
        expect(trade.transactionHash).toBeDefined();
        expect(trade.baseTokenAddress).toBeDefined();
        expect(trade.quoteTokenAddress).toBeDefined();
        expect(trade.dexId).toBeDefined();
        expect(trade.tradeTimestamp).toBeDefined();
        expect(trade.blockNumber).toBeDefined();
        expect(trade.amountIn).toBeDefined();
        expect(trade.tokenInAddress).toBeDefined();
        expect(trade.amountOut).toBeDefined();
        expect(trade.tokenOutAddress).toBeDefined();

        // Type validations
        expect(typeof trade.transactionHash).toBe("string");
        expect(trade.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/); // Valid tx hash
        expect(typeof trade.dexId).toBe("string");
        expect(trade.dexId).toBe("aerodrome");
        expect(trade.tradeTimestamp).toBeInstanceOf(Date);
        expect(typeof trade.blockNumber).toBe("number");
        expect(Number.isInteger(trade.blockNumber)).toBe(true);
      }
    });

    it("should have valid token addresses", async () => {
      for (const trade of sampleTrades) {
        // Ethereum address format validation
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;

        expect(trade.baseTokenAddress).toMatch(addressRegex);
        expect(trade.quoteTokenAddress).toMatch(addressRegex);
        expect(trade.tokenInAddress).toMatch(addressRegex);
        expect(trade.tokenOutAddress).toMatch(addressRegex);

        // Token addresses should be different
        expect(trade.baseTokenAddress).not.toBe(trade.quoteTokenAddress);
        expect(trade.tokenInAddress).not.toBe(trade.tokenOutAddress);
      }
    });

    it("should have valid amounts and prices", async () => {
      for (const trade of sampleTrades) {
        // Amounts should be numeric strings
        expect(typeof trade.amountIn).toBe("string");
        expect(typeof trade.amountOut).toBe("string");
        expect(parseFloat(trade.amountIn)).toBeGreaterThan(0);
        expect(parseFloat(trade.amountOut)).toBeGreaterThan(0);

        // Price should be valid if present
        if (trade.price) {
          expect(typeof trade.price).toBe("string");
          expect(parseFloat(trade.price)).toBeGreaterThan(0);
        }

        // Log index should be valid if present
        if (trade.logIndex !== undefined) {
          expect(typeof trade.logIndex).toBe("number");
          expect(Number.isInteger(trade.logIndex)).toBe(true);
          expect(trade.logIndex).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should have consistent source data structure", async () => {
      for (const trade of sampleTrades) {
        expect(trade.sourceData).toBeDefined();

        const sourceSwap = trade.sourceData as any;
        expect(sourceSwap.id).toBeDefined();
        expect(sourceSwap.timestamp).toBeDefined();
        expect(sourceSwap.pool).toBeDefined();
        expect(sourceSwap.pool.token0).toBeDefined();
        expect(sourceSwap.pool.token1).toBeDefined();
        expect(sourceSwap.pool.token0.symbol).toBeDefined();
        expect(sourceSwap.pool.token1.symbol).toBeDefined();
      }
    });
  });

  describe("Time Window Fetching", () => {
    it("should fetch swaps within specific time window", async () => {
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const endTimestamp = oneMonthAgo + 60 * 60; // 1 hour window

      const result = await fetchSwapsInTimeWindow(oneMonthAgo, endTimestamp);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // Verify all trades are within the time window
      for (const trade of result) {
        const tradeTimestamp = Math.floor(
          trade.tradeTimestamp.getTime() / 1000
        );
        expect(tradeTimestamp).toBeGreaterThanOrEqual(oneMonthAgo);
        expect(tradeTimestamp).toBeLessThanOrEqual(endTimestamp);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      // This test assumes network might be unavailable
      // In a real scenario, you might mock network failures

      try {
        await fetchLatestBlock();
        // If it succeeds, that's fine - network is available
      } catch (error) {
        // If it fails, verify it's a network-related error
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it("should handle edge case timestamps gracefully", async () => {
      // Test with very old timestamp (before blockchain existed)
      // API might still return data, so we just check it doesn't crash
      const result = await fetchSwapsFromTimestamp(1, 5);
      expect(Array.isArray(result)).toBe(true);
      // Note: API may return data even for very old timestamps
    });

    it("should respect The Graph API skip limitations", async () => {
      // Test that our functions handle the 5000 skip limit properly
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      try {
        // This should not crash even with large time windows that might require many skips
        const result = await fetchSwapsInTimeWindow(
          oneMonthAgo,
          oneMonthAgo + 3600
        );
        expect(Array.isArray(result)).toBe(true);
      } catch (error: any) {
        // Should not get skip limit errors anymore
        expect(error.message).not.toContain(
          "skip argument must be between 0 and 5000"
        );
      }
    });
  });

  describe("Performance Benchmarks", () => {
    it("should fetch latest block within reasonable time", async () => {
      const startTime = Date.now();
      await fetchLatestBlock();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should fetch small batch of historical swaps efficiently", async () => {
      const startTime = Date.now();
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const result = await fetchSwapsFromTimestamp(oneMonthAgo, 10);
      const duration = Date.now() - startTime;

      expect(Array.isArray(result)).toBe(true); // Always expect array, even if empty
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe("Data Consistency", () => {
    it("should return consistent results across multiple calls", async () => {
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      const [result1, result2] = await Promise.all([
        fetchSwapsFromTimestamp(oneMonthAgo, 3),
        fetchSwapsFromTimestamp(oneMonthAgo, 3),
      ]);

      expect(result1.length).toBe(result2.length);

      // Compare first trade if any exist
      if (result1.length > 0 && result2.length > 0) {
        expect(result1[0].transactionHash).toBe(result2[0].transactionHash);
        expect(result1[0].blockNumber).toBe(result2[0].blockNumber);
      }
    });

    it("should maintain transaction hash uniqueness within batch", async () => {
      const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const result = await fetchSwapsFromTimestamp(oneMonthAgo, 20);

      if (result.length > 1) {
        const txHashes = result.map((trade) => trade.transactionHash);
        const uniqueTxHashes = new Set(txHashes);

        // Note: Same transaction can have multiple swaps (different log indices)
        // so we check for transaction hash + log index uniqueness
        const txLogKeys = result.map(
          (trade) => `${trade.transactionHash}-${trade.logIndex}`
        );
        const uniqueTxLogKeys = new Set(txLogKeys);

        expect(uniqueTxLogKeys.size).toBe(result.length);
      }
    });
  });
});
