from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware #//leave CORS code for dev testing, Azure manages in Prod
from backend.ai.strategy import make_trade_decision  # Import your existing code
import requests

app = FastAPI()

#//leave CORS code for dev testing, Azure manages in Prod
#//Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hodlbot.wjp.ai", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

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

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
