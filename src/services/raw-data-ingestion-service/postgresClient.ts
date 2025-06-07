import { Pool } from "pg";
import config from "./config";
import type { RawTrade } from "./types";

let pool: Pool | null = null;

const getPostgresPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: config.postgresUrl,
      // Optional: Add other pool configuration options here if needed
      // e.g., max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000
    });

    pool.on("connect", () => {
      console.log("PostgreSQL client connected to the database");
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
      // May want to gracefully shut down or attempt to re-initialize the pool
      // For POC, we'll just log.
    });
  }
  return pool;
};

// Function to map RawTrade keys to database column names
// This is important if your DB columns are snake_case and TS types are camelCase
const mapTradeToDbRow = (trade: RawTrade): Record<string, unknown> => {
  return {
    transaction_hash: trade.transactionHash,
    log_index: trade.logIndex,
    // Assuming direct addresses for now, adjust if using token_pair_id
    base_token_address: trade.baseTokenAddress,
    quote_token_address: trade.quoteTokenAddress,
    dex_id: trade.dexId,
    trade_timestamp: trade.tradeTimestamp,
    block_number: trade.blockNumber,
    trader_address: trade.traderAddress,
    amount_in: trade.amountIn,
    token_in_address: trade.tokenInAddress,
    amount_out: trade.amountOut,
    token_out_address: trade.tokenOutAddress,
    price: trade.price,
    gas_used: trade.gasUsed,
    gas_price: trade.gasPrice,
    source_data_payload: trade.sourceData, // Assuming column name is source_data_payload for JSONB
    // ingested_at will be handled by DB default
  };
};

const insertRawTradesBatch = async (trades: RawTrade[]): Promise<void> => {
  if (trades.length === 0) {
    return;
  }
  const pgPool = getPostgresPool();
  const client = await pgPool.connect();

  const columns = [
    "transaction_hash",
    "log_index",
    "base_token_address",
    "quote_token_address",
    "dex_id",
    "trade_timestamp",
    "block_number",
    "trader_address",
    "amount_in",
    "token_in_address",
    "amount_out",
    "token_out_address",
    "price",
    "gas_used",
    "gas_price",
    "source_data_payload",
  ];
  const valuesPlaceholders = trades
    .map((_, tradeIndex) => {
      return `(${columns.map((_, colIndex) => `$${tradeIndex * columns.length + colIndex + 1}`).join(", ")})`;
    })
    .join(", ");

  const queryText = `
    INSERT INTO raw_trades (${columns.join(", ")})
    VALUES ${valuesPlaceholders}
    ON CONFLICT (transaction_hash, log_index) DO NOTHING;
  `;

  const queryValues = trades.flatMap((trade) => {
    const dbRow = mapTradeToDbRow(trade);
    return columns.map((col) => dbRow[col]);
  });

  try {
    await client.query(queryText, queryValues);
    console.log(
      `Successfully inserted/updated batch of ${trades.length} trades.`
    );
  } catch (error) {
    console.error("Error inserting raw trades batch into PostgreSQL:", error);
    throw error; // Re-throw to be handled by the calling persistence worker logic
  } finally {
    client.release();
  }
};

// Function to gracefully close the pool
const disconnectPostgres = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    console.log("PostgreSQL pool has been closed.");
    pool = null;
  }
};

export { getPostgresPool, insertRawTradesBatch, disconnectPostgres };
