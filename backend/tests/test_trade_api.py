import sys
import os
import types
import importlib
from fastapi.testclient import TestClient

# Provide a minimal MetaTrader5 stub before importing the app
mt5_stub = types.SimpleNamespace(
    TRADE_ACTION_DEAL=0,
    ORDER_TIME_GTC=0,
    ORDER_FILLING_FOK=0,
)
sys.modules['MetaTrader5'] = mt5_stub

# Ensure backend package can be imported when running tests
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, ROOT_DIR)

import backend.trade_api as trade_api

# Patch execute_for_account to avoid external dependencies

def fake_execute_for_account(account_config, operation, **kwargs):
    if operation == 'trade':
        return {'success': True, 'order_id': 1}
    elif operation == 'close':
        return {'success': True, 'profit': 5.0}
    return {'success': True}

trade_api.execute_for_account = fake_execute_for_account

client = TestClient(trade_api.app)

def test_trade_order_success(monkeypatch):
    response = client.post(
        '/trade_order',
        json={
            'pair': 'EURUSD',
            'action': 'buy',
            'risk_percent': 1,
            'order_type': 'market',
            'stop_loss': 1.0,
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'session_id' in data


def test_close_positions_success(monkeypatch):
    # Prepare session data
    session_id = 'test_session'
    trade_api.trade_sessions[session_id] = {
        'timestamp': '2024-01-01T00:00:00',
        'entry_type': 'position',
        'total_accounts': 1,
        'successful_trades': 1,
        'failed_trades': 0,
        'order_type': 'market',
        'entry_price': None,
        'results': [
            {'account': 273162078, 'result': {'success': True, 'order_id': 1}}
        ],
        'trade_details': {
            'symbol': 'EURUSD',
            'action': 'buy',
            'order_type': 'market',
            'stop_loss': 1.0,
            'target_level': None,
            'entry_price': None,
        }
    }

    response = client.post('/close_positions', json={'session_id': session_id})
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['session_id'] == session_id

