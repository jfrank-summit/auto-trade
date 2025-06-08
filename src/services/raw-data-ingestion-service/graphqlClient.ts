import { GraphQLClient } from "graphql-request";

// Create GraphQL clients for each DEX subgraph
// Using The Graph's decentralized network endpoints

// The Graph decentralized network gateway
const GRAPH_GATEWAY_URL = "https://gateway-arbitrum.network.thegraph.com/api";

// You need an API key from The Graph to use the decentralized network
// Get one at: https://thegraph.com/studio/apikeys/
const GRAPH_API_KEY = process.env.GRAPH_API_KEY || "[api-key]";

// Subgraph IDs from our data acquisition plan
const SUBGRAPH_IDS = {
  aerodrome: "DQghTXXyk34DvW8nTmXPUs4cXoALcjSAp8JiZcDW5tnJ", // Aerodrome Base with transactionIndex
} as const;

export type DexId = keyof typeof SUBGRAPH_IDS;

// Create a GraphQL client for a specific DEX
export const createGraphQLClient = (dexId: DexId): GraphQLClient => {
  const subgraphId = SUBGRAPH_IDS[dexId];
  if (!subgraphId) {
    throw new Error(`No subgraph ID found for DEX: ${dexId}`);
  }

  // Construct the URL for the decentralized network with API key in path
  const url = `${GRAPH_GATEWAY_URL}/${GRAPH_API_KEY}/subgraphs/id/${subgraphId}`;

  return new GraphQLClient(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Pre-configured clients for each DEX
export const graphQLClients = {
  aerodrome: createGraphQLClient("aerodrome"),
  // Add other DEX clients as needed when we have their subgraph IDs
} as const;

// Helper to get all available DEX IDs
export const getAvailableDexIds = (): DexId[] => {
  return Object.keys(SUBGRAPH_IDS) as DexId[];
};
