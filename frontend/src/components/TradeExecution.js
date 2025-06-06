// import React, { useState, useEffect } from "react";
// import { TrendingUp, TrendingDown, Target, Shield, DollarSign, Zap, Clock, Activity } from "lucide-react";
//
// export default function TradeExecutionPage() {
//   const [form, setForm] = useState({
//     pair: "",
//     action: "buy",
//     risk_percent: "1",
//     order_type: "market",
//     entry_price: "",
//     stop_loss: "",
//     target_level: "",
//   });
//
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [focusedField, setFocusedField] = useState("");
//
//   // Real-time price data (commented for future implementation)
//   // const [priceData, setPriceData] = useState({});
//   // const [isConnected, setIsConnected] = useState(false);
//
//   // Popular forex pairs
//   const forexPairs = [
//     "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD",
//     "NZDUSD", "EURJPY", "GBPJPY", "EURGBP", "AUDCAD", "CADJPY"
//   ];
//
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({
//       ...prev,
//       [name]: value,
//       // Clear dependent fields when order type changes
//       ...(name === "order_type" && { entry_price: "", stop_loss: "", target_level: "" })
//     }));
//   };
//
//   const handleSubmit = async () => {
//     if (isSubmitting) return;
//
//     // Validation
//     const requiredFields = ["pair", "action", "risk_percent", "order_type", "stop_loss"];
//     if (form.order_type === "limit") {
//       requiredFields.push("entry_price");
//     }
//
//     const missingFields = requiredFields.filter(field => !form[field]);
//     if (missingFields.length > 0) {
//       alert("Please fill in all required fields");
//       return;
//     }
//
//     setIsSubmitting(true);
//
//     try {
//       const payload = {
//         pair: form.pair,
//         action: form.action,
//         risk_percent: Number(form.risk_percent),
//         order_type: form.order_type,
//         stop_loss: Number(form.stop_loss),
//         ...(form.target_level && { target_level: Number(form.target_level) }),
//         ...(form.order_type === "limit" && { entry_price: Number(form.entry_price) })
//       };
//
//       const res = await fetch("http://localhost:8000/trade_order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//
//       const data = await res.json();
//       if (res.ok) {
//         alert("Trade executed successfully! Order ID: " + data.order_id);
//         // Reset form after successful execution
//         setForm({
//           pair: "",
//           action: "buy",
//           risk_percent: "1",
//           order_type: "market",
//           entry_price: "",
//           stop_loss: "",
//           target_level: "",
//         });
//       } else {
//         alert("Error: " + data.detail);
//       }
//     } catch (error) {
//       alert("Failed to execute trade: " + error.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//
//   // Future real-time price connection (commented)
//   // useEffect(() => {
//   //   const connectToRealTimeData = async () => {
//   //     try {
//   //       const ws = new WebSocket('ws://localhost:8000/realtime-prices');
//   //       ws.onopen = () => setIsConnected(true);
//   //       ws.onmessage = (event) => {
//   //         const data = JSON.parse(event.data);
//   //         setPriceData(prev => ({ ...prev, [data.pair]: data }));
//   //       };
//   //       ws.onclose = () => setIsConnected(false);
//   //     } catch (error) {
//   //       console.error('Failed to connect to real-time data:', error);
//   //     }
//   //   };
//   //   connectToRealTimeData();
//   // }, []);
//
//   const inputClass = (fieldName) => `
//     w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
//     text-white placeholder-slate-400 backdrop-blur-sm
//     transition-all duration-300 ease-out
//     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
//     focus:bg-slate-800/70 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10
//     hover:border-slate-600/50 hover:bg-slate-800/60
//     ${focusedField === fieldName ? 'transform scale-[1.02]' : ''}
//   `;
//
//   const ActionButton = ({ action, isSelected, onClick, icon: Icon, color }) => (
//     <button
//       type="button"
//       onClick={() => onClick(action)}
//       className={`
//         flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl
//         font-semibold transition-all duration-300 transform hover:scale-[1.02]
//         ${isSelected
//           ? `bg-gradient-to-r ${color} text-white shadow-lg`
//           : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800/70'
//         }
//       `}
//     >
//       <Icon className="w-5 h-5" />
//       <span>{action.toUpperCase()}</span>
//     </button>
//   );
//
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
//       {/* Background Elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
//       </div>
//
//       <div className="relative max-w-2xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl mb-4 shadow-lg shadow-emerald-500/25">
//             <Zap className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
//             Trade Execution
//           </h1>
//           <p className="text-slate-400">Execute precision trades with advanced risk management</p>
//
//           {/* Future real-time status indicator (commented) */}
//           {/* <div className="flex items-center justify-center space-x-2 mt-3">
//             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
//             <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
//               {isConnected ? 'Live Data Connected' : 'Connecting...'}
//             </span>
//           </div> */}
//         </div>
//
//         {/* Main Trading Panel */}
//         <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
//           <div className="space-y-8">
//
//             {/* Pair Selection */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2 text-slate-300 mb-3">
//                 <DollarSign className="w-5 h-5" />
//                 <span className="font-medium">Currency Pair</span>
//               </div>
//
//               <div className="relative">
//                 <select
//                   name="pair"
//                   value={form.pair}
//                   onChange={handleChange}
//                   className={`${inputClass("pair")} cursor-pointer`}
//                   required
//                 >
//                   <option value="" className="bg-slate-800">Select Currency Pair</option>
//                   {forexPairs.map(pair => (
//                     <option key={pair} value={pair} className="bg-slate-800">
//                       {pair}
//                       {/* Future real-time price display (commented) */}
//                       {/* {priceData[pair] && ` - ${priceData[pair].bid}/${priceData[pair].ask}`} */}
//                     </option>
//                   ))}
//                 </select>
//
//                 {/* Future real-time price display for selected pair (commented) */}
//                 {/* {form.pair && priceData[form.pair] && (
//                   <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-slate-400">Bid: <span className="text-blue-400">{priceData[form.pair].bid}</span></span>
//                       <span className="text-slate-400">Ask: <span className="text-red-400">{priceData[form.pair].ask}</span></span>
//                       <span className="text-slate-400">Spread: <span className="text-slate-300">{(priceData[form.pair].ask - priceData[form.pair].bid).toFixed(5)}</span></span>
//                     </div>
//                   </div>
//                 )} */}
//               </div>
//             </div>
//
//             {/* Buy/Sell Actions */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2 text-slate-300 mb-3">
//                 <Activity className="w-5 h-5" />
//                 <span className="font-medium">Trade Direction</span>
//               </div>
//
//               <div className="flex space-x-4">
//                 <ActionButton
//                   action="buy"
//                   isSelected={form.action === "buy"}
//                   onClick={(action) => setForm(prev => ({ ...prev, action }))}
//                   icon={TrendingUp}
//                   color="from-emerald-600 to-emerald-500"
//                 />
//                 <ActionButton
//                   action="sell"
//                   isSelected={form.action === "sell"}
//                   onClick={(action) => setForm(prev => ({ ...prev, action }))}
//                   icon={TrendingDown}
//                   color="from-rose-600 to-rose-500"
//                 />
//               </div>
//             </div>
//
//             {/* Risk Management */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2 text-slate-300 mb-3">
//                 <Shield className="w-5 h-5" />
//                 <span className="font-medium">Risk Management</span>
//               </div>
//
//               <div className="relative">
//                 <input
//                   name="risk_percent"
//                   type="number"
//                   step="0.1"
//                   min="0.1"
//                   max="10"
//                   placeholder="Risk Percentage"
//                   value={form.risk_percent}
//                   onChange={handleChange}
//                   onFocus={() => setFocusedField("risk_percent")}
//                   onBlur={() => setFocusedField("")}
//                   className={inputClass("risk_percent")}
//                   required
//                 />
//                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
//                   %
//                 </div>
//               </div>
//             </div>
//
//             {/* Order Type Selection */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2 text-slate-300 mb-3">
//                 <Clock className="w-5 h-5" />
//                 <span className="font-medium">Order Type</span>
//               </div>
//
//               <div className="flex space-x-4">
//                 <ActionButton
//                   action="market"
//                   isSelected={form.order_type === "market"}
//                   onClick={(type) => setForm(prev => ({ ...prev, order_type: type }))}
//                   icon={Zap}
//                   color="from-blue-600 to-blue-500"
//                 />
//                 <ActionButton
//                   action="limit"
//                   isSelected={form.order_type === "limit"}
//                   onClick={(type) => setForm(prev => ({ ...prev, order_type: type }))}
//                   icon={Target}
//                   color="from-purple-600 to-purple-500"
//                 />
//               </div>
//             </div>
//
//             {/* Conditional Fields Based on Order Type */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2 text-slate-300 mb-3">
//                 <Target className="w-5 h-5" />
//                 <span className="font-medium">Order Parameters</span>
//               </div>
//
//               {/* Limit Order - Entry Price */}
//               {form.order_type === "limit" && (
//                 <div className="relative">
//                   <input
//                     name="entry_price"
//                     type="number"
//                     step="0.00001"
//                     placeholder="Entry Price"
//                     value={form.entry_price}
//                     onChange={handleChange}
//                     onFocus={() => setFocusedField("entry_price")}
//                     onBlur={() => setFocusedField("")}
//                     className={inputClass("entry_price")}
//                     required
//                   />
//                 </div>
//               )}
//
//               {/* Stop Loss (Required for both) */}
//               <div className="relative">
//                 <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-400" />
//                 <input
//                   name="stop_loss"
//                   type="number"
//                   step="0.00001"
//                   placeholder="Stop Loss Level (Required)"
//                   value={form.stop_loss}
//                   onChange={handleChange}
//                   onFocus={() => setFocusedField("stop_loss")}
//                   onBlur={() => setFocusedField("")}
//                   className={`${inputClass("stop_loss")} pl-10`}
//                   required
//                 />
//               </div>
//
//               {/* Target Level (Optional for both) */}
//               <div className="relative">
//                 <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
//                 <input
//                   name="target_level"
//                   type="number"
//                   step="0.00001"
//                   placeholder="Target Level (Optional)"
//                   value={form.target_level}
//                   onChange={handleChange}
//                   onFocus={() => setFocusedField("target_level")}
//                   onBlur={() => setFocusedField("")}
//                   className={`${inputClass("target_level")} pl-10`}
//                 />
//               </div>
//             </div>
//
//             {/* Execute Button */}
//             <div
//               onClick={handleSubmit}
//               className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
//             >
//               {isSubmitting ? (
//                 <div className="flex items-center justify-center space-x-3">
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   <span className="text-lg">Executing Trade...</span>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-center space-x-3">
//                   <Zap className="w-6 h-6" />
//                   <span className="text-lg">Execute {form.order_type.toUpperCase()} {form.action.toUpperCase()}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//
//         {/* Footer */}
//         <div className="text-center mt-8">
//           <p className="text-slate-500 text-sm">
//             Advanced Risk Management • Real-time Execution • Professional Trading
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }



// ######################




import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Target, Shield, DollarSign, Zap, Clock, Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function TradeExecutionPage() {
  const [priceData, setPriceData] = useState({});
  const [isConnected, setIsConnected] = useState(false);

//   useEffect(() => {
//   const ws = new WebSocket("ws://localhost:8000/ws/realtime-prices");
//
//   ws.onopen = () => setIsConnected(true);
//   ws.onmessage = (event) => {
//     setPriceData(JSON.parse(event.data));
//   };
//   ws.onclose = () => setIsConnected(false);
//
//   return () => ws.close();
// }, []);

  const [form, setForm] = useState({
    pair: "",
    action: "buy",
    risk_percent: "1",
    order_type: "market",
    entry_price: "",
    stop_loss: "",
    target_level: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [lastTradeResult, setLastTradeResult] = useState(null);

  // Popular forex pairs
  const forexPairs = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD",
    "NZDUSD", "EURJPY", "GBPJPY", "EURGBP", "AUDCAD", "CADJPY"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Clear dependent fields when order type changes
      ...(name === "order_type" && { entry_price: "", stop_loss: "", target_level: "" })
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!form.pair) errors.push("Currency pair is required");
    if (!form.action) errors.push("Trade direction is required");
    if (!form.risk_percent || form.risk_percent <= 0 || form.risk_percent > 10) {
      errors.push("Risk percentage must be between 0.1 and 10");
    }
    if (!form.order_type) errors.push("Order type is required");
    if (!form.stop_loss || form.stop_loss <= 0) errors.push("Stop loss is required");

    if (form.order_type === "limit" && (!form.entry_price || form.entry_price <= 0)) {
      errors.push("Entry price is required for limit orders");
    }

    // Validate stop loss vs entry price logic
    if (form.order_type === "limit" && form.entry_price && form.stop_loss) {
      const entryPrice = parseFloat(form.entry_price);
      const stopLoss = parseFloat(form.stop_loss);

      if (form.action === "buy" && stopLoss >= entryPrice) {
        errors.push("For BUY orders, stop loss must be below entry price");
      }
      if (form.action === "sell" && stopLoss <= entryPrice) {
        errors.push("For SELL orders, stop loss must be above entry price");
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Clear previous results
    setLastTradeResult(null);

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setLastTradeResult({
        success: false,
        error: validationErrors.join(", "),
        type: "validation"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        pair: form.pair,
        action: form.action,
        risk_percent: parseFloat(form.risk_percent),
        order_type: form.order_type,
        stop_loss: parseFloat(form.stop_loss),
        ...(form.target_level && { target_level: parseFloat(form.target_level) }),
        ...(form.order_type === "limit" && { entry_price: parseFloat(form.entry_price) })
      };

      console.log("Sending payload:", payload);

      const response = await fetch("http://localhost:8000/trade_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        setLastTradeResult({
          success: true,
          data: data,
          type: "success"
        });

        // Reset form after successful execution
        setForm({
          pair: "",
          action: "buy",
          risk_percent: "1",
          order_type: "market",
          entry_price: "",
          stop_loss: "",
          target_level: "",
        });
      } else {
        setLastTradeResult({
          success: false,
          error: data.detail || "Unknown error occurred",
          type: "api_error"
        });
      }
    } catch (error) {
      console.error("Trade execution error:", error);
      setLastTradeResult({
        success: false,
        error: `Network error: ${error.message}`,
        type: "network_error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (fieldName) => `
    w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
    text-white placeholder-slate-400 backdrop-blur-sm
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
    focus:bg-slate-800/70 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10
    hover:border-slate-600/50 hover:bg-slate-800/60
    ${focusedField === fieldName ? 'transform scale-[1.02]' : ''}
  `;

  const ActionButton = ({ action, isSelected, onClick, icon: Icon, color, children }) => (
    <button
      type="button"
      onClick={() => onClick(action)}
      className={`
        flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl
        font-semibold transition-all duration-300 transform hover:scale-[1.02]
        ${isSelected 
          ? `bg-gradient-to-r ${color} text-white shadow-lg` 
          : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800/70'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{children || action.toUpperCase()}</span>
    </button>
  );

  const ResultDisplay = ({ result }) => {
    if (!result) return null;

    const isSuccess = result.success;
    const Icon = isSuccess ? CheckCircle : XCircle;
    const bgColor = isSuccess ? 'bg-emerald-900/50 border-emerald-700/50' : 'bg-red-900/50 border-red-700/50';
    const textColor = isSuccess ? 'text-emerald-400' : 'text-red-400';

    return (
      <div className={`p-4 rounded-xl border ${bgColor} mb-6`}>
        <div className={`flex items-center space-x-2 ${textColor} mb-2`}>
          <Icon className="w-5 h-5" />
          <span className="font-semibold">
            {isSuccess ? 'Trade Executed Successfully!' : 'Trade Execution Failed'}
          </span>
        </div>

        <p>Session ID: {result.data.session_id}</p>

        {isSuccess && result.data ? (
          <div className="text-slate-300 text-sm space-y-1">
            <p>✓ Successful trades: {result.data.successful_trades}/{result.data.total_accounts}</p>
            {result.data.failed_trades > 0 && (
              <p className="text-amber-400">⚠ Failed trades: {result.data.failed_trades}</p>
            )}
            <p>Symbol: {result.data.trade_details.symbol}</p>
            <p>Action: {result.data.trade_details.action.toUpperCase()}</p>
            <p>Order Type: {result.data.trade_details.order_type.toUpperCase()}</p>
          </div>
        ) : (
          <p className="text-slate-300 text-sm">{result.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl mb-4 shadow-lg shadow-emerald-500/25">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Trade Execution
          </h1>
          <p className="text-slate-400">Execute precision trades with advanced risk management</p>
        </div>

        {/* Result Display */}
        <ResultDisplay result={lastTradeResult} />

        {/* Main Trading Panel */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="space-y-8">

            {/* Pair Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">Currency Pair</span>
              </div>

              <div className="relative">
                <select
                  name="pair"
                  value={form.pair}
                  onChange={handleChange}
                  className={`${inputClass("pair")} cursor-pointer`}
                  required
                >
                  <option value="" className="bg-slate-800">Select Currency Pair</option>
                  {forexPairs.map(pair => (
                    <option key={pair} value={pair} className="bg-slate-800">
                      {pair}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buy/Sell Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Activity className="w-5 h-5" />
                <span className="font-medium">Trade Direction</span>
              </div>

              <div className="flex space-x-4">
                <ActionButton
                  action="buy"
                  isSelected={form.action === "buy"}
                  onClick={(action) => setForm(prev => ({ ...prev, action }))}
                  icon={TrendingUp}
                  color="from-emerald-600 to-emerald-500"
                />
                <ActionButton
                  action="sell"
                  isSelected={form.action === "sell"}
                  onClick={(action) => setForm(prev => ({ ...prev, action }))}
                  icon={TrendingDown}
                  color="from-rose-600 to-rose-500"
                />
              </div>
            </div>

            {/* Risk Management */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Risk Management</span>
              </div>

              <div className="relative">
                <input
                  name="risk_percent"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  placeholder="Risk Percentage (0.1 - 10%)"
                  value={form.risk_percent}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("risk_percent")}
                  onBlur={() => setFocusedField("")}
                  className={inputClass("risk_percent")}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                  %
                </div>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Order Type</span>
              </div>

              <div className="flex space-x-4">
                <ActionButton
                  action="market"
                  isSelected={form.order_type === "market"}
                  onClick={(type) => setForm(prev => ({ ...prev, order_type: type }))}
                  icon={Zap}
                  color="from-blue-600 to-blue-500"
                >
                  MARKET
                </ActionButton>
                <ActionButton
                  action="limit"
                  isSelected={form.order_type === "limit"}
                  onClick={(type) => setForm(prev => ({ ...prev, order_type: type }))}
                  icon={Target}
                  color="from-purple-600 to-purple-500"
                >
                  LIMIT
                </ActionButton>
              </div>
            </div>

            {/* Order Parameters */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Target className="w-5 h-5" />
                <span className="font-medium">Order Parameters</span>
              </div>

              {/* Limit Order - Entry Price */}
              {form.order_type === "limit" && (
                <div className="relative">
                  <input
                    name="entry_price"
                    type="number"
                    step="0.00001"
                    placeholder="Entry Price (Required for Limit Orders)"
                    value={form.entry_price}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("entry_price")}
                    onBlur={() => setFocusedField("")}
                    className={inputClass("entry_price")}
                    required
                  />
                </div>
              )}

              {/* Stop Loss (Required) */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  name="stop_loss"
                  type="number"
                  step="0.00001"
                  placeholder="Stop Loss Level (Required)"
                  value={form.stop_loss}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("stop_loss")}
                  onBlur={() => setFocusedField("")}
                  className={`${inputClass("stop_loss")} pl-10`}
                  required
                />
              </div>

              {/* Target Level (Optional) */}
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  name="target_level"
                  type="number"
                  step="0.00001"
                  placeholder="Target Level (Optional)"
                  value={form.target_level}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("target_level")}
                  onBlur={() => setFocusedField("")}
                  className={`${inputClass("target_level")} pl-10`}
                />
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-lg">Executing Trade...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Zap className="w-6 h-6" />
                  <span className="text-lg">Execute {form.order_type.toUpperCase()} {form.action.toUpperCase()}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Advanced Risk Management • Multi-Account Execution • Professional Trading
          </p>
        </div>
      </div>
    </div>
  );
}