import { GraphQLClient } from "graphql-request";

// Create GraphQL clients for each DEX subgraph
// Using The Graph's decentralized network endpoints

const GRAPH_NETWORK_BASE_URL = "https://api.thegraph.com/subgraphs/id/";

// Subgraph IDs from our data acquisition plan
const SUBGRAPH_IDS = {
  aerodrome: "GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM",
  sushiswap: "7Tbc4o9M99Si1x7yenGXmsbHyMgUTPKJU1GjDdaXzXK3",
  baseswap: "BMK1YGMW7YzS8tgtiV97mh86VZHwASV8RjikPFqXQS3V",
  // Uniswap subgraph ID to be determined
} as const;

export type DexId = keyof typeof SUBGRAPH_IDS;

// Create a GraphQL client for a specific DEX
export const createGraphQLClient = (dexId: DexId): GraphQLClient => {
  const subgraphId = SUBGRAPH_IDS[dexId];
  if (!subgraphId) {
    throw new Error(`No subgraph ID configured for DEX: ${dexId}`);
  }

  const url = `${GRAPH_NETWORK_BASE_URL}${subgraphId}`;
  return new GraphQLClient(url, {
    headers: {
      // Add any required headers here (e.g., API key if needed)
    },
  });
};

// Export pre-configured clients for each DEX
export const graphQLClients = {
  aerodrome: createGraphQLClient("aerodrome"),
  sushiswap: createGraphQLClient("sushiswap"),
  baseswap: createGraphQLClient("baseswap"),
} as const;

// Helper to get client by DEX ID string (useful for dynamic selection)
export const getGraphQLClient = (dexId: string): GraphQLClient => {
  if (!(dexId in graphQLClients)) {
    throw new Error(`Invalid DEX ID: ${dexId}`);
  }
  return graphQLClients[dexId as DexId];
};
