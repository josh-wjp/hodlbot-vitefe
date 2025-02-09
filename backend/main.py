from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from backend.ai.strategy import make_trade_decision
from backend.routers import trade, transactions, portfolio
from backend.ai.automation import start_automated_trading, stop_automated_trading, trading_states
import requests

app = FastAPI()

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hodlbot.wjp.ai", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

app.include_router(trade.router)
app.include_router(transactions.router)
app.include_router(portfolio.router)

@app.get("/")
def home():
    return {"message": "HodlBot AI is running!"}

@app.get("/price/{coin_id}")
def get_price(coin_id: str):
    try:
        response = requests.get(f"{COINGECKO_API}?ids={coin_id}&vs_currencies=usd", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price: {e}")

@app.get("/trade/{coin_id}")
def trade_decision(coin_id: str):
    result = make_trade_decision(coin_id)
    if result is None or "error" in result:
        raise HTTPException(status_code=400, detail=f"Invalid coin: '{coin_id}'")
    return result

@app.get("/health")
def health_check():
    return {"status": "Server is healthy!"}

@app.post("/automation/start/{crypto}")
async def start_automation(crypto: str, background_tasks: BackgroundTasks):
    if trading_states.get(crypto):
        raise HTTPException(status_code=400, detail=f"Automated trading for {crypto} is already running.")

    background_tasks.add_task(start_automated_trading, crypto)
    return {"message": f"Automated trading started for {crypto}"}

@app.post("/automation/stop/{crypto}")
def stop_automation(crypto: str):
    if not trading_states.get(crypto):
        raise HTTPException(status_code=400, detail=f"Automated trading for {crypto} is not running.")
    stop_automated_trading(crypto)
    return {"message": f"Automated trading stopped for {crypto}"}

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
