import time
import random
import requests
from fastapi import FastAPI, APIRouter, HTTPException
from backend.ai.strategy import make_trade_decision  # Live strategy logic

app = FastAPI()
router = APIRouter()

# Simulation mode state (default to live)
current_mode = {"mode": "live"}

# Dummy coin ranges for simulation
COIN_RANGES = {
    "bitcoin": (95000, 105000),
    "ethereum": (2500, 2800),
    "dogecoin": (0.25, 0.30),
    "litecoin": (100, 140),
    "ripple": (2.20, 2.50),
}

def simulate_strategy(coin_id: str):
    """Simulate a trade decision for a coin."""
    coin = coin_id.lower()
    if coin not in COIN_RANGES:
        return {"error": f"Invalid coin: '{coin_id}'"}
    low, high = COIN_RANGES[coin]
    simulated_price = round(random.uniform(low, high), 2)
    # Dummy strategy: buy if price is below the midpoint; sell otherwise.
    mid = (low + high) / 2
    decision = "BUY" if simulated_price < mid else "SELL"
    return {"decision": decision, "price": simulated_price, "coin": coin}

# Cache for live coin data (with TTL of 300 seconds)
cache = {"data": None, "timestamp": 0, "ttl": 300}
COINGECKO_API_MARKETS = "https://api.coingecko.com/api/v3/coins/markets"

@router.get("/coins", tags=["Coins"])
def get_cached_coins():
    """
    Fetch and cache the top cryptocurrencies data from CoinGecko
    and add trade indicators to each coin.
    In simulation mode, return simulated coin data.
    """
    global cache

    # If simulation mode is active, build simulated data
    if current_mode["mode"] == "simulation":
        simulated_data = []
        for coin, (low, high) in COIN_RANGES.items():
            simulated_price = round(random.uniform(low, high), 2)
            simulated_data.append({
                "id": coin,
                "current_price": simulated_price,
                "trade_indicator": simulate_strategy(coin)
            })
        return simulated_data

    # Otherwise, fetch live data and use cache
    current_time = time.time()
    if cache["data"] and (current_time - cache["timestamp"] < cache["ttl"]):
        return cache["data"]

    try:
        response = requests.get(
            COINGECKO_API_MARKETS,
            params={"vs_currency": "usd", "order": "market_cap_desc", "per_page": 100},
            timeout=10,
        )
        response.raise_for_status()
        coins = response.json()

        # Add trade indicators using the live strategy
        for coin in coins:
            coin_id = coin["id"]
            try:
                trade_decision = make_trade_decision(coin_id)
                coin["trade_indicator"] = trade_decision
            except Exception as e:
                coin["trade_indicator"] = {"decision": "ERROR", "error": str(e)}

        cache["data"] = coins
        cache["timestamp"] = current_time

        return coins

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")

app.include_router(router)
