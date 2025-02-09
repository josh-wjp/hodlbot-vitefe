class Portfolio:
    holdings = {}

    @classmethod
    def update_holding(cls, coin_id: str, quantity: float):
        cls.holdings[coin_id] = cls.holdings.get(coin_id, 0) + quantity
        if cls.holdings[coin_id] < 0:
            cls.holdings[coin_id] = 0

    @classmethod
    def get_holdings(cls):
        return cls.holdings
