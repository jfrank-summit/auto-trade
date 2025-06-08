import { gql } from "graphql-request";

// Query to fetch recent swaps from Aerodrome
// Updated to use the correct schema with pool instead of pair
export const GET_RECENT_SWAPS = gql`
  query GetRecentSwaps($first: Int!, $skip: Int!, $minTimestamp: BigInt!) {
    swaps(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gte: $minTimestamp }
    ) {
      id
      transaction {
        id
        blockNumber
      }
      timestamp
      pool {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
      sender
      to
      amount0In
      amount0Out
      amount1In
      amount1Out
      logIndex
    }
  }
`;

// Query to get the latest block info for checkpointing
export const GET_LATEST_BLOCK = gql`
  query GetLatestBlock {
    _meta {
      block {
        number
        timestamp
      }
    }
  }
`;

// Query to fetch swaps by block range (alternative approach)
export const GET_SWAPS_BY_BLOCK_RANGE = gql`
  query GetSwapsByBlockRange(
    $first: Int!
    $skip: Int!
    $startBlock: BigInt!
    $endBlock: BigInt!
  ) {
    swaps(
      first: $first
      skip: $skip
      orderBy: logIndex
      orderDirection: asc
      where: {
        transaction_: {
          blockNumber_gte: $startBlock
          blockNumber_lte: $endBlock
        }
      }
    ) {
      id
      transaction {
        id
        blockNumber
      }
      timestamp
      pool {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
      sender
      to
      amount0In
      amount0Out
      amount1In
      amount1Out
      logIndex
    }
  }
`;

// Types for the query responses
export type Token = {
  id: string;
  symbol: string;
  decimals: string;
};

export type Pool = {
  id: string;
  token0: Token;
  token1: Token;
};

export type Swap = {
  id: string;
  transaction: {
    id: string;
    blockNumber: string;
  };
  timestamp: string;
  pool: Pool;
  sender: string;
  to: string;
  amount0In: string;
  amount0Out: string;
  amount1In: string;
  amount1Out: string;
  logIndex: string;
};

export type SwapsResponse = {
  swaps: Swap[];
};

export type MetaResponse = {
  _meta: {
    block: {
      number: number;
      timestamp: number;
    };
  };
};
