import os
import subprocess

NEAR_ACCOUNT = os.getenv("NEAR_ACCOUNT", "your-near-testnet-account")

def execute_near_transaction(action="buy"):
    """Mock NEAR transaction execution."""
    try:
        cmd = f"near call {NEAR_ACCOUNT} someContract {action} --accountId {NEAR_ACCOUNT}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return {"status": "success", "output": result.stdout}
    except Exception as e:
        return {"status": "error", "message": str(e)}
