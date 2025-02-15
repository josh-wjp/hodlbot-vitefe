import random
import pandas as pd
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

# Use an absolute import for the live strategy logic.
# Adjust the import path as per your project structure.
from backend.ai.strategy import make_trade_decision

app = FastAPI()

# Enable CORS for the required origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net",
        "https://salmon-plant-01410310f.4.azurestaticapps.net",
        "https://hodlbot.wjp.ai"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation mode flag (default to live)
IS_SIMULATION_MODE = False

# Endpoint to toggle simulation mode.
@app.post("/api/mode")
async def set_mode(mode: str = Body(...)):
    global IS_SIMULATION_MODE
    if mode not in ["live", "simulation"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'live' or 'simulation'.")
    IS_SIMULATION_MODE = (mode == "simulation")
    return {"mode": mode}

# Coin ranges for simulation
COIN_RANGES = {
    "bitcoin": (95000, 105000),
    "ethereum": (2500, 2800),
    "dogecoin": (0.25, 0.30),
    "litecoin": (100, 140),
    "ripple": (2.20, 2.50),
}

# Generate a simulated historical price DataFrame
def generate_historical_prices(coin_id, num_points=50):
    if coin_id not in COIN_RANGES:
        raise ValueError(f"Invalid coin: {coin_id}")
    min_price, max_price = COIN_RANGES[coin_id]
    prices = [round(random.uniform(min_price, max_price), 2) for _ in range(num_points)]
    timestamps = pd.date_range(end=pd.Timestamp.now(), periods=num_points)
    return pd.DataFrame({"timestamp": timestamps, "price": prices})

# Trading indicator calculations
def calculate_sma(df, window=5):
    df[f"SMA_{window}"] = df["price"].rolling(window=window).mean().round(6)
    return df

def calculate_rsi(df, window=14):
    df["RSI"] = df["price"].diff().apply(lambda x: max(x, 0)).rolling(window=window).mean() / \
                df["price"].diff().abs().rolling(window=window).mean()
    df["RSI"] = (100 - 100 / (1 + df["RSI"])).round(6)
    return df

def calculate_macd(df):
    ema_12 = df["price"].ewm(span=12, adjust=False).mean()
    ema_26 = df["price"].ewm(span=26, adjust=False).mean()
    df["MACD"] = (ema_12 - ema_26).round(6)
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean().round(6)
    return df

def calculate_bollinger_bands(df, window=20):
    rolling_mean = df["price"].rolling(window=window).mean()
    rolling_std = df["price"].rolling(window=window).std()
    df["BB_High"] = (rolling_mean + (rolling_std * 2)).round(6)
    df["BB_Low"] = (rolling_mean - (rolling_std * 2)).round(6)
    return df

# Simulated decision logic based on computed indicators
def compute_simulated_decision(df):
    latest = df.iloc[-1]
    if latest["RSI"] < 30 and latest["MACD"] > latest["MACD_Signal"]:
        return {"decision": "BUY", "price": latest["price"]}
    elif latest["RSI"] > 70 and latest["MACD"] < latest["MACD_Signal"]:
        return {"decision": "SELL", "price": latest["price"]}
    elif latest["price"] < latest["BB_Low"]:
        return {"decision": "BUY", "price": latest["price"]}
    elif latest["price"] > latest["BB_High"]:
        return {"decision": "SELL", "price": latest["price"]}
    else:
        return {"decision": "HOLD", "price": latest["price"]}

# Simulate a strategy for a single coin
def simulate_strategy(coin_id):
    df = generate_historical_prices(coin_id)
    df = calculate_sma(df, window=5)
    df = calculate_rsi(df, window=14)
    df = calculate_macd(df)
    df = calculate_bollinger_bands(df)
    decision = compute_simulated_decision(df)
    print(f"{coin_id.capitalize()} - {decision['decision']} at ${decision['price']:.2f}")
    return decision

# Endpoint to get trade decision for a given coin.
@app.get("/api/trading/decision/{coin_id}")
async def get_decision(coin_id: str):
    if IS_SIMULATION_MODE:
        return simulate_strategy(coin_id)
    else:
        return make_trade_decision(coin_id)

# For testing via command line
def run_simulation():
    print("\n=== Simulation Start ===")
    for coin in COIN_RANGES.keys():
        simulate_strategy(coin)
    print("=== Simulation End ===")

if __name__ == "__main__":
    run_simulation()
