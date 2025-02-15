import time
import random
import requests
import pandas as pd
from fastapi import FastAPI, APIRouter, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.ai.strategy import make_trade_decision  # Live strategy logic

app = FastAPI()

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
current_mode = {"mode": "live"}  # Default to live mode
# Uncomment the following line to force simulation mode for debugging:
# current_mode["mode"] = "simulation"

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
    coin = coin_id.lower()
    if coin not in COIN_RANGES:
        return {"error": f"Invalid coin: '{coin_id}'"}
    low, high = COIN_RANGES[coin]
    simulated_price = round(random.uniform(low, high), 2)
    mid = (low + high) / 2
    decision = "BUY" if simulated_price < mid else "SELL"
    return {"decision": decision, "price": simulated_price, "coin": coin}

def simulate_price(coin_id: str):
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
# /coins Endpoint (Simulation-Aware with Fallback)
#############################################
@router.get("/coins", tags=["Coins"])
def get_cached_coins():
    # Log the current mode for debugging.
    print("Current mode:", current_mode["mode"])

    # If in simulation mode, always return simulated data.
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

    # Otherwise (live mode), try to return live data using caching.
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

        # For each coin, add a trade indicator using the live strategy.
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
        print("Error fetching live data:", e)
        # In live mode, do not fallback to simulation; instead, raise an error.
        raise HTTPException(status_code=500, detail=f"Error fetching live data: {e}")

#############################################
# Other Endpoints (unchanged)
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

@router.get("/trade/{coin_id}", tags=["Trade"])
def trade_decision(coin_id: str):
    if current_mode["mode"] == "simulation":
        result = simulate_strategy(coin_id)
    else:
        result = make_trade_decision(coin_id)
    if result is None or "error" in result:
        raise HTTPException(status_code=400, detail=f"Invalid coin: '{coin_id}'")
    return result

@router.get("/trading/decision/{coin}", tags=["Trading"])
def api_get_decision(coin: str):
    if current_mode["mode"] == "simulation":
        decision = simulate_strategy(coin)
    else:
        decision = make_trade_decision(coin)
    return decision

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

@router.post("/trading/start", tags=["Trading"])
async def start_auto_trading(data: dict = Body(...)):
    coin = data.get("coin")
    if not coin:
        raise HTTPException(status_code=400, detail="No coin provided.")
    return {"status": "started", "coin": coin}

@router.post("/trading/stop", tags=["Trading"])
async def stop_auto_trading(data: dict = Body(...)):
    coin = data.get("coin")
    if not coin:
        raise HTTPException(status_code=400, detail="No coin provided.")
    return {"status": "stopped", "coin": coin}

#############################################
# Apply Trading Strategy
#############################################

@router.post("/trading/applyStrategy", tags=["Trading"])
async def apply_strategy(request: Request):
    """
    Apply an auto-trading strategy for a specific coin.
    """
    data = await request.json()
    coin = data.get("coin")
    strategy = data.get("strategy", {})

    if not coin:
        raise HTTPException(status_code=400, detail="Coin is required.")

    # Extract strategy parameters with defaults
    profit_threshold = strategy.get("profitThreshold", 5)  # Default 5%
    max_loss = strategy.get("maxLoss", 10)  # Default 10%
    trade_frequency = strategy.get("tradeFrequency", 15)  # Default 15 minutes
    sma_window = strategy.get("smaWindow", 5)  # Default SMA-5
    rsi_window = strategy.get("rsiWindow", 14)  # Default RSI-14
    bollinger_window = strategy.get("bollingerWindow", 20)  # Default Bollinger Bands
    adx_threshold = strategy.get("adxThreshold", 25)  # Default ADX-25

    # Log strategy for debugging
    print(f"Applying strategy for {coin}:")
    print(f"  Profit Threshold: {profit_threshold}%")
    print(f"  Max Loss: {max_loss}%")
    print(f"  Trade Frequency: {trade_frequency} minutes")
    print(f"  SMA Window: {sma_window}")
    print(f"  RSI Window: {rsi_window}")
    print(f"  Bollinger Bands Window: {bollinger_window}")
    print(f"  ADX Threshold: {adx_threshold}")

    # Example: Save the strategy to a database or memory (if needed)
    # strategies[coin] = strategy

    return {"status": "success", "strategy": strategy}

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
