from fastapi import APIRouter, HTTPException
from backend.models.trade import TradeRequest
from backend.models.transactions import Transaction, TransactionHistory
from backend.models.portfolio import Portfolio
from backend.utils.coingecko import get_price_from_api

router = APIRouter()

@router.post("/trade")
def trade(request: TradeRequest):
    price_data = get_price_from_api(request.coin_id)
    price = price_data.get(request.coin_id, {}).get("usd")

    if not price:
        raise HTTPException(status_code=400, detail=f"Invalid coin ID: {request.coin_id}")

    quantity = request.amount / price

    if request.action == "buy":
        Portfolio.update_holding(request.coin_id, quantity)
    elif request.action == "sell":
        if Portfolio.holdings.get(request.coin_id, 0) < quantity:
            raise HTTPException(status_code=400, detail=f"Not enough {request.coin_id} to sell.")
        Portfolio.update_holding(request.coin_id, -quantity)
    else:
        raise HTTPException(status_code=400, detail="Action must be 'buy' or 'sell'.")

    transaction = Transaction(request.coin_id, request.action, request.amount, price)
    TransactionHistory.add_transaction(transaction)

    return {"message": f"{request.action.capitalize()} successful", "transaction": transaction.__dict__}
