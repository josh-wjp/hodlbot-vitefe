import requests
import pandas as pd

# ✅ Improved: Validate 'ta' package before running
try:
    import ta

    print("✅ 'ta' library imported successfully!")
except ImportError:
    raise ImportError("❌ ERROR: 'ta' package not found. Install with: pip install ta")

COINGECKO_API = "https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"


def get_historical_prices(coin_id: str, days: int = 14):
    """Fetch historical price data from CoinGecko and handle invalid coins."""
    url = COINGECKO_API.format(coin_id=coin_id)
    params = {"vs_currency": "usd", "days": days}

    try:
        response = requests.get(url, params=params, timeout=10)

        # ✅ Handle HTTP errors
        if response.status_code == 429:
            raise Exception("🚨 ERROR: CoinGecko API rate limit exceeded. Try again later.")

        response.raise_for_status()  # Raise error for 404, 500, etc.
        data = response.json()

        # ✅ Validate API response
        if "prices" not in data or not data["prices"]:
            raise ValueError(f"⚠️ ERROR: No valid price data for '{coin_id}'.")

        df = pd.DataFrame(data["prices"], columns=["timestamp", "price"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")

        # ✅ Ensure prices are rounded to 6 decimal places
        df["price"] = df["price"].round(6)

        # ✅ Handle empty data case
        if df.empty or df["price"].isnull().all():
            raise ValueError("⚠️ ERROR: Received empty or invalid data.")

        return df

    except requests.exceptions.RequestException as e:
        print(f"🚨 API ERROR: {e}")
        return None
    except ValueError as ve:
        print(f"⚠️ INVALID COIN: {ve}")
        return None


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


def make_trade_decision(coin_id: str):
    """AI trading decision based on SMA & RSI."""
    df = get_historical_prices(coin_id)

    if df is None or df.empty:
        print("⚠️ ERROR: No price data fetched!")
        return {"error": "No price data available"}

    print("📊 Data Sample:\n", df.head())

    # Compute indicators
    df = calculate_sma(df, window=5)
    df = calculate_sma(df, window=10)
    df = calculate_rsi(df)

    latest = df.iloc[-1]  # Most recent data

    # Debug: Show latest price & RSI with 6 decimal places
    print(f"🔍 Latest Price: {latest['price']:.6f}, RSI: {latest['RSI']:.6f}")

    # ✅ Improved trading strategy with buffer zones
    if latest["RSI"] < 30 and latest["SMA_5"] > latest["SMA_10"] * 1.02:
        return {"decision": "BUY", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    elif latest["RSI"] > 70 and latest["SMA_5"] < latest["SMA_10"] * 0.98:
        return {"decision": "SELL", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
    else:
        return {"decision": "HOLD", "price": round(latest["price"], 6), "RSI": round(latest["RSI"], 6)}
