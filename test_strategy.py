import pytest
from backend.ai.strategy import calculate_stop_loss_and_take_profit

def test_calculate_stop_loss_and_take_profit():
    """
    Test the calculation of stop-loss and take-profit prices.
    """
    price = 100.0
    stop_loss_percent = 5
    take_profit_percent = 10

    stop_loss, take_profit = calculate_stop_loss_and_take_profit(price, stop_loss_percent, take_profit_percent)

    # Assertions to validate the results
    assert stop_loss == 95.0, f"Expected stop-loss to be 95.0, got {stop_loss}"
    assert take_profit == 110.0, f"Expected take-profit to be 110.0, got {take_profit}"

    print("✅ Stop-loss and take-profit calculations are correct.")
