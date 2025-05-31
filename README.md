# Auto-Trade

Auto-Trade is a comprehensive platform designed for the development, backtesting, and live execution of cryptocurrency trading strategies on decentralized exchanges (DEXs).

## Overview

The primary goal of Auto-Trade is to empower quantitative traders, retail enthusiasts, and strategy developers with robust tools to:

*   Develop and implement algorithmic trading strategies effectively.
*   Conduct realistic and reliable backtests using historical DEX data.
*   Automate trading operations seamlessly on various DEXs.
*   Archive trading data and strategy performance in a permanent, secure and verifiable manner using **Auto-Drive**. This integration will allow users to:
    *   Selectively archive critical data such as market data snapshots, strategy code/configurations, detailed backtest reports, and live trading logs.
    *   Leverage Auto-Drive for tamper-proof storage, ensuring the integrity and verifiability of archived records.
    *   Easily retrieve and review archived data for later analysis or auditing.

## Current Focus (Proof of Concept)

The initial development phase focuses on building the core infrastructure for data acquisition and strategy implementation. Key aspects include:

*   **Data Acquisition:** Sourcing and processing raw DEX trading history to create aggregated bar data (e.g., 1-minute, 1-hour candles) for backtesting.
*   **Strategy Development:** Users can develop trading strategies by forking this repository and implementing their logic directly in code (TypeScript with Deno is the primary supported environment for the core system).
*   **Backtesting Engine (Future):** Will allow for simulation against historical data, including modeling of DEX-specific elements, gas fees, and slippage.
*   **Live Trading (Future):** Will enable automated order execution on connected DEXs.

## Getting Started (POC)

As this project is in its early stages (Proof of Concept), the initial user experience involves:

1.  **Forking the Repository:** Developers and users can fork this `auto-trade` repository.
2.  **Strategy Implementation:** Implement custom trading logic within the provided framework (details on structure and APIs to be provided as development progresses).
3.  **Data Pipeline:** Set up and run the data acquisition pipeline to gather market data for backtesting (see `.product/planning/data-acquisition-plan.md` for details).

Further details on specific modules, setup, and contribution guidelines will be added as the project evolves.

## Longer-Term Roadmap

Once the foundational data pipeline and local strategy execution framework (outlined in "Current Focus") are established, key future enhancements will include:

*   Integrated Strategy Editor/IDE.
*   Advanced backtesting reporting and visualization.
*   Support for a wider range of DEXs and blockchain networks.
*   User-friendly dashboard and UI (React/TypeScript).
*   Full Auto-Drive integration for verifiable data archival.

We aim to build a user-friendly platform accessible to both technical and less technical traders.

---

*This README provides a high-level overview. For detailed product requirements, please refer to the documents in the `.product` directory.* 