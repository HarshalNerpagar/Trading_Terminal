import MetaTrader5 as mt5

# display data on the MetaTrader 5 package
print("MetaTrader5 package author: ", mt5.__author__)
print("MetaTrader5 package version: ", mt5.__version__)

# establish connection to MetaTrader 5 terminal
if not mt5.initialize():
    print("initialize() failed, error code =", mt5.last_error())
    quit()

# get account currency
account_currency = mt5.account_info().currency
print("Account currency:", account_currency)

# prepare the modify_request structure
symbol = "BTCUSDm"
symbol_info = mt5.symbol_info(symbol)
if symbol_info is None:
    print(symbol, "not found, can not call order_check()")
    mt5.shutdown()
    quit()

# if the symbol is unavailable in MarketWatch, add it
if not symbol_info.visible:
    print(symbol, "is not visible, trying to switch on")
    if not mt5.symbol_select(symbol, True):
        print("symbol_select({}}) failed, exit", symbol)
        mt5.shutdown()
        quit()

# prepare the modify_request
point = mt5.symbol_info(symbol).point
modify_request = {
    "action": mt5.TRADE_ACTION_PENDING,
    "symbol": symbol,
    "volume": 0.04,
    "type": mt5.ORDER_TYPE_BUY_LIMIT,
    "price": 104506.1,
    "sl": 103495.62,
    "tp": 106793.71,
    "deviation": 10,
    "magic": 234000,
    "comment": "python script",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_FOK,
}

# perform the check and display the result 'as is'
result = mt5.order_check(modify_request)
print(result)
result = mt5.order_send(modify_request)
# print(result)
# modify_request the result as a dictionary and display it element by element
result_dict = result._asdict()
for field in result_dict.keys():
    print("   {}={}".format(field, result_dict[field]))
    # if this is a trading modify_request structure, display it element by element as well
    if field == "modify_request":
        trademodify_request_dict = result_dict[field]._asdict()
        for tradereq_filed in trademodify_request_dict:
            print("       trademodify_request: {}={}".format(tradereq_filed, trademodify_request_dict[tradereq_filed]))

# shut down connection to the MetaTrader 5 terminal
mt5.shutdown()