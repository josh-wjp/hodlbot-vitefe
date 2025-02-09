from pydantic import BaseModel

class TradeRequest(BaseModel):
    coin_id: str
    action: str  # "buy" or "sell"
    amount: float
