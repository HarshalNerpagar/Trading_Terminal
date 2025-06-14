
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import MetaTrader5 as mt5
import time
import os
from typing import Optional, List, Dict, Any
import json
from datetime import datetime
from datetime import timedelta
import threading
import time as t
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# In-memory storage for trade tracking
trade_sessions = {}
trade_history = {}
EXPIRATION_HOURS = 24  # Sessions expire after 24 hours


def clean_expired_sessions():
    while True:
        now = datetime.now()
        expired = []

        for session_id, session_data in list(trade_sessions.items()):  # Use list to avoid runtime mutation
            created = datetime.fromisoformat(session_data["timestamp"])
            if (now - created) > timedelta(hours=EXPIRATION_HOURS):
                expired.append(session_id)

        for session_id in expired:
            session_data = trade_sessions[session_id]
            # Calculate actual profit instead of setting to 0
            total_profit = 0.0
            account_profits = []

            for account_result in session_data["results"]:
                if account_result["result"]["success"]:
                    # Attempt to close position and capture profit
                    entry_type = account_result["result"].get("entry_type", "position")
                    if entry_type == "position":
                        close_result = close_position_by_ticket(account_result["result"]["order_id"])
                    else:  # It's an order
                        delete_result = delete_order(account_result["result"]["order_id"])
                        # Add to profits as 0 since it's not filled
                        account_profits.append({
                            "account": account_result["account"],
                            "profit": 0.0
                        })
                    if close_result["success"]:
                        profit = close_result.get("profit", 0)
                        total_profit += profit
                        account_profits.append({
                            "account": account_result["account"],
                            "profit": profit
                        })

            trade_history[session_id] = {
                **session_data,
                "closing_time": now.isoformat(),
                "total_profit": total_profit,
                "account_profits": account_profits,
                "expired": True
            }
            del trade_sessions[session_id]

        t.sleep(3600)  # Run every hour

# Start the cleanup thread
cleanup_thread = threading.Thread(target=clean_expired_sessions, daemon=True)
cleanup_thread.start()


class TradeRequest(BaseModel):
    pair: str
    action: str  # "buy" or "sell"
    risk_percent: float
    order_type: str  # "market" or "limit"
    stop_loss: float
    target_level: Optional[float] = None
    entry_price: Optional[float] = None

    @validator("action")
    def action_must_be_buy_or_sell(cls, v):
        if v.lower() not in ("buy", "sell"):
            raise ValueError("action must be 'buy' or 'sell'")
        return v.lower()

    @validator("order_type")
    def order_type_must_be_valid(cls, v):
        if v.lower() not in ("market", "limit"):
            raise ValueError("order_type must be 'market' or 'limit'")
        return v.lower()

    @validator("risk_percent")
    def risk_percent_must_be_valid(cls, v):
        if v <= 0 or v > 10:
            raise ValueError("risk_percent must be between 0 and 10")
        return v


class ModifyRequest(BaseModel):
    session_id: str
    new_sl: Optional[float] = None
    new_tp: Optional[float] = None

    @validator("new_sl", "new_tp", pre=True, allow_reuse=True)
    def validate_prices(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price values must be positive")
        return v


class CloseRequest(BaseModel):
    session_id: str


# Account configurations
ACCOUNTS_CONFIG = [
    {
        "account": 273162078,
        "password": "Carboncraft@333",
        "server": "Exness-MT5Trial6",
        "volume": 0.1
    },
    {
        "account": 204797825,
        "password": "Carboncraft@333",
        "server": "Exness-MT5Trial7",
        "volume": 0.1
    },
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

# Add after account configurations
ACTIVE_CONNECTIONS = set()
REALTIME_PAIRS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD",
    "NZDUSD", "EURJPY", "GBPJPY", "EURGBP", "AUDCAD", "CADJPY"
]



def ensure_symbol_ready(symbol: str) -> bool:
    """Ensure symbol is visible in Market Watch"""
    symbol_info = mt5.symbol_info(symbol)
    if symbol_info is None:
        logger.error("Symbol %s not found.", symbol)
        return False

    if not symbol_info.visible:
        if not mt5.symbol_select(symbol, True):
            logger.error("Failed to select symbol %s.", symbol)
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
        logger.info("[%s] Waiting for valid price... Retry %s", symbol, i + 1)
        time.sleep(1)
    return 0.0


# Updated place_trade function with proper limit order handling
from typing import Optional


def place_trade(order_type: str, symbol: str, action: str, volume: float, price: float, stop_loss: float,
                take_profit: Optional[float] = None  ) -> dict:
    try:
        # Check symbol info
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return {"success": False, "error": f"Symbol {symbol} not found"}

        # Ensure symbol is visible and selected
        if not ensure_symbol_ready(symbol):
            return {"success": False, "error": f"Symbol {symbol} not ready for trading"}

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"success": False, "error": f"Failed to get tick for {symbol}"}

        # Normalize volume according to symbol specs
        if symbol_info.volume_min:
            volume = max(volume, symbol_info.volume_min)
        if symbol_info.volume_step:
            volume = round(volume / symbol_info.volume_step) * symbol_info.volume_step

        if order_type == "market":

            # Market order execution
            order_type_mt5 = mt5.ORDER_TYPE_BUY if action.lower() == "buy" else mt5.ORDER_TYPE_SELL
            trade_action = mt5.TRADE_ACTION_DEAL
            price_for_order = tick.ask if action == "buy" else tick.bid  # Use current market price

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

            # Limit order execution
            if action.lower() == "buy":
                order_type_mt5 = mt5.ORDER_TYPE_BUY_LIMIT
                # Validate buy limit price is below current ask
                if price >= tick.ask:
                    return {"success": False,
                            "error": f"Buy limit price ({price}) must be below current ask ({tick.ask})"}
            else:
                order_type_mt5 = mt5.ORDER_TYPE_SELL_LIMIT
                # Validate sell limit price is above current bid
                if price <= tick.bid:
                    return {"success": False,
                            "error": f"Sell limit price ({price}) must be above current bid ({tick.bid})"}

            trade_action = mt5.TRADE_ACTION_PENDING

            # Detect supported filling mode
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

            logger.debug("Request: %s", request)

        # Add SL and TP if valid
        if stop_loss > 0:
            request["sl"] = stop_loss
        if take_profit and take_profit > 0:
            request["tp"] = take_profit

        logger.info("Sending %s trade request: %s", order_type, request)
        check = mt5.order_check(request)
        # if not check or check.retcode != mt5.TRADE_RETCODE_DONE:
        #     return {
        #         "success": False,
        #         "error": f"Order check failed: {check.comment if check else 'Unknown error'}"
        #     }
        result = mt5.order_send(request)
        logger.debug(result)
        # modify_request the result as a dictionary and display it element by element
        result_dict = result._asdict()
        logger.debug("Result dict: %s", result_dict)
        for field in result_dict.keys():
            logger.debug("   %s=%s", field, result_dict[field])
            # if this is a trading modify_request structure, display it element by element as well
            if field == "modify_request":
                trademodify_request_dict = result_dict[field]._asdict()
                for tradereq_filed in trademodify_request_dict:
                    logger.debug(
                        "       trademodify_request: %s=%s",
                        tradereq_filed,
                        trademodify_request_dict[tradereq_filed],
                    )

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
    """Modify position stop loss and take profit with current values preservation"""
    try:
        positions = mt5.positions_get(ticket=position_ticket)
        if not positions:
            return {"success": False, "error": f"No position found with ticket {position_ticket}"}

        position = positions[0]
        current_sl = position.sl
        current_tp = position.tp

        # Validate new prices against current position
        if new_sl is not None:
            if (position.type == mt5.POSITION_TYPE_BUY and new_sl >= position.price_open) or \
               (position.type == mt5.POSITION_TYPE_SELL and new_sl <= position.price_open):
                return {"success": False, "error": "Invalid stop loss level"}

        if new_tp is not None:
            if (position.type == mt5.POSITION_TYPE_BUY and new_tp <= position.price_open) or \
               (position.type == mt5.POSITION_TYPE_SELL and new_tp >= position.price_open):
                return {"success": False, "error": "Invalid take profit level"}

        # Preserve existing values if not provided
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
    """Close position by ticket number"""
    try:
        # Get the position by ticket
        positions = mt5.positions_get(ticket=position_ticket)
        if not positions:
            return {"success": False, "error": f"No position found with ticket {position_ticket}"}

        position = positions[0]
        symbol = position.symbol
        volume = position.volume
        deviation = 10
        profit = position.profit

        # Get current tick price
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"success": False, "error": f"Failed to get tick for {symbol}"}

        # Determine opposite order type to close the position
        if position.type == mt5.POSITION_TYPE_BUY:
            order_type = mt5.ORDER_TYPE_SELL
            price = tick.bid
        else:  # POSITION_TYPE_SELL
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
            "profit": profit  # Return captured profit
        }

    except Exception as e:
        return {"success": False, "error": f"Exception in close_position: {str(e)}"}


def execute_for_account(account_config: dict, operation: str, **kwargs) -> dict:
    """Execute operation for a specific account"""
    try:
        # Login to account
        if not mt5.initialize(login=account_config["account"],
                              password=account_config["password"],
                              server=account_config["server"]):
            error = mt5.last_error()
            return {"success": False, "error": f"Login failed for account {account_config['account']}: {error}"}

        time.sleep(1)  # Let terminal sync

        if operation == "trade":
            symbol = kwargs.get("symbol")
            if not ensure_symbol_ready(symbol):
                mt5.shutdown()
                return {"success": False, "error": f"Symbol {symbol} not ready for trading"}

            # Get price for market orders
            if kwargs.get("entry_price") is None:
                price = get_valid_price(symbol, kwargs.get("action"))
                if price == 0.0:
                    mt5.shutdown()
                    return {"success": False, "error": f"Failed to get valid price for {symbol}"}
            else:
                price = kwargs.get("entry_price")

            result = place_trade(
                symbol=symbol,
                action=kwargs.get("action"),
                volume=account_config["volume"],
                price=price,
                stop_loss=kwargs.get("stop_loss"),
                take_profit=kwargs.get("take_profit"),
                order_type=kwargs.get("order_type")
            )


        elif operation == "modify":

            if kwargs.get("entry_type") == "position":

                result = modify_position_sl_tp(

                    position_ticket=kwargs.get("ticket"),

                    symbol=kwargs.get("symbol"),

                    new_sl=kwargs.get("new_sl"),

                    new_tp=kwargs.get("new_tp")

                )

            else:  # It's an order

                result = modify_order(

                    order_ticket=kwargs.get("ticket"),

                    symbol=kwargs.get("symbol"),

                    new_sl=kwargs.get("new_sl"),

                    new_tp=kwargs.get("new_tp")

                )


        elif operation == "close":

            if kwargs.get("entry_type") == "position":

                result = close_position_by_ticket(kwargs.get("ticket"))

            else:  # It's an order

                result = delete_order(kwargs.get("ticket"))

        else:
            result = {"success": False, "error": f"Unknown operation: {operation}"}

        mt5.shutdown()
        return result

    except Exception as e:
        mt5.shutdown()
        return {"success": False, "error": f"Exception in execute_for_account: {str(e)}"}


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


def get_active_positions_for_session(session_id: str) -> List[Dict]:
    """Get active positions for a trading session"""
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


@app.get("/")
def root():
    return {"message": "Enhanced Trading API is running", "status": "healthy"}


# Add this new endpoint above /health endpoint
@app.get("/active_sessions")
def get_active_sessions():
    """Get all active trading sessions with details"""
    return {"sessions": trade_sessions}
    # active_sessions = []
    # for session_id, session_data in trade_sessions.items():
    #     active_sessions.append({
    #         "session_id": session_id,
    #         "symbol": session_data["trade_details"]["symbol"],
    #         "action": session_data["trade_details"]["action"],
    #         "timestamp": session_data["timestamp"]
    #     })
    # return {"sessions": active_sessions}




@app.post("/trade_order")
def trade_order(req: TradeRequest):
    """Execute trade order across configured accounts"""
    try:
        # Generate unique session ID
        session_id = f"trade_{int(time.time() * 1000)}"

        # Convert symbol format
        symbol = convert_symbol_format(req.pair)

        # Validate limit order requirements
        if req.order_type == "limit" and req.entry_price is None:
            raise HTTPException(status_code=400, detail="entry_price is required for limit orders")

        results = []
        successful_trades = 0
        entry_type = "position" if req.order_type == "market" else "order"

        # Execute trade for each account
        for account_config in ACCOUNTS_CONFIG:
            logger.info("Executing trade for account %s...", account_config['account'])

            result = execute_for_account(
                account_config=account_config,
                operation="trade",
                symbol=symbol,
                action=req.action,
                stop_loss=req.stop_loss,
                take_profit=req.target_level,
                entry_price=req.entry_price if req.order_type == "limit" else None,
                order_type=req.order_type,
            )

            logger.info(result)
            results.append({
                "account": account_config["account"],
                "result": result
            })

            if result["success"]:
                successful_trades += 1
                # Annotate result with the entry type
                result["entry_type"] = entry_type

            time.sleep(1)

        # Store session data
        trade_sessions[session_id] = {
            "entry_type": entry_type,  # Add this line
            "timestamp": datetime.now().isoformat(),
            "total_accounts": len(ACCOUNTS_CONFIG),
            "successful_trades": successful_trades,
            "failed_trades": len(ACCOUNTS_CONFIG) - successful_trades,
            "results": results,
            "order_type": req.order_type,  # Add order type to session
            "entry_price": req.entry_price if req.order_type == "limit" else None,
            "trade_details": {
                "symbol": symbol,
                "action": req.action,
                "order_type": req.order_type,
                "stop_loss": req.stop_loss,
                "target_level": req.target_level,
                "entry_price": req.entry_price
            }
        }

        response = {
            "success": successful_trades > 0,
            "session_id": session_id,
            **trade_sessions[session_id]
        }

        if successful_trades == 0:
            raise HTTPException(status_code=400, detail="All trades failed")

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/modify_positions")
def modify_positions(req: ModifyRequest):
    """Modify SL/TP for all positions in a trading session"""
    try:
        if req.session_id not in trade_sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        if req.new_sl is None and req.new_tp is None:
            raise HTTPException(status_code=400, detail="At least one of new_sl or new_tp must be provided")

        active_positions = get_active_positions_for_session(req.session_id)
        if not active_positions:
            raise HTTPException(status_code=404, detail="No active positions found for this session")

        results = []
        successful_modifications = 0

        # Modify positions for each account
        for position in active_positions:
            account_config = next(
                (acc for acc in ACCOUNTS_CONFIG if acc["account"] == position["account"]),
                None
            )

            if not account_config:
                continue

            logger.info(
                "Modifying position %s for account %s...",
                position['ticket'],
                position['account'],
            )

            result = execute_for_account(
                account_config=account_config,
                operation="modify",
                ticket=position["ticket"],
                symbol=position["symbol"],
                new_sl=req.new_sl,
                new_tp=req.new_tp
            )

            results.append({
                "account": position["account"],
                "ticket": position["ticket"],
                "result": result
            })

            if result["success"]:
                successful_modifications += 1

            time.sleep(1)

        response = {
            "success": successful_modifications > 0,
            "session_id": req.session_id,
            "total_positions": len(active_positions),
            "successful_modifications": successful_modifications,
            "failed_modifications": len(active_positions) - successful_modifications,
            "results": results,
            "modification_details": {
                "new_sl": req.new_sl,
                "new_tp": req.new_tp
            }
        }

        if successful_modifications == 0:
            raise HTTPException(status_code=400, detail="All modifications failed")

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/close_positions")
def close_positions(req: CloseRequest):
    """Close all positions in a trading session"""
    try:
        if req.session_id not in trade_sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        session_data = trade_sessions[req.session_id]
        active_positions = get_active_positions_for_session(req.session_id)
        if not active_positions:
            raise HTTPException(status_code=404, detail="No active positions found for this session")

        results = []
        successful_closures = 0
        total_profit = 0.0
        account_profits = []

        # Close positions for each account
        for position in active_positions:
            account_config = next(
                (acc for acc in ACCOUNTS_CONFIG if acc["account"] == position["account"]),
                None
            )

            if not account_config:
                continue

            result = execute_for_account(
                account_config=account_config,
                operation="close",
                ticket=position["ticket"]
            )

            results.append({
                "account": position["account"],
                "ticket": position["ticket"],
                "result": result
            })

            if result["success"]:
                successful_closures += 1
                # Add profit to total
                profit = result.get("profit", 0.0)
                total_profit += profit
                account_profits.append({
                    "account": position["account"],
                    "profit": profit
                })

            time.sleep(1)

        # Move session to history
        now = datetime.now()
        trade_history[req.session_id] = {
            **session_data,
            "closing_time": now.isoformat(),
            "total_profit": total_profit,
            "account_profits": account_profits,
            "expired": False
        }

        # Remove from active sessions
        del trade_sessions[req.session_id]

        response = {
            "success": successful_closures > 0,
            "session_id": req.session_id,
            "total_positions": len(active_positions),
            "successful_closures": successful_closures,
            "failed_closures": len(active_positions) - successful_closures,
            "results": results,
            "total_profit": total_profit
        }

        if successful_closures == 0:
            raise HTTPException(status_code=400, detail="All closures failed")

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/sessions")
def get_sessions():
    """Get all trading sessions"""
    return {"sessions": list(trade_sessions.keys())}


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Get specific session details"""
    if session_id not in trade_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = trade_sessions[session_id]
    active_positions = get_active_positions_for_session(session_id)

    return {
        "session_id": session_id,
        "active_positions": active_positions,
        **session_data
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/trade_history")
def get_trade_history():
    """Get trade history"""
    return {"history": trade_history}

@app.get("/position_details")
def get_position_details(ticket: int, account: int):
    """Get current SL/TP for a position"""
    account_config = next((acc for acc in ACCOUNTS_CONFIG if acc["account"] == account), None)
    if not account_config:
        raise HTTPException(status_code=404, detail="Account config not found")

    # Login to account
    if not mt5.initialize(login=account_config["account"],
                          password=account_config["password"],
                          server=account_config["server"]):
        error = mt5.last_error()
        return {"success": False, "error": f"Login failed: {error}"}

    time.sleep(0.5)  # Let terminal sync

    # Get position details
    positions = mt5.positions_get(ticket=ticket)
    mt5.shutdown()

    if not positions:
        return {"success": False, "error": "Position not found"}

    position = positions[0]
    return {
        "success": True,
        "sl": position.sl,
        "tp": position.tp
    }

@app.get("/dashboard_stats")
def get_dashboard_stats():
    active_count = len(trade_sessions)
    total_profit = sum(session["total_profit"] for session in trade_history.values())

    # Calculate today's P&L
    today = datetime.now().date()
    today_profit = sum(
        session["total_profit"] for session in trade_history.values()
        if datetime.fromisoformat(session["closing_time"]).date() == today
    )

    # Calculate success rate
    successful_trades = sum(
        1 for session in trade_history.values()
        if session["total_profit"] > 0 and not session.get("expired", False)
    )
    success_rate = (successful_trades / len(trade_history)) * 100 if trade_history else 0

    return {
        "active_sessions": active_count,
        "success_rate": round(success_rate, 1),
        "today_pnl": today_profit,
        "total_pnl": total_profit
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
