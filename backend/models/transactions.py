from typing import List
from datetime import datetime

class Transaction:
    def __init__(self, coin_id: str, action: str, amount: float, price: float):
        self.coin_id = coin_id
        self.action = action
        self.amount = amount
        self.price = price
        self.timestamp = datetime.utcnow()

class TransactionHistory:
    transactions: List[Transaction] = []

    @classmethod
    def add_transaction(cls, transaction: Transaction):
        cls.transactions.append(transaction)

    @classmethod
    def get_transactions(cls):
        return cls.transactions
