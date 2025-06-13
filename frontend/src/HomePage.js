import React, { useState, useEffect } from "react";
import {
  Activity, BarChart3, Target, TrendingUp, Clock, Zap,
  Edit3, X, ArrowRight, ChevronRight, DollarSign, History
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TradingHomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSessions, setActiveSessions] = useState({});
  const [tradeHistory, setTradeHistory] = useState({});
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    active_sessions: 0,
    success_rate: 0,
    today_pnl: 0,
    total_pnl: 0
  });
  const [modifySession, setModifySession] = useState(null);
  const [closeSession, setCloseSession] = useState(null);
  const [newSL, setNewSL] = useState('');
  const [newTP, setNewTP] = useState('');

  const navigate = useNavigate();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/dashboard_stats');
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch active sessions and history
  const fetchData = async () => {
    try {
      setIsLoading(true);
      await fetchDashboardStats();

      if (activeTab === 'active') {
        const sessionsResponse = await fetch('http://localhost:8000/active_sessions');
        const sessionsData = await sessionsResponse.json();
        setActiveSessions(sessionsData.sessions || {});
      } else {
        const historyResponse = await fetch('http://localhost:8000/trade_history');
        const historyData = await historyResponse.json();
        setTradeHistory(historyData.history || {});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleModifyClick = (sessionId, sessionData) => {
    setModifySession({ sessionId, ...sessionData });
    setNewSL('');
    setNewTP('');
  };

  const handleCloseClick = (sessionId) => {
    setCloseSession(sessionId);
  };

  const handleModifySubmit = async () => {
    if (!modifySession || (!newSL && !newTP)) return;

    try {
      const payload = {
        session_id: modifySession.sessionId,
        ...(newSL && { new_sl: parseFloat(newSL) }),
        ...(newTP && { new_tp: parseFloat(newTP) })
      };

      const response = await fetch("http://localhost:8000/modify_positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModifySession(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Modification error:", error);
    }
  };

const handleCloseConfirm = async () => {
  if (!closeSession) return;

  try {
    const payload = { session_id: closeSession };
    const response = await fetch("http://localhost:8000/close_positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Fetch updated stats immediately
      await fetchDashboardStats();
      setCloseSession(null);
      fetchData();
    }
  } catch (error) {
    console.error("Closure error:", error);
  }
};

  const handleExecuteTrade = () => {
    navigate('/execute-order');
  };

  // Calculate total profit from history
  const calculateTotalProfit = () => {
    return Object.values(tradeHistory).reduce((total, session) => {
      return total + (session.total_profit || 0);
    }, 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <header className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Trading Terminal
                </h1>
                <p className="text-xl text-slate-400">
                  Professional automated trading execution platform
                </p>
              </div>

              {/* Live Clock */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div className="text-right">
                    <div className="text-white font-mono text-lg">
                      {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {currentTime.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Active Sessions Card */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {dashboardStats.active_sessions}
                </div>
                <div className="text-slate-400 text-sm">
                  Active Sessions
                </div>
              </div>

              {/* Success Rate Card */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatPercentage(dashboardStats.success_rate)}
                </div>
                <div className="text-slate-400 text-sm">
                  Success Rate
                </div>
              </div>

              {/* Today's P&L Card */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                </div>
                <div className={`text-2xl font-bold mb-1 ${
                  dashboardStats.today_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {dashboardStats.today_pnl >= 0 ? '+' : ''}
                  {dashboardStats.today_pnl.toFixed(2)}
                </div>
                <div className="text-slate-400 text-sm">Today's P&L</div>
              </div>

              {/* Total P&L Card */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
                <div className={`text-2xl font-bold mb-1 ${dashboardStats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(dashboardStats.total_pnl)}
                </div>
                <div className="text-slate-400 text-sm">
                  Total P&L
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700 mb-8">
              <button
                className={`px-6 py-3 font-medium text-lg ${activeTab === 'active'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setActiveTab('active')}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Active Sessions</span>
                </div>
              </button>
              <button
                className={`px-6 py-3 font-medium text-lg ${activeTab === 'history'
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'}`}
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Trade History</span>
                </div>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Execute Trade Card */}
              <div className="lg:w-1/3">
                <div
                  onClick={handleExecuteTrade}
                  className="bg-gradient-to-br from-emerald-700/30 to-blue-700/30 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/25 h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl mb-6 shadow-lg shadow-emerald-500/25">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Execute New Trade
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Place new trades with advanced risk management
                    </p>
                    <div className="mt-auto w-full">
                      <div className="flex items-center justify-center space-x-3 text-emerald-400 group">
                        <span className="text-lg font-medium group-hover:underline">Create New Position</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Active Sessions or History */}
              <div className="lg:w-2/3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : activeTab === 'active' ? (
                  <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-white">Active Trading Sessions</h2>
                      <button
                        onClick={fetchData}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        Refresh
                      </button>
                    </div>

                    {Object.keys(activeSessions).length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4">
                          <DollarSign className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">No Active Sessions</h3>
                        <p className="text-slate-500">Execute a new trade to see active sessions here</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(activeSessions).map(([sessionId, sessionData]) => (
                          <div
                            key={sessionId}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 transition-all hover:border-slate-600/50 hover:bg-slate-800/70"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${sessionData.trade_details.action === 'buy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                  <h3 className="font-medium text-white">
                                    {sessionData.trade_details.symbol.replace('m', '')}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 rounded ${sessionData.trade_details.action === 'buy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                                    {sessionData.trade_details.action.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-400 flex flex-wrap gap-4">
                                  <span>SL: {sessionData.trade_details.stop_loss}</span>
                                  {sessionData.trade_details.target_level && (
                                    <span>TP: {sessionData.trade_details.target_level}</span>
                                  )}
                                  <span>{new Date(sessionData.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-slate-400 flex flex-wrap gap-4">
  <span>Type: {sessionData.entry_type.toUpperCase()}</span>
  <span>SL: {sessionData.trade_details.stop_loss}</span>
  {sessionData.trade_details.target_level && (
    <span>TP: {sessionData.trade_details.target_level}</span>
  )}
  <span>{new Date(sessionData.timestamp).toLocaleTimeString()}</span>
</div>
                              </div>

                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleModifyClick(sessionId, sessionData)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-200 hover:text-white rounded-xl transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span>Modify</span>
                                </button>
                                <button
                                  onClick={() => handleCloseClick(sessionId)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-rose-600/50 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Close</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-white">Trade History</h2>
                      <div className="text-emerald-400 font-medium">
                        Total: {formatCurrency(calculateTotalProfit())}
                      </div>
                    </div>

                    {Object.keys(tradeHistory).length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800/50 rounded-full mb-4">
                          <History className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">No Trade History</h3>
                        <p className="text-slate-500">Closed trades will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(tradeHistory).map(([sessionId, sessionData]) => (
                          <div
                            key={sessionId}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 transition-all hover:border-slate-600/50 hover:bg-slate-800/70"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${sessionData.trade_details.action === 'buy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                  <h3 className="font-medium text-white">
                                    {sessionData.trade_details.symbol.replace('m', '')}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 rounded ${sessionData.trade_details.action === 'buy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                                    {sessionData.trade_details.action.toUpperCase()}
                                  </span>
                                  {sessionData.expired && (
                                    <span className="text-xs px-2 py-1 rounded bg-amber-900/50 text-amber-400">
                                      EXPIRED
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-400 flex flex-wrap gap-4">
                                  <span>Opened: {new Date(sessionData.timestamp).toLocaleString()}</span>
                                  <span>Closed: {new Date(sessionData.closing_time).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className={`text-xl font-bold ${sessionData.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {formatCurrency(sessionData.total_profit)}
                                </div>
                              </div>
                            </div>

                            {/* Account Profits */}
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              <h4 className="text-slate-400 text-sm font-medium mb-2">Account Profits:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {sessionData.account_profits.map((account, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-slate-400">Acc {account.account}:</span>
                                    <span className={account.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                      {formatCurrency(account.profit)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="text-center">
              <p className="text-slate-500">
                Secure • Automated • Professional Trading Execution Platform
              </p>
              <p className="text-slate-600 text-sm mt-2">
                Real-time market data • Advanced risk management • Multi-account support
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modify Session Modal */}
      {modifySession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">
              Modify Order: {modifySession.trade_details.symbol.replace('m', '')}
            </h3>

            <div className="mb-6">
              <label className="block text-slate-400 mb-2">New Stop Loss</label>
              <input
                type="number"
                step="0.00001"
                placeholder="Enter new SL"
                value={newSL}
                onChange={(e) => setNewSL(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 mb-2">New Take Profit</label>
              <input
                type="number"
                step="0.00001"
                placeholder="Enter new TP"
                value={newTP}
                onChange={(e) => setNewTP(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setModifySession(null)}
                className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModifySubmit}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {closeSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Close Trading Session?
            </h3>
            <p className="text-slate-400 mb-8 text-center">
              This will close all positions in session {closeSession}
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => setCloseSession(null)}
                className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseConfirm}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}