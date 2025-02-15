# HodlBot AI - AI-Powered Crypto Trading Bot

## **Overview**

HodlBot AI is an **AI-driven cryptocurrency trading assistant** designed to automate trade decisions, manage portfolios, and integrate with the **NEAR blockchain**. It supports both **live trading** and **simulation mode** for strategy testing.

## **Features**

- 📈 **Automated AI Trading** – Uses **technical indicators** like RSI, SMA, MACD, and Bollinger Bands to make buy/sell decisions.
- 🔄 **Auto-Trading Strategies** – Define profit/loss thresholds, trade frequency, and indicators.
- 🔗 **NEAR Wallet Integration** – Allows users to log in, manage funds, and execute blockchain transactions.
- 🛠 **Live & Simulated Trading** – Supports both real-time trading and simulation for strategy testing.
- 💹 **Portfolio Tracking** – Monitors asset balances, transaction history, and profit/loss (PnL).

## **Installation & Setup**

### **1️⃣ Backend Setup**

```bash
# Clone the repository
git clone https://github.com/your-repo/hodlbot.git
cd hodlbot

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### **2️⃣ Frontend Setup**

```bash
cd hodlbot-frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

## **Key Components**

### **Backend (Python/FastAPI)**

- **`main.py`** – Core API backend, routes, and trade decision logic.
- **`automation.py`** – Manages the auto-trading execution loop.
- **`strategy.py`** – Defines AI-driven trade strategies.
- **`portfolio.py`** – Tracks cryptocurrency holdings.
- **`transactions.py`** – Logs all buy/sell transactions.
- **`near.py`** – Handles **NEAR blockchain** interactions.
- **`coingecko.py`** – Fetches live price data from CoinGecko.

### **Frontend (React/Vite)**

- **`App.jsx`** – Core React app managing state and API interactions.
- **`CryptoIndex.jsx`** – Displays cryptocurrency market data.
- **`TradeInfo.jsx`** – Shows trade signals for selected crypto.
- **`near-wallet.js`** – Handles NEAR wallet authentication.
- **`vite.config.js`** – Configures the Vite development/build process.

## **Testing**

```bash
# Run automated tests
pytest
```

## **Deployment**

### **1️⃣ Docker Deployment**

```bash
# Build and run the backend in Docker
docker build -t hodlbot-backend .
docker run -p 8000:8000 hodlbot-backend
```

### **2️⃣ Frontend Deployment**

```bash
npm run build
serve -s dist
```

## **Contributing**

Pull requests are welcome! Open an issue for any feature requests or bug reports.

## **License**

Apache 2.0 License. See `LICENSE` for details.

-------------------------------------------------------------------------------------

HodlBot AI – Project Story

🚀 Inspiration

The crypto market never sleeps, and neither should your investment strategy. Traditional portfolio management tools often require constant monitoring and manual adjustments, making it difficult for investors to react to market shifts in real-time.

I envisioned HodlBot AI as a fully autonomous, AI-powered portfolio manager that optimizes investment strategies, executes intelligent trades, and mitigates risks—without requiring users to micromanage their portfolios. By leveraging NEAR Protocol’s blockchain infrastructure and cutting-edge AI-driven analytics, HodlBot AI brings intelligent, decentralized investing to the masses.


🧠 What I Learned
I explored AI, DeFi, and blockchain automation throughout this hackathon. 

Key takeaways include:

    NEAR Protocol & Smart Contracts – Learning to deploy smart contracts on NEAR and interact with the blockchain for secure, trustless execution.
    AI-Driven Market Analysis – Training models on historical price data, social sentiment, and trading indicators to make real-time investment decisions.
    Web3 Wallet Integrations – Enabling users to connect their NEAR wallets for secure and decentralized transactions.
    Risk Management Strategies – Developing AI-powered stop-loss mechanisms and automated rebalancing to protect users from volatility.

🛠 How I Built It

HodlBot AI combines machine learning, blockchain automation, and real-time analytics to deliver an autonomous portfolio manager.

💻 Tech Stack

    Languages & Frameworks: Python (AI backend), Rust (NEAR smart contracts), React.js (frontend)
    Cloud & Storage: NEAR Blockchain (on-chain execution), Azure (AI model and app hosting)
    Data Sources: CoinGecko API (market data), Twitter API (sentiment analysis), TradingView API (trading indicators)
    Security & Authentication: NEAR Wallet (user login), MetaMask (optional Web3 wallet)

🛠 Development Process
    AI Model Development
        Trained a predictive AI model using historical crypto data & sentiment analysis.
        Built a risk assessment engine to manage stop-losses and rebalancing.

    Blockchain & Smart Contracts
        Developed NEAR-based smart contracts to execute transactions autonomously.
        Integrated NEAR Wallet authentication for secure user access.

    Frontend & User Experience
        Designed a React.js dashboard for users to monitor portfolio performance.
        Created real-time visualizations for investment insights.

🔥 Challenges I Faced

1️⃣ NEAR Smart Contract Development

Writing and deploying Rust-based smart contracts on NEAR required a steep learning curve. Major hurdles included overcoming gas fees, contract optimization, and blockchain event handling.

2️⃣ AI Trading Model Complexity

Predicting market movements is tough—crypto is highly volatile and influenced by human sentiment. Finding the right balance between technical indicators and AI-driven insights was key.

3️⃣ Web3 Authentication & Security

Integrating NEAR Wallet authentication while ensuring secure, trustless execution presented key management and API security challenges.

4️⃣ Time Constraints

With a limited hackathon window, I had to prioritize essential features while maintaining a functional MVP (Minimum Viable Product).

🎯 Final Thoughts

HodlBot AI represents the future of AI-powered decentralized investing. By combining the best of machine learning and blockchain automation, I have built a tool that empowers users to optimize their crypto investments without constant micromanagement.

This hackathon has been an incredible journey, and I am excited about the possibilities of expanding HodlBot AI beyond the competition. 🚀

https://devpost.com/software/hodlbot-ai
