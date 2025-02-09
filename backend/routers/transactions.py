from fastapi import APIRouter
from backend.models.transactions import TransactionHistory

router = APIRouter()

@router.get("/transactions")
def get_transactions():
    return {"transactions": [tx.__dict__ for tx in TransactionHistory.get_transactions()]}
