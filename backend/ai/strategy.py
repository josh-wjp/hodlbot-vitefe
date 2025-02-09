import requests
import pandas as pd

# ✅ Validate 'ta' package before running
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
