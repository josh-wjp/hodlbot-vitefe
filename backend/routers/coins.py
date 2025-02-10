import time
import requests
from fastapi import FastAPI, APIRouter, HTTPException
from backend.ai.strategy import make_trade_decision  # Update this as per your directory structure

app = FastAPI()
router = APIRouter()

COINGECKO_API_MARKETS = "https://api.coingecko.com/api/v3/coins/markets"
cache = {"data": None, "timestamp": 0, "ttl": 60}  # Cache with TTL of 60 seconds

@router.get("/coins", tags=["Coins"])
def get_cached_coins():
    """
    Fetch and cache the top cryptocurrencies data from CoinGecko
    and add trade indicators to each coin.
    """
    global cache
    current_time = time.time()

    # Return cached data if valid
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

        # Add trade indicators
        for coin in coins:
            coin_id = coin["id"]
            try:
                trade_decision = make_trade_decision(coin_id)
                coin["trade_indicator"] = trade_decision
            except Exception as e:
                coin["trade_indicator"] = {"decision": "ERROR", "error": str(e)}

        # Update cache
        cache["data"] = coins
        cache["timestamp"] = current_time

        return coins

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")

app.include_router(router)
