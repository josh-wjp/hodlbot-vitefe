import pytest
from backend.ai.automation import start_automated_trading, stop_automated_trading, trading_states

@pytest.mark.asyncio
async def test_start_automated_trading():
    await start_automated_trading("bitcoin")
    assert trading_states["bitcoin"] is True

    await start_automated_trading("ethereum")
    assert trading_states["ethereum"] is True

@pytest.mark.asyncio
async def test_stop_automated_trading():
    await start_automated_trading("dogecoin")
    assert trading_states["dogecoin"] is True

    stop_automated_trading("dogecoin")
    assert trading_states["dogecoin"] is False

def test_invalid_stop_trading():
    stop_automated_trading("invalidcoin")
    assert "invalidcoin" not in trading_states
