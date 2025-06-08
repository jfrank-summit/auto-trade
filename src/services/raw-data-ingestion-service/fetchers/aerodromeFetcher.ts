import { graphQLClients } from "../graphqlClient.ts";
import type { RawTrade } from "../types.ts";
import {
  GET_RECENT_SWAPS,
  GET_LATEST_BLOCK,
  type SwapsResponse,
  type MetaResponse,
  type Swap,
} from "../queries/aerodromeQueries.ts";

// Constants for fetching
const BATCH_SIZE = 100; // Number of swaps to fetch per query
const DEX_ID = "aerodrome";

// Transform Aerodrome swap data to our RawTrade format
const transformSwapToRawTrade = (swap: Swap): RawTrade => {
  // Determine which token is being sold/bought based on amounts
  const isToken0In = parseFloat(swap.amount0In) > 0;

  const tokenInAddress = isToken0In ? swap.pool.token0.id : swap.pool.token1.id;
  const tokenOutAddress = isToken0In
    ? swap.pool.token1.id
    : swap.pool.token0.id;
  const amountIn = isToken0In ? swap.amount0In : swap.amount1In;
  const amountOut = isToken0In ? swap.amount1Out : swap.amount0Out;

  // Calculate price (amountOut / amountIn)
  // Note: This is a simplified calculation, may need adjustment based on decimals
  const price = parseFloat(amountOut) / parseFloat(amountIn);

  return {
    transactionHash: swap.transaction.id,
    logIndex: parseInt(swap.logIndex, 10),
    baseTokenAddress: swap.pool.token0.id,
    quoteTokenAddress: swap.pool.token1.id,
    dexId: DEX_ID,
    tradeTimestamp: new Date(parseInt(swap.timestamp, 10) * 1000), // Convert from Unix timestamp
    blockNumber: parseInt(swap.transaction.blockNumber, 10),
    traderAddress: swap.sender,
    amountIn,
    tokenInAddress,
    amountOut,
    tokenOutAddress,
    price: price.toString(),
    sourceData: swap, // Store original swap data for debugging
  };
};

// Fetch the latest block information
export const fetchLatestBlock = async (): Promise<{
  blockNumber: number;
  timestamp: number;
}> => {
  const client = graphQLClients.aerodrome;
  const response = await client.request<MetaResponse>(GET_LATEST_BLOCK);
  return {
    blockNumber: response._meta.block.number,
    timestamp: response._meta.block.timestamp,
  };
};

// Fetch swaps starting from a specific timestamp
export const fetchSwapsFromTimestamp = async (
  minTimestamp: number,
  maxResults: number = 1000
): Promise<RawTrade[]> => {
  const client = graphQLClients.aerodrome;
  const allSwaps: Swap[] = [];
  let skip = 0;

  // Fetch swaps in batches until we reach maxResults or no more data
  while (allSwaps.length < maxResults) {
    const response = await client.request<SwapsResponse>(GET_RECENT_SWAPS, {
      first: BATCH_SIZE,
      skip,
      minTimestamp: minTimestamp.toString(),
    });

    if (response.swaps.length === 0) {
      break; // No more swaps
    }

    allSwaps.push(...response.swaps);
    skip += BATCH_SIZE;

    // If we got less than BATCH_SIZE, we've reached the end
    if (response.swaps.length < BATCH_SIZE) {
      break;
    }
  }

  // Transform to RawTrade format
  return allSwaps.slice(0, maxResults).map(transformSwapToRawTrade);
};

// Fetch swaps for a specific time window
export const fetchSwapsInTimeWindow = async (
  startTimestamp: number,
  endTimestamp: number
): Promise<RawTrade[]> => {
  const client = graphQLClients.aerodrome;
  const allSwaps: Swap[] = [];
  let skip = 0;

  while (true) {
    const response = await client.request<SwapsResponse>(GET_RECENT_SWAPS, {
      first: BATCH_SIZE,
      skip,
      minTimestamp: startTimestamp.toString(),
    });

    if (response.swaps.length === 0) {
      break;
    }

    // Filter swaps that are within our time window
    const swapsInWindow = response.swaps.filter(
      (swap) => parseInt(swap.timestamp, 10) <= endTimestamp
    );

    allSwaps.push(...swapsInWindow);

    // If we found swaps beyond our window, we're done
    if (swapsInWindow.length < response.swaps.length) {
      break;
    }

    skip += BATCH_SIZE;
  }

  return allSwaps.map(transformSwapToRawTrade);
};
