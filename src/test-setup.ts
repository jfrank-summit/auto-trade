// Test setup for Vitest
import dotenv from "dotenv";

// Load environment variables for testing
dotenv.config();

// Ensure required environment variables are set for integration tests
if (!process.env.GRAPH_API_KEY) {
  console.warn("⚠️  GRAPH_API_KEY not set - integration tests may fail");
}

// Set longer timeouts for network requests in test environment
process.env.NODE_ENV = "test";
