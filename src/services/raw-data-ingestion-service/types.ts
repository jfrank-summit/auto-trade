// src/services/raw-data-ingestion-service/types.ts

export type RawTrade = {
  transactionHash: string;
  logIndex?: number; // Optional, as not all sources might provide it or it might not be needed if tx hash is unique enough per trade

  // Option 1: Using direct addresses (simpler for initial fetching)
  baseTokenAddress: string;
  quoteTokenAddress: string;
  // Option 2: Or using a tokenPairId (requires a lookup/management service for pairs)
  // tokenPairId: string; // Or number, depending on how you manage pair IDs

  dexId: string; // Identifier for the DEX (e.g., "aerodrome", "uniswap_v3_base")

  tradeTimestamp: Date; // Or string initially, convert to Date object ASAP
  blockNumber: number; // Or bigint if numbers can exceed JS max safe integer

  traderAddress?: string; // Address of the account initiating the swap, might not always be available or relevant

  amountIn: string; // Using string to handle large numbers (e.g., from uint256), convert to BigInt/Decimal later
  tokenInAddress: string;

  amountOut: string; // Using string for large numbers
  tokenOutAddress: string;

  // Price could be calculated or directly from source.
  // Its definition (base/quote or quote/base) needs to be consistent.
  price?: string;

  // Optional fields from source
  gasUsed?: string;
  gasPrice?: string;

  // For internal tracking
  sourceData?: unknown; // To store the original payload from the source for debugging/reprocessing
};

// Example of how we might represent a token pair if we normalize it
export type TokenPair = {
  id: string; // e.g., "AERO-WETH-BASE" or a UUID
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  dexId: string;
};

// Configuration type (we'll build this out in config.ts)
export type ServiceConfig = {
  redisUrl: string;
  postgresUrl: string;
  targetDexSubgraphUrl: string;
  // ... other configs
};
