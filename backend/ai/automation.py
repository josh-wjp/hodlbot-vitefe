import logging
import asyncio
from backend.ai.strategy import make_trade_decision, calculate_stop_loss_and_take_profit

# Configure logging
logging.basicConfig(
    filename="trading.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Define a global trading_states dictionary to track trading status per cryptocurrency
trading_states = {}

async def start_automated_trading(crypto):
    """Start automated trading for a specific cryptocurrency."""
    if trading_states.get(crypto):
        logging.warning(f"Automated trading for {crypto} is already running.")
        return

    trading_states[crypto] = True
    logging.info(f"Automated trading started for {crypto}.")

    while trading_states[crypto]:
        try:
            # Fetch trade decision
            decision = make_trade_decision(crypto)
            if "error" in decision:
                logging.error(f"Error for {crypto}: {decision['error']}")
            else:
                logging.info(f"Trade Decision for {crypto}: {decision}")
                if decision["decision"] == "BUY":
                    logging.info(f"✅ Buying {crypto} at ${decision['price']} - {decision.get('reason', '')}")
                elif decision["decision"] == "SELL":
                    logging.info(f"✅ Selling {crypto} at ${decision['price']} - {decision.get('reason', '')}")
                else:
                    logging.info(f"🤝 Holding {crypto}")
        except Exception as e:
            logging.error(f"Trading error for {crypto}: {e}")

        # Wait for 60 seconds before the next decision
        await asyncio.sleep(60)

def stop_automated_trading(crypto):
    """Stop automated trading for a specific cryptocurrency."""
    if not trading_states.get(crypto):
        logging.warning(f"Automated trading for {crypto} is not running.")
        return

    trading_states[crypto] = False
    logging.info(f"Automated trading stopped for {crypto}.")
