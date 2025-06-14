import MetaTrader5 as mt5
import time
from typing import Optional, List, Dict


ACTIVE_CONNECTIONS = set()
REALTIME_PAIRS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD",
    "NZDUSD", "EURJPY", "GBPJPY", "EURGBP", "AUDCAD", "CADJPY"
]


def convert_symbol_format(pair: str) -> str:
    """Convert standard forex pair to broker-specific format"""
    symbol_mappings = {
        "EURUSD": "EURUSDm",
        "GBPUSD": "GBPUSDm",
        "USDJPY": "USDJPYm",
        "USDCHF": "USDCHFm",
        "AUDUSD": "AUDUSDm",
        "USDCAD": "USDCADm",
        "NZDUSD": "NZDUSDm",
        "EURJPY": "EURJPYm",
        "GBPJPY": "GBPJPYm",
        "EURGBP": "EURGBPm",
        "AUDCAD": "AUDCADm",
        "CADJPY": "CADJPYm",
        "BTCUSD": "BTCUSDm",
    }
    return symbol_mappings.get(pair, pair)


def ensure_symbol_ready(symbol: str) -> bool:
    """Ensure symbol is visible in Market Watch"""
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        print(f"Symbol {symbol} not found.")
        return False

    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            print(f"Failed to select symbol {symbol}.")
            return False
    return True


def get_valid_price(symbol: str, action: str, retries: int = 5) -> float:
    """Get valid price with retry mechanism"""
    for i in range(retries):
        tick = mt5.symbol_info_tick(symbol)
        if tick:
            price = tick.ask if action == "buy" else tick.bid
            if price > 0:
                return price
        print(f"[{symbol}] Waiting for valid price... Retry {i + 1}")
        time.sleep(1)
    return 0.0


def place_trade(order_type: str, symbol: str, action: str, volume: float, price: float, stop_loss: float,
                take_profit: Optional[float] = None) -> dict:
    try:
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return {"success": False, "error": f"Symbol {symbol} not found"}

        if not ensure_symbol_ready(symbol):
            return {"success": False, "error": f"Symbol {symbol} not ready for trading"}

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"success": False, "error": f"Failed to get tick for {symbol}"}

        if symbol_info.volume_min:
            volume = max(volume, symbol_info.volume_min)
        if symbol_info.volume_step:
            volume = round(volume / symbol_info.volume_step) * symbol_info.volume_step

        if order_type == "market":
            order_type_mt5 = mt5.ORDER_TYPE_BUY if action.lower() == "buy" else mt5.ORDER_TYPE_SELL
            trade_action = mt5.TRADE_ACTION_DEAL
            price_for_order = tick.ask if action == "buy" else tick.bid
            request = {
                "action": trade_action,
                "symbol": symbol,
                "volume": volume,
                "type": order_type_mt5,
                "price": price_for_order,
                "deviation": 20,
                "magic": 234000,
                "comment": f"Automated {order_type} trade via API",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_FOK,
            }
        else:
            if action.lower() == "buy":
                order_type_mt5 = mt5.ORDER_TYPE_BUY_LIMIT
                if price >= tick.ask:
                    return {"success": False,
                            "error": f"Buy limit price ({price}) must be below current ask ({tick.ask})"}
            else:
                order_type_mt5 = mt5.ORDER_TYPE_SELL_LIMIT
                if price <= tick.bid:
                    return {"success": False,
                            "error": f"Sell limit price ({price}) must be above current bid ({tick.bid})"}

            trade_action = mt5.TRADE_ACTION_PENDING
            filling_mode = symbol_info.filling_mode
            if filling_mode & mt5.ORDER_FILLING_FOK:
                type_filling = mt5.ORDER_FILLING_FOK
            elif filling_mode & mt5.ORDER_FILLING_IOC:
                type_filling = mt5.ORDER_FILLING_IOC
            else:
                type_filling = mt5.ORDER_FILLING_RETURN

            request = {
                "action": trade_action,
                "symbol": symbol,
                "volume": volume,
                "type": order_type_mt5,
                "price": price,
                "deviation": 20,
                "magic": 234000,
                "comment": f"Automated {order_type} trade via API",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": type_filling,
            }

        if stop_loss > 0:
            request["sl"] = stop_loss
        if take_profit and take_profit > 0:
            request["tp"] = take_profit

        result = mt5.order_send(request)
        if result is None:
            error = mt5.last_error()
            return {"success": False, "error": f"order_send() failed: {error}"}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "success": False,
                "error": f"Trade failed: retcode={result.retcode}, comment={result.comment}"
            }

        return {
            "success": True,
            "order_id": result.order,
            "volume": result.volume,
            "price": result.price,
            "order_type": order_type
        }

    except Exception as e:
        return {"success": False, "error": f"Exception in place_trade: {str(e)}"}


def modify_position_sl_tp(position_ticket: int, symbol: str, new_sl: Optional[float], new_tp: Optional[float]) -> dict:
    try:
        positions = mt5.positions_get(ticket=position_ticket)
        if not positions:
            return {"success": False, "error": f"No position found with ticket {position_ticket}"}

        position = positions[0]
        current_sl = position.sl
        current_tp = position.tp

        if new_sl is not None:
            if (position.type == mt5.POSITION_TYPE_BUY and new_sl >= position.price_open) or \
               (position.type == mt5.POSITION_TYPE_SELL and new_sl <= position.price_open):
                return {"success": False, "error": "Invalid stop loss level"}

        if new_tp is not None:
            if (position.type == mt5.POSITION_TYPE_BUY and new_tp <= position.price_open) or \
               (position.type == mt5.POSITION_TYPE_SELL and new_tp >= position.price_open):
                return {"success": False, "error": "Invalid take profit level"}

        updated_sl = new_sl if new_sl is not None else current_sl
        updated_tp = new_tp if new_tp is not None else current_tp

        modify_request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": position_ticket,
            "symbol": symbol,
            "sl": updated_sl,
            "tp": updated_tp,
            "magic": 234000,
            "comment": "Modify SL/TP via API",
        }

        result = mt5.order_send(modify_request)
        if result is None:
            error = mt5.last_error()
            return {"success": False, "error": f"modify failed: {error}"}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "success": False,
                "error": f"Modify failed: retcode={result.retcode}, comment={result.comment}"
            }

        return {
            "success": True,
            "ticket": position_ticket,
            "new_sl": updated_sl,
            "new_tp": updated_tp
        }

    except Exception as e:
        return {"success": False, "error": f"Exception in modify_position: {str(e)}"}


def close_position_by_ticket(position_ticket: int) -> dict:
    try:
        positions = mt5.positions_get(ticket=position_ticket)
        if not positions:
            return {"success": False, "error": f"No position found with ticket {position_ticket}"}

        position = positions[0]
        symbol = position.symbol
        volume = position.volume
        deviation = 10
        profit = position.profit

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"success": False, "error": f"Failed to get tick for {symbol}"}

        if position.type == mt5.POSITION_TYPE_BUY:
            order_type = mt5.ORDER_TYPE_SELL
            price = tick.bid
        else:
            order_type = mt5.ORDER_TYPE_BUY
            price = tick.ask

        close_request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "position": position_ticket,
            "price": price,
            "deviation": deviation,
            "magic": 234000,
            "comment": "Close position via API",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_FOK,
        }

        result = mt5.order_send(close_request)
        if result is None:
            error = mt5.last_error()
            return {"success": False, "error": f"close failed: {error}"}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "success": False,
                "error": f"Close failed: retcode={result.retcode}, comment={result.comment}"
            }

        return {
            "success": True,
            "ticket": position_ticket,
            "closed_volume": result.volume,
            "profit": profit
        }

    except Exception as e:
        return {"success": False, "error": f"Exception in close_position: {str(e)}"}


def modify_order(order_ticket: int, symbol: str, new_sl: Optional[float], new_tp: Optional[float]) -> dict:
    try:
        order = mt5.orders_get(ticket=order_ticket)
        if not order:
            return {"success": False, "error": f"No order found with ticket {order_ticket}"}

        order = order[0]
        current_sl = order.sl
        current_tp = order.tp

        updated_sl = new_sl if new_sl is not None else current_sl
        updated_tp = new_tp if new_tp is not None else current_tp

        modify_request = {
            "action": mt5.TRADE_ACTION_MODIFY,
            "order": order_ticket,
            "symbol": symbol,
            "sl": updated_sl,
            "tp": updated_tp,
            "magic": 234000,
            "comment": "Modify order via API",
        }

        result = mt5.order_send(modify_request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {"success": False, "error": f"Modify failed: {result.comment}"}

        return {"success": True, "ticket": order_ticket}

    except Exception as e:
        return {"success": False, "error": f"Exception in modify_order: {str(e)}"}


def delete_order(order_ticket: int) -> dict:
    try:
        delete_request = {
            "action": mt5.TRADE_ACTION_REMOVE,
            "order": order_ticket,
            "comment": "Delete order via API",
        }

        result = mt5.order_send(delete_request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {"success": False, "error": f"Delete failed: {result.comment}"}

        return {"success": True, "ticket": order_ticket}

    except Exception as e:
        return {"success": False, "error": f"Exception in delete_order: {str(e)}"}


# Helper to map session data to active positions

def get_active_positions_for_session(session_id: str, trade_sessions: dict) -> List[Dict]:
    session_data = trade_sessions.get(session_id)
    if not session_data:
        return []

    active_positions = []
    for account_result in session_data.get("results", []):
        if account_result["result"]["success"]:
            active_positions.append({
                "account": account_result["account"],
                "ticket": account_result["result"]["order_id"],
                "symbol": session_data["trade_details"]["symbol"]
            })
    return active_positions
