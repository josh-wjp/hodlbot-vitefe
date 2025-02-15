import time
import random
import requests
import pandas as pd
from fastapi import FastAPI, APIRouter, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import your live strategy logic (adjust the path as needed)
from backend.ai.strategy import make_trade_decision

app = FastAPI()

# Re-enable CORSMiddleware with valid origins (do not include URL paths here)
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

router = APIRouter()

#############################################
# Global Simulation Mode State
#############################################
# Use a dictionary as the single source of truth for mode.
current_mode = {"mode": "live"}  # Default to live mode

# Define coin ranges for simulation
COIN_RANGES = {
    "bitcoin": (95000, 105000),
    "ethereum": (2500, 2800),
    "dogecoin": (0.25, 0.30),
    "litecoin": (100, 140),
    "ripple": (2.20, 2.50),
}

#############################################
# Simulation Helper Functions
#############################################
def simulate_strategy(coin_id: str):
    """Simulate a trade decision for a coin."""
    coin = coin_id.lower()
    if coin not in COIN_RANGES:
        return {"error": f"Invalid coin: '{coin_id}'"}
    low, high = COIN_RANGES[coin]
    simulated_price = round(random.uniform(low, high), 2)
    mid = (low + high) / 2
    decision = "BUY" if simulated_price < mid else "SELL"
    return {"decision": decision, "price": simulated_price, "coin": coin}

def simulate_price(coin_id: str):
    """Simulate a price for a coin."""
    coin = coin_id.lower()
    if coin not in COIN_RANGES:
        raise HTTPException(status_code=400, detail=f"Invalid coin: '{coin_id}'")
    low, high = COIN_RANGES[coin]
    simulated_price = round(random.uniform(low, high), 2)
    return {coin: {"usd": simulated_price}}

#############################################
# Live Data Cache Setup
#############################################
cache = {"data": None, "timestamp": 0, "ttl": 300}  # TTL = 300 seconds
COINGECKO_API_MARKETS = "https://api.coingecko.com/api/v3/coins/markets"

#############################################
# /coins Endpoint (Simulation-Aware)
#############################################
@router.get("/coins", tags=["Coins"])
def get_cached_coins():
    """
    In simulation mode, return simulated coin data.
    Otherwise, fetch (or return cached) live data from CoinGecko and add trade indicators.
    """
    if current_mode["mode"] == "simulation":
        simulated_data = []
        for coin, (low, high) in COIN_RANGES.items():
            simulated_price = round(random.uniform(low, high), 2)
            simulated_data.append({
                "id": coin,
                "name": coin.capitalize(),
                "current_price": simulated_price,
                "trade_indicator": simulate_strategy(coin)
            })
        return simulated_data

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

#############################################
# /price Endpoint (Simulation-Aware)
#############################################
@router.get("/price/{coin_id}", tags=["Price"])
def get_price(coin_id: str):
    if current_mode["mode"] == "simulation":
        return simulate_price(coin_id)
    else:
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            resp = requests.get(url, params={"ids": coin_id, "vs_currencies": "usd"}, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Error fetching price: {e}")

#############################################
# /trade Endpoint (Simulation-Aware)
#############################################
@router.get("/trade/{coin_id}", tags=["Trade"])
def trade_decision(coin_id: str):
    if current_mode["mode"] == "simulation":
        result = simulate_strategy(coin_id)
    else:
        result = make_trade_decision(coin_id)
    if result is None or "error" in result:
        raise HTTPException(status_code=400, detail=f"Invalid coin: '{coin_id}'")
    return result

#############################################
# /trading/decision Endpoint (Simulation-Aware)
#############################################
@router.get("/trading/decision/{coin}", tags=["Trading"])
def api_get_decision(coin: str):
    if current_mode["mode"] == "simulation":
        decision = simulate_strategy(coin)
    else:
        decision = make_trade_decision(coin)
    return decision

#############################################
# /mode Endpoints
#############################################
@router.get("/mode", tags=["Mode"])
def get_mode():
    return current_mode

@router.post("/mode", tags=["Mode"])
async def set_mode_endpoint(request: Request):
    global current_mode, cache
    new_mode = await request.json()
    if "mode" in new_mode and new_mode["mode"] in ["simulation", "live"]:
        current_mode["mode"] = new_mode["mode"]
        # Clear cache when switching modes to avoid stale data.
        cache["data"] = None
        cache["timestamp"] = 0
        return current_mode
    raise HTTPException(status_code=400, detail="Invalid mode")

#############################################
# Include the Router with Prefix "/api"
#############################################
app.include_router(router, prefix="/api")

#############################################
# Basic Health Endpoints
#############################################
@app.get("/")
def home():
    return {"message": "HodlBot AI is running!"}

@app.get("/health")
def health_check():
    return {"status": "Server is healthy!"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
