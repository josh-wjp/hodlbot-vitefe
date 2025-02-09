import asyncio
from backend.ai.strategy import make_trade_decision

# Global variable to control the trading loop
trading_active = {}

async def start_automated_trading(crypto: str):
    """Start the automated trading for a specific cryptocurrency."""
    global trading_active
    trading_active[crypto] = True
    print(f"🚀 Automated trading started for {crypto}.")

    while trading_active.get(crypto, False):
        try:
            # Fetch trade decision
            decision = make_trade_decision(crypto)
            if "error" in decision:
                print(f"⚠️ Error for {crypto}: {decision['error']}")
            else:
                print(f"📈 Trade Decision for {crypto}: {decision}")

                # Simulate buy/sell actions based on the decision
                if decision["decision"] == "BUY":
                    print(f"✅ Buying {crypto} at ${decision['price']}")
                elif decision["decision"] == "SELL":
                    print(f"✅ Selling {crypto} at ${decision['price']}")
                else:
                    print(f"🤝 Holding {crypto}")
        except Exception as e:
            print(f"⚠️ Trading error for {crypto}: {e}")

        # Sleep for a trading interval
        await asyncio.sleep(60)  # 60 seconds interval

    print(f"⛔ Trading loop stopped for {crypto}.")

def stop_automated_trading(crypto: str):
    """Stop the automated trading for a specific cryptocurrency."""
    global trading_active
    if trading_active.get(crypto):
        trading_active[crypto] = False
        print(f"⛔ Automated trading stopped for {crypto}.")
