from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from datetime import datetime, timedelta
import threading
import time
import MetaTrader5 as mt5
from typing import Optional, List, Dict

from services.trade_service import (
    convert_symbol_format,
    get_active_positions_for_session,
)
from services.account_service import (
    execute_for_account,
    ACCOUNTS_CONFIG,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

trade_sessions: Dict[str, Dict] = {}
trade_history: Dict[str, Dict] = {}
EXPIRATION_HOURS = 24


def clean_expired_sessions() -> None:
    while True:
        now = datetime.now()
        expired = []
        for session_id, session_data in list(trade_sessions.items()):
            created = datetime.fromisoformat(session_data["timestamp"])
            if (now - created) > timedelta(hours=EXPIRATION_HOURS):
                expired.append(session_id)

        for session_id in expired:
            session_data = trade_sessions[session_id]
            total_profit = 0.0
            account_profits = []
            for account_result in session_data["results"]:
                if account_result["result"]["success"]:
                    entry_type = account_result["result"].get("entry_type", "position")
                    if entry_type == "position":
                        close_result = execute_for_account(
                            account_config=next(acc for acc in ACCOUNTS_CONFIG if acc["account"] == account_result["account"]),
                            operation="close",
                            ticket=account_result["result"]["order_id"],
                            entry_type="position",
                        )
                        if close_result["success"]:
                            profit = close_result.get("profit", 0)
                            total_profit += profit
                            account_profits.append({"account": account_result["account"], "profit": profit})
                    else:
                        execute_for_account(
                            account_config=next(acc for acc in ACCOUNTS_CONFIG if acc["account"] == account_result["account"]),
                            operation="close",
                            ticket=account_result["result"]["order_id"],
                            entry_type="order",
                        )
                        account_profits.append({"account": account_result["account"], "profit": 0.0})

            trade_history[session_id] = {
                **session_data,
                "closing_time": now.isoformat(),
                "total_profit": total_profit,
                "account_profits": account_profits,
                "expired": True,
            }
            del trade_sessions[session_id]
        time.sleep(3600)

cleanup_thread = threading.Thread(target=clean_expired_sessions, daemon=True)
cleanup_thread.start()


class TradeRequest(BaseModel):
    pair: str
    action: str
    risk_percent: float
    order_type: str
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


@app.get("/")
def root():
    return {"message": "Enhanced Trading API is running", "status": "healthy"}


@app.get("/active_sessions")
def get_active_sessions():
    return {"sessions": trade_sessions}


@app.post("/trade_order")
def trade_order(req: TradeRequest):
    try:
        session_id = f"trade_{int(time.time() * 1000)}"
        symbol = convert_symbol_format(req.pair)
        if req.order_type == "limit" and req.entry_price is None:
            raise HTTPException(status_code=400, detail="entry_price is required for limit orders")

        results = []
        successful_trades = 0
        entry_type = "position" if req.order_type == "market" else "order"
        for account_config in ACCOUNTS_CONFIG:
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
            results.append({"account": account_config["account"], "result": result})
            if result["success"]:
                successful_trades += 1
                result["entry_type"] = entry_type
            time.sleep(1)

        trade_sessions[session_id] = {
            "entry_type": entry_type,
            "timestamp": datetime.now().isoformat(),
            "total_accounts": len(ACCOUNTS_CONFIG),
            "successful_trades": successful_trades,
            "failed_trades": len(ACCOUNTS_CONFIG) - successful_trades,
            "results": results,
            "order_type": req.order_type,
            "entry_price": req.entry_price if req.order_type == "limit" else None,
            "trade_details": {
                "symbol": symbol,
                "action": req.action,
                "order_type": req.order_type,
                "stop_loss": req.stop_loss,
                "target_level": req.target_level,
                "entry_price": req.entry_price,
            },
        }

        response = {
            "success": successful_trades > 0,
            "session_id": session_id,
            **trade_sessions[session_id],
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
    try:
        if req.session_id not in trade_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        if req.new_sl is None and req.new_tp is None:
            raise HTTPException(status_code=400, detail="At least one of new_sl or new_tp must be provided")

        active_positions = get_active_positions_for_session(req.session_id, trade_sessions)
        if not active_positions:
            raise HTTPException(status_code=404, detail="No active positions found for this session")

        results = []
        successful_modifications = 0
        for position in active_positions:
            account_config = next((acc for acc in ACCOUNTS_CONFIG if acc["account"] == position["account"]), None)
            if not account_config:
                continue
            result = execute_for_account(
                account_config=account_config,
                operation="modify",
                ticket=position["ticket"],
                symbol=position["symbol"],
                new_sl=req.new_sl,
                new_tp=req.new_tp,
                entry_type=trade_sessions[req.session_id]["entry_type"],
            )
            results.append({"account": position["account"], "ticket": position["ticket"], "result": result})
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
            "modification_details": {"new_sl": req.new_sl, "new_tp": req.new_tp},
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
    try:
        if req.session_id not in trade_sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        session_data = trade_sessions[req.session_id]
        active_positions = get_active_positions_for_session(req.session_id, trade_sessions)
        if not active_positions:
            raise HTTPException(status_code=404, detail="No active positions found for this session")

        results = []
        successful_closures = 0
        total_profit = 0.0
        account_profits = []
        for position in active_positions:
            account_config = next((acc for acc in ACCOUNTS_CONFIG if acc["account"] == position["account"]), None)
            if not account_config:
                continue
            result = execute_for_account(
                account_config=account_config,
                operation="close",
                ticket=position["ticket"],
                entry_type=session_data["entry_type"],
            )
            results.append({"account": position["account"], "ticket": position["ticket"], "result": result})
            if result["success"]:
                successful_closures += 1
                profit = result.get("profit", 0.0)
                total_profit += profit
                account_profits.append({"account": position["account"], "profit": profit})
            time.sleep(1)

        now = datetime.now()
        trade_history[req.session_id] = {
            **session_data,
            "closing_time": now.isoformat(),
            "total_profit": total_profit,
            "account_profits": account_profits,
            "expired": False,
        }
        del trade_sessions[req.session_id]

        response = {
            "success": successful_closures > 0,
            "session_id": req.session_id,
            "total_positions": len(active_positions),
            "successful_closures": successful_closures,
            "failed_closures": len(active_positions) - successful_closures,
            "results": results,
            "total_profit": total_profit,
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
    return {"sessions": list(trade_sessions.keys())}


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    if session_id not in trade_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session_data = trade_sessions[session_id]
    active_positions = get_active_positions_for_session(session_id, trade_sessions)
    return {"session_id": session_id, "active_positions": active_positions, **session_data}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/trade_history")
def get_trade_history():
    return {"history": trade_history}


@app.get("/position_details")
def get_position_details(ticket: int, account: int):
    account_config = next((acc for acc in ACCOUNTS_CONFIG if acc["account"] == account), None)
    if not account_config:
        raise HTTPException(status_code=404, detail="Account config not found")

    if not mt5.initialize(login=account_config["account"], password=account_config["password"], server=account_config["server"]):
        error = mt5.last_error()
        return {"success": False, "error": f"Login failed: {error}"}

    time.sleep(0.5)
    positions = mt5.positions_get(ticket=ticket)
    mt5.shutdown()
    if not positions:
        return {"success": False, "error": "Position not found"}

    position = positions[0]
    return {"success": True, "sl": position.sl, "tp": position.tp}


@app.get("/dashboard_stats")
def get_dashboard_stats():
    active_count = len(trade_sessions)
    total_profit = sum(session["total_profit"] for session in trade_history.values())
    today = datetime.now().date()
    today_profit = sum(
        session["total_profit"] for session in trade_history.values()
        if datetime.fromisoformat(session["closing_time"]).date() == today
    )
    successful_trades = sum(
        1 for session in trade_history.values() if session["total_profit"] > 0 and not session.get("expired", False)
    )
    success_rate = (successful_trades / len(trade_history)) * 100 if trade_history else 0

    return {
        "active_sessions": active_count,
        "success_rate": round(success_rate, 1),
        "today_pnl": today_profit,
        "total_pnl": total_profit,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
