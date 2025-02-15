import random
import pandas as pd
import requests

# Validate 'ta' package before running
try:
    import ta
    print("✅ 'ta' library imported successfully!")
except ImportError:
    raise ImportError("❌ ERROR: 'ta' package not found. Install with: pip install ta")

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# -------------------------------
# Global Simulation Mode Flag
# -------------------------------
# When True, simulated data will be used.
IS_SIMULATION_MODE = False  # Default to live mode

# -------------------------------
# Simulation coin ranges
# -------------------------------
COIN_RANGES = {
    "bitcoin": (95000, 105000),
    "ethereum": (2500, 2800),
    "dogecoin": (0.25, 0.30),
    "litecoin": (100, 140),
    "ripple": (2.20, 2.50),
}

# -------------------------------
# Endpoints to toggle simulation mode
# -------------------------------
@app.post("/api/mode")
async def set_mode(mode: str = Body(...)):
    """Set the mode for live data or simulation."""
    global IS_SIMULATION_MODE
    if mode not in ["live", "simulation"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'live' or 'simulation'.")
    IS_SIMULATION_MODE = (mode == "simulation")
    return {"mode": mode}

# -------------------------------
# Simulated historical prices generator
# -------------------------------
def generate_simulated_historical_prices(coin_id: str, days: int = 14):
    """Generate a DataFrame with simulated historical price data for a given coin."""
    coin = coin_id.lower()
    if coin not in COIN_RANGES:
        print(f"⚠️ Simulation: Invalid coin '{coin_id}'")
        return None
    low, high = COIN_RANGES[coin]
    # Generate 'days' number of data points (daily data)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=days)
    prices = [round(random.uniform(low, high), 6) for _ in range(days)]
    df = pd.DataFrame({"timestamp": dates, "price": prices})
    return df

# -------------------------------
# Live historical prices fetcher (CoinGecko)
# -------------------------------
COINGECKO_API = "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"

def get_historical_prices(coin_id: str, days: int = 14):
    """Fetch historical price data from CoinGecko (if live) or generate simulated data."""
    if IS_SIMULATION_MODE:
        df = generate_simulated_historical_prices(coin_id, days=days)
        if df is None or df.empty:
            print(f"⚠️ Simulation: No simulated price data for '{coin_id}'")
        return df
    else:
        url = COINGECKO_API.format(coin_id=coin_id)
        params = {"vs_currency": "usd", "days": days}
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if "prices" not in data or not data["prices"]:
                raise ValueError(f"⚠️ ERROR: No valid price data for '{coin_id}'.")
            df = pd.DataFrame(data["prices"], columns=["timestamp", "price"])
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df["price"] = df["price"].round(6)
            if df.empty or df["price"].isnull().all():
                raise ValueError("⚠️ ERROR: Received empty or invalid data.")
            return df
        except requests.exceptions.RequestException as e:
            print(f"🚨 API ERROR: {e}")
            return None
        except ValueError as ve:
            print(f"⚠️ INVALID COIN: {ve}")
            return None

# -------------------------------
# Indicator Calculations (common for both modes)
# -------------------------------
def calculate_sma(df, window=5):
    """Calculate Simple Moving Average (SMA) with safeguards."""
    if len(df) < window:
        print(f"⚠️ WARNING: Not enough data to calculate SMA-{window}")
        return df
    df[f"SMA_{window}"] = df["price"].rolling(window=window).mean().round(6)
    return df

def calculate_rsi(df, window=14):
    """Calculate Relative Strength Index (RSI) with safety checks."""
    if len(df) < window:
        print(f"⚠️ WARNING: Not enough data to calculate RSI-{window}")
        return df
    df["RSI"] = ta.momentum.RSIIndicator(df["price"], window=window).rsi().round(6)
    return df

def calculate_macd(df):
    """Calculate MACD and Signal Line."""
    macd = ta.trend.MACD(df["price"]).macd()
    signal = ta.trend.MACD(df["price"]).macd_signal()
    df["MACD"] = macd.round(6)
    df["MACD_Signal"] = signal.round(6)
    return df

def calculate_bollinger_bands(df):
    """Calculate Bollinger Bands."""
    indicator = ta.volatility.BollingerBands(df["price"])
    df["BB_High"] = indicator.bollinger_hband().round(6)
    df["BB_Low"] = indicator.bollinger_lband().round(6)
    return df

def calculate_adx(df):
    """Calculate ADX for trend strength."""
    df["ADX"] = ta.trend.ADXIndicator(
        high=df["price"], low=df["price"], close=df["price"]
    ).adx().round(6)
    return df

def calculate_stop_loss_and_take_profit(price, stop_loss_percent=5, take_profit_percent=10):
    """
    Calculate stop-loss and take-profit prices.
    :param price: Current price of the asset.
    :param stop_loss_percent: Percentage for stop-loss threshold.
    :param take_profit_percent: Percentage for take-profit threshold.
    :return: Stop-loss price, take-profit price.
    """
    stop_loss_price = price * (1 - stop_loss_percent / 100)
    take_profit_price = price * (1 + take_profit_percent / 100)
    return round(stop_loss_price, 6), round(take_profit_price, 6)

# -------------------------------
# Decision Logic
# -------------------------------
def make_trade_decision(coin_id: str):
    """AI trading decision based on SMA, RSI, MACD, Bollinger Bands, and Stop-Loss/Take-Profit."""
    df = get_historical_prices(coin_id)
    if df is None or df.empty:
        print("⚠️ ERROR: No price data fetched!")
        return {"error": "No price data available"}

    # Compute indicators
    df = calculate_sma(df, window=5)
    df = calculate_sma(df, window=10)
    df = calculate_rsi(df)
    df = calculate_macd(df)
    df = calculate_bollinger_bands(df)
    df = calculate_adx(df)

    latest = df.iloc[-1]  # Most recent data
    stop_loss_price, take_profit_price = calculate_stop_loss_and_take_profit(latest["price"])

    # Debug: Show latest indicators
    print(
        f"🔍 Latest Price: {latest['price']:.6f}, RSI: {latest['RSI']:.2f}, "
        f"MACD: {latest['MACD']:.6f}, Signal: {latest['MACD_Signal']:.6f}, "
        f"BB High: {latest['BB_High']:.6f}, BB Low: {latest['BB_Low']:.6f}, ADX: {latest['ADX']:.2f}"
    )

    # Decision logic
    if latest["RSI"] < 30 and latest["MACD"] > latest["MACD_Signal"] and latest["ADX"] > 25:
        return {"decision": "BUY", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    elif latest["RSI"] > 70 and latest["MACD"] < latest["MACD_Signal"] and latest["ADX"] > 25:
        return {"decision": "SELL", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    elif latest["price"] < latest["BB_Low"]:
        return {"decision": "BUY", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    elif latest["price"] > latest["BB_High"]:
        return {"decision": "SELL", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    elif latest["price"] <= stop_loss_price:
        return {"decision": "SELL", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6), "reason": "Stop-loss triggered"}
    elif latest["price"] >= take_profit_price:
        return {"decision": "SELL", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6), "reason": "Take-profit triggered"}
    else:
        return {"decision": "HOLD", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}

# -------------------------------
# Endpoint for Trade Decision
# -------------------------------
@app.get("/api/trading/decision/{coin_id}")
async def get_decision(coin_id: str):
    """Get the trade decision based on the current mode (live or simulation)."""
    return make_trade_decision(coin_id)

# -------------------------------
# For testing via command line
# -------------------------------
def run_simulation():
    """Run a simulation for all coins defined in simulation mode."""
    print("\n=== Simulation Start ===")
    for coin in COIN_RANGES.keys():
        decision = make_trade_decision(coin)
        print(f"{coin.capitalize()} - Decision: {decision}")
    print("=== Simulation End ===")

if __name__ == "__main__":
    # If running locally, you can test the simulation by toggling IS_SIMULATION_MODE
    # For example:
    # IS_SIMULATION_MODE = True
    run_simulation()
