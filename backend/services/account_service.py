import MetaTrader5 as mt5
import time
from typing import Optional, Dict, Any
from .trade_service import (
    ensure_symbol_ready,
    get_valid_price,
    place_trade,
    modify_position_sl_tp,
    modify_order,
    close_position_by_ticket,
    delete_order,
)


ACCOUNTS_CONFIG = [
    {
        "account": 273162078,
        "password": "Carboncraft@333",
        "server": "Exness-MT5Trial6",
        "volume": 0.1,
    },
    {
        "account": 204797825,
        "password": "Carboncraft@333",
        "server": "Exness-MT5Trial7",
        "volume": 0.1,
    },
]


def execute_for_account(account_config: dict, operation: str, **kwargs) -> Dict[str, Any]:
    try:
        if not mt5.initialize(login=account_config["account"],
                              password=account_config["password"],
                              server=account_config["server"]):
            error = mt5.last_error()
            return {"success": False, "error": f"Login failed for account {account_config['account']}: {error}"}

        time.sleep(1)

        if operation == "trade":
            symbol = kwargs.get("symbol")
            if not ensure_symbol_ready(symbol):
                mt5.shutdown()
                return {"success": False, "error": f"Symbol {symbol} not ready for trading"}

            if kwargs.get("entry_price") is None:
                price = get_valid_price(symbol, kwargs.get("action"))
                if price == 0.0:
                    mt5.shutdown()
                    return {"success": False, "error": f"Failed to get valid price for {symbol}"}
            else:
                price = kwargs.get("entry_price")

            result = place_trade(
                order_type=kwargs.get("order_type"),
                symbol=symbol,
                action=kwargs.get("action"),
                volume=account_config["volume"],
                price=price,
                stop_loss=kwargs.get("stop_loss"),
                take_profit=kwargs.get("take_profit"),
            )

        elif operation == "modify":
            if kwargs.get("entry_type") == "position":
                result = modify_position_sl_tp(
                    position_ticket=kwargs.get("ticket"),
                    symbol=kwargs.get("symbol"),
                    new_sl=kwargs.get("new_sl"),
                    new_tp=kwargs.get("new_tp"),
                )
            else:
                result = modify_order(
                    order_ticket=kwargs.get("ticket"),
                    symbol=kwargs.get("symbol"),
                    new_sl=kwargs.get("new_sl"),
                    new_tp=kwargs.get("new_tp"),
                )

        elif operation == "close":
            if kwargs.get("entry_type") == "position":
                result = close_position_by_ticket(kwargs.get("ticket"))
            else:
                result = delete_order(kwargs.get("ticket"))
        else:
            result = {"success": False, "error": f"Unknown operation: {operation}"}

        mt5.shutdown()
        return result

    except Exception as e:
        mt5.shutdown()
        return {"success": False, "error": f"Exception in execute_for_account: {str(e)}"}
