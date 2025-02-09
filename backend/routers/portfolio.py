from fastapi import APIRouter
from models.portfolio import Portfolio
from utils.coingecko import get_price_from_api

router = APIRouter()

@router.get("/portfolio")
def get_portfolio():
    holdings = Portfolio.get_holdings()
    coin_ids = ",".join(holdings.keys())
    price_data = get_price_from_api(coin_ids)

    portfolio_summary = []
    total_value = 0
    for coin, quantity in holdings.items():
        price = price_data.get(coin, {}).get("usd", 0)
        value = quantity * price
        portfolio_summary.append({"coin": coin, "quantity": quantity, "price": price, "value": value})
        total_value += value

    return {"portfolio": portfolio_summary, "total_value": total_value}
