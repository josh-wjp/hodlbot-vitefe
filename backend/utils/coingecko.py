import requests
from fastapi import HTTPException

COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

def get_price_from_api(coin_id: str):
    try:
        response = requests.get(f"{COINGECKO_API}?ids={coin_id}&vs_currencies=usd", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching price from API: {e}")
