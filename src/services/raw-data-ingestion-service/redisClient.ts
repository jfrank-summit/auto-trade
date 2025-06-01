import { createClient, type RedisClientType } from "redis";
import config from "./config";
import type { RawTrade } from "./types";

const RAW_TRADES_BUFFER_KEY = "raw_trades_buffer"; // Name of our Redis List

let client: RedisClientType | null = null;

const getRedisClient = async (): Promise<RedisClientType> => {
  if (client && client.isOpen) {
    return client;
  }
  client = createClient({
    url: config.redisUrl,
  });

  client.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  // Optional: more event listeners for 'connect', 'reconnecting', etc.
  // client.on('connect', () => console.log('Connected to Redis'));

  await client.connect();
  return client as RedisClientType; // Cast because connect() makes it non-null
};

const addTradeToBuffer = async (trade: RawTrade): Promise<void> => {
  const redis = await getRedisClient();
  try {
    // Serialize the trade object to a JSON string to store in Redis
    const tradeJson = JSON.stringify(trade);
    await redis.lPush(RAW_TRADES_BUFFER_KEY, tradeJson); // LPUSH to add to the head of the list
    console.log("Trade added to Redis buffer:", trade.transactionHash);
  } catch (error) {
    console.error("Error adding trade to Redis buffer:", error);
    // Potentially re-throw or handle more gracefully depending on requirements
    throw error;
  }
};

const getTradesFromBuffer = async (batchSize: number): Promise<RawTrade[]> => {
  const redis = await getRedisClient();
  const trades: RawTrade[] = [];
  try {
    const tradeJsonArray: string[] = [];
    for (let i = 0; i < batchSize; i++) {
      const tradeJson = await redis.rPop(RAW_TRADES_BUFFER_KEY);
      if (tradeJson) {
        tradeJsonArray.push(tradeJson);
      } else {
        break; // No more items in the list
      }
    }

    if (tradeJsonArray && tradeJsonArray.length > 0) {
      // RPOP gets from tail, so reverse if you want to process in approx. insertion order for the batch.
      // However, if multiple producers are LPUSHing, global order isn't strictly guaranteed by this batching.
      for (const tradeJson of tradeJsonArray.reverse()) {
        trades.push(JSON.parse(tradeJson) as RawTrade);
      }
      console.log(`Retrieved ${trades.length} trades from Redis buffer.`);
    }
  } catch (error) {
    console.error("Error getting trades from Redis buffer:", error);
    throw error;
  }
  return trades;
};

// Function to gracefully disconnect
const disconnectRedis = async (): Promise<void> => {
  if (client && client.isOpen) {
    await client.quit();
    console.log("Disconnected from Redis.");
    client = null;
  }
};

export {
  getRedisClient,
  addTradeToBuffer,
  getTradesFromBuffer,
  disconnectRedis,
  RAW_TRADES_BUFFER_KEY, // Export key if needed elsewhere (e.g., monitoring)
};
