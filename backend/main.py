from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import logging
import asyncio
import threading
import os
import uvicorn

# Import your existing modules
from backend.ai.strategy import make_trade_decision
from backend.ai.automation import (
    start_automated_trading,
    stop_automated_trading,
    trading_states
)
from backend.routers import coins, trade, transactions, portfolio

#############################################
# Logging Setup (optional)
#############################################
logging.basicConfig(
    filename="trading.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

#############################################
# Create FastAPI app
#############################################
app = FastAPI()
router = APIRouter()

#############################################
# CORS Configuration
#############################################
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

#############################################
# Separate Event Loop for Automated Trading
#############################################
loop = asyncio.new_event_loop()
threading.Thread(target=loop.run_forever, daemon=True).start()

#############################################
# Example: Coin Data / Proxies / etc.
#############################################
COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

@router.get("/coins", tags=["Coins"])
async def get_cached_coins():
    if "data" not in cache:
        return JSONResponse(content={"error": "No cached data"}, status_code=404)
    response = JSONResponse(content=cache["data"])
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@router.get("/proxy/coins")
async def proxy_coins():
    """Fetch CoinGecko data through FastAPI to bypass CORS & rate limits."""
    try:
        response = requests.get(
            COINGECKO_API,
            params={"vs_currency": "usd", "order": "market_cap_desc", "per_page": 100},
            timeout=10,
            headers={"User-Agent": "HodlBot/1.0"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"CoinGecko API Error: {str(e)}")

app.include_router(coins.router)
app.include_router(trade.router)
app.include_router(transactions.router)
app.include_router(portfolio.router)

#############################################
# Basic Health / Home
#############################################
@app.get("/")
def home():
    return {"message": "HodlBot AI is running!"}

@app.get("/health")
def health_check():
    return {"status": "Server is healthy!"}

#############################################
# Price & Trade Endpoints
#############################################
@app.get("/price/{coin_id}")
def get_price(coin_id: str):
    """Fetch a single coin price from CoinGecko."""
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price"
        resp = requests.get(url, params={"ids": coin_id, "vs_currencies": "usd"}, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price: {e}")

@app.get("/trade/{coin_id}")
def trade_decision(coin_id: str):
    """Return an immediate trade decision from your AI strategy."""
    result = make_trade_decision(coin_id)
    if result is None or "error" in result:
        raise HTTPException(status_code=400, detail=f"Invalid coin: '{coin_id}'")
    return result

#############################################
# Automated Trading Routes (NEW)
#############################################
@app.post("/api/trading/start")
async def api_start_auto_trading(
    data: dict = Body(...),
    background_tasks: BackgroundTasks = None
):
    """
    Start automated trading for a coin (e.g. {"coin": "BITCOIN"}).
    """
    coin = data.get("coin")
    if not coin:
        raise HTTPException(status_code=400, detail="No coin provided.")

    if trading_states.get(coin):
        raise HTTPException(status_code=400, detail=f"Automated trading for {coin} is already running.")

    # Schedule the coroutine on our separate event loop
    background_tasks.add_task(start_automated_trading, coin)
    logging.info(f"Automated trading started for {coin}")
    return {"status": "started", "coin": coin}

@app.post("/api/trading/stop")
def api_stop_auto_trading(data: dict = Body(...)):
    """
    Stop automated trading for a coin (e.g. {"coin": "BITCOIN"}).
    """
    coin = data.get("coin")
    if not coin:
        raise HTTPException(status_code=400, detail="No coin provided.")

    if not trading_states.get(coin):
        raise HTTPException(status_code=400, detail=f"Automated trading for {coin} is not running.")

    stop_automated_trading(coin)
    logging.info(f"Automated trading stopped for {coin}")
    return {"status": "stopped", "coin": coin}

@app.get("/api/trading/decision/{coin}")
def api_get_decision(coin: str):
    """
    Return the AI trade decision for a coin (e.g. /api/trading/decision/BITCOIN).
    """
    decision = make_trade_decision(coin)
    logging.info(f"Decision for {coin}: {decision}")
    return decision

#############################################
# Startup
#############################################
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
