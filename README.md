# Auto-Trade

Auto-Trade is a comprehensive platform designed for the development, backtesting, and live execution of cryptocurrency trading strategies on decentralized exchanges (DEXs).

## Overview

The primary goal of Auto-Trade is to empower quantitative traders, retail enthusiasts, and strategy developers with robust tools to:

- Develop and implement algorithmic trading strategies effectively.
- Conduct realistic and reliable backtests using historical DEX data.
- Automate trading operations seamlessly on various DEXs.
- Archive trading data and strategy performance in a permanent, secure and verifiable manner using **Auto-Drive**. This integration will allow users to:
  - Selectively archive critical data such as market data snapshots, strategy code/configurations, detailed backtest reports, and live trading logs.
  - Leverage Auto-Drive for tamper-proof storage, ensuring the integrity and verifiability of archived records.
  - Easily retrieve and review archived data for later analysis or auditing.

## Current Focus (Proof of Concept)

The initial development phase focuses on building the core infrastructure for data acquisition and strategy implementation. Key aspects include:

- **Data Acquisition:** Sourcing and processing raw DEX trading history to create aggregated bar data (e.g., 1-minute, 1-hour candles) for backtesting.
- **Strategy Development:** Users can develop trading strategies by forking this repository and implementing their logic directly in code (TypeScript with Node.js is the primary supported environment for the core system).
- **Backtesting Engine (Future):** Will allow for simulation against historical data, including modeling of DEX-specific elements, gas fees, and slippage.
- **Live Trading (Future):** Will enable automated order execution on connected DEXs.

## Getting Started

This section guides you through setting up and running the initial Proof of Concept, which focuses on the **Raw Data Ingestion Service**.

### Prerequisites

- **Node.js:** Version 18.x or newer recommended.
- **Yarn:** Version 1.x (Classic).
- **PostgreSQL:** A running instance of PostgreSQL.
- **Redis:** A running instance of Redis.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd auto-trade
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Configuration

- Copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Edit the `.env` file with your specific configurations:
  - `REDIS_URL`: Your Redis connection URL (e.g., `redis://localhost:6379`).
  - `POSTGRES_URL`: Your PostgreSQL connection URL (e.g., `postgresql://your_user:your_password@localhost:5432/autotrade_db`). Make sure the specified user has privileges to create tables and write data to the database.
  - `TARGET_DEX_SUBGRAPH_URL`: The GraphQL endpoint for the DEX subgraph you want to ingest data from (e.g., an Aerodrome Finance subgraph on the Base network).

### 4. Database Setup (PostgreSQL)

You need to create the database specified in your `POSTGRES_URL` and the required tables.

- **Database Creation:** Ensure the database (e.g., `autotrade_db`) exists.
- **Table Creation (`raw_trades`):** For the POC, the `RawDataIngestionService` will store data in a table named `raw_trades`. The essential schema for this table is:
  ```sql
  CREATE TABLE IF NOT EXISTS raw_trades (
      trade_id BIGSERIAL PRIMARY KEY,
      transaction_hash VARCHAR(255) NOT NULL,
      log_index INTEGER, -- Can be part of a unique constraint with transaction_hash
      base_token_address VARCHAR(255) NOT NULL,
      quote_token_address VARCHAR(255) NOT NULL,
      dex_id VARCHAR(100) NOT NULL,
      trade_timestamp TIMESTAMPTZ NOT NULL,
      block_number BIGINT NOT NULL,
      trader_address VARCHAR(255),
      amount_in TEXT NOT NULL, -- Stored as TEXT to handle large numbers, convert in application
      token_in_address VARCHAR(255) NOT NULL,
      amount_out TEXT NOT NULL, -- Stored as TEXT
      token_out_address VARCHAR(255) NOT NULL,
      price TEXT, -- Stored as TEXT
      gas_used TEXT,
      gas_price TEXT,
      source_data_payload JSONB,
      ingested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE (transaction_hash, log_index) -- Important for preventing duplicates
  );
  -- Consider adding indexes for performance, e.g., on trade_timestamp, token addresses.
  CREATE INDEX IF NOT EXISTS idx_raw_trades_timestamp ON raw_trades (trade_timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_raw_trades_pair_dex ON raw_trades (base_token_address, quote_token_address, dex_id);
  ```
  _(A more formal `schema.sql` or migration system will be implemented later.)_

### 5. Running the Raw Data Ingestion Service

Once the environment and database are set up:

```bash
yarn start:raw-ingestion
```

This will start the service defined in `src/services/raw-data-ingestion-service/main.ts`. Initially, this service will focus on the persistence loop (moving data from a Redis buffer to PostgreSQL). The actual data fetching from external sources will be implemented subsequently.

_(Further details on specific modules and advanced setup will be added as the project evolves.)_

## Longer-Term Roadmap

Once the foundational data pipeline and local strategy execution framework (outlined in "Current Focus") are established, key future enhancements will include:

- Integrated Strategy Editor/IDE.
- Advanced backtesting reporting and visualization.
- Support for a wider range of DEXs and blockchain networks.
- User-friendly dashboard and UI (React/TypeScript).
- Full Auto-Drive integration for verifiable data archival.

We aim to build a user-friendly platform accessible to both technical and less technical traders.
