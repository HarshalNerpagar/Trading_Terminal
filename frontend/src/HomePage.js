// import React, { useState, useEffect } from "react";
// import {
//   Zap,
//   Edit3,
//   BookOpen,
//   TrendingUp,
//   Shield,
//   Activity,
//   BarChart3,
//   DollarSign,
//   Users,
//   Clock,
//   Target,
//   ArrowRight,
//   ChevronRight
// } from "lucide-react";
//
// export default function TradingHomePage() {
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [selectedRoute, setSelectedRoute] = useState(null);
//
//   // Update time every second
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);
//
//   // Trading routes configuration
//   const tradingRoutes = [
//     {
//       id: 'execute-order',
//       title: 'Execute Order',
//       description: 'Place new trades with advanced risk management and real-time execution',
//       icon: Zap,
//       color: 'from-emerald-600 to-blue-600',
//       hoverColor: 'from-emerald-700 to-blue-700',
//       shadowColor: 'shadow-emerald-500/25',
//       features: ['Market & Limit Orders', 'Risk Management', 'Real-time Pricing', 'Multi-pair Support'],
//       path: '/execute-order'
//     },
//     {
//       id: 'modify-order',
//       title: 'Modify Order',
//       description: 'Update existing orders, adjust stop losses, targets, and order parameters',
//       icon: Edit3,
//       color: 'from-purple-600 to-pink-600',
//       hoverColor: 'from-purple-700 to-pink-700',
//       shadowColor: 'shadow-purple-500/25',
//       features: ['Edit Active Orders', 'Adjust Stop Loss', 'Update Targets', 'Order Management'],
//       path: '/modify-order'
//     },
//     {
//       id: 'book-partial',
//       title: 'Book Partial',
//       description: 'Partially close positions and secure profits while maintaining market exposure',
//       icon: BookOpen,
//       color: 'from-orange-600 to-red-600',
//       hoverColor: 'from-orange-700 to-red-700',
//       shadowColor: 'shadow-orange-500/25',
//       features: ['Partial Closures', 'Profit Booking', 'Position Scaling', 'Risk Reduction'],
//       path: '/book-partial'
//     }
//   ];
//
//   // Market stats (placeholder data - will be replaced with real data)
//   const marketStats = [
//     { label: 'Active Orders', value: '12', icon: Activity, change: '+3' },
//     { label: 'Total Volume', value: '45.7', icon: BarChart3, change: '+12.5%' },
//     { label: 'Success Rate', value: '87.5%', icon: Target, change: '+2.1%' },
//     { label: 'P&L Today', value: '+$1,247', icon: TrendingUp, change: '+15.3%' }
//   ];
//
//   const handleRouteClick = (route) => {
//     setSelectedRoute(route.id);
//     // Here you would typically use React Router
//     // For now, we'll just show selection
//     setTimeout(() => {
//       alert(`Navigating to ${route.title}...`);
//       setSelectedRoute(null);
//     }, 500);
//   };
//
//   const RouteCard = ({ route }) => (
//     <div
//       onClick={() => handleRouteClick(route)}
//       className={`
//         group relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50
//         rounded-3xl p-8 cursor-pointer transition-all duration-500 ease-out
//         hover:bg-slate-800/50 hover:border-slate-600/50 hover:scale-[1.02]
//         hover:shadow-2xl ${route.shadowColor}
//         ${selectedRoute === route.id ? 'scale-[1.02] shadow-2xl ' + route.shadowColor : ''}
//       `}
//     >
//       {/* Route Icon */}
//       <div className={`
//         inline-flex items-center justify-center w-16 h-16 mb-6
//         bg-gradient-to-r ${route.color} rounded-2xl shadow-lg
//         group-hover:scale-110 transition-transform duration-300
//       `}>
//         <route.icon className="w-8 h-8 text-white" />
//       </div>
//
//       {/* Route Title & Description */}
//       <div className="mb-6">
//         <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all duration-300">
//           {route.title}
//         </h3>
//         <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
//           {route.description}
//         </p>
//       </div>
//
//       {/* Features List */}
//       <div className="space-y-3 mb-6">
//         {route.features.map((feature, index) => (
//           <div key={index} className="flex items-center space-x-3 text-sm">
//             <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
//             <span className="text-slate-300 group-hover:text-white transition-colors duration-300">
//               {feature}
//             </span>
//           </div>
//         ))}
//       </div>
//
//       {/* Action Arrow */}
//       <div className="flex items-center justify-between">
//         <div className={`
//           px-4 py-2 bg-gradient-to-r ${route.color} rounded-xl text-white text-sm font-medium
//           opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0
//         `}>
//           Access Now
//         </div>
//         <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
//       </div>
//
//       {/* Loading overlay for selected state */}
//       {selectedRoute === route.id && (
//         <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
//           <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//         </div>
//       )}
//     </div>
//   );
//
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//       {/* Background Elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
//       </div>
//
//       <div className="relative">
//         {/* Header */}
//         <header className="p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="flex items-center justify-between mb-8">
//               <div>
//                 <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
//                   Trading Terminal
//                 </h1>
//                 <p className="text-xl text-slate-400">
//                   Professional automated trading execution platform
//                 </p>
//               </div>
//
//               {/* Live Clock */}
//               <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
//                 <div className="flex items-center space-x-3">
//                   <Clock className="w-5 h-5 text-blue-400" />
//                   <div className="text-right">
//                     <div className="text-white font-mono text-lg">
//                       {currentTime.toLocaleTimeString()}
//                     </div>
//                     <div className="text-slate-400 text-sm">
//                       {currentTime.toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//
//             {/* Market Stats Dashboard */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//               {marketStats.map((stat, index) => (
//                 <div key={index} className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
//                   <div className="flex items-center justify-between mb-4">
//                     <stat.icon className="w-8 h-8 text-blue-400" />
//                     <span className="text-emerald-400 text-sm font-medium">
//                       {stat.change}
//                     </span>
//                   </div>
//                   <div className="text-2xl font-bold text-white mb-1">
//                     {stat.value}
//                   </div>
//                   <div className="text-slate-400 text-sm">
//                     {stat.label}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </header>
//
//         {/* Main Navigation Section */}
//         <main className="px-8 pb-12">
//           <div className="max-w-7xl mx-auto">
//             {/* Section Header */}
//             <div className="text-center mb-12">
//               <h2 className="text-3xl font-bold text-white mb-4">
//                 Trading Operations
//               </h2>
//               <p className="text-slate-400 text-lg max-w-2xl mx-auto">
//                 Choose your trading operation to access advanced tools and execute with precision
//               </p>
//             </div>
//
//             {/* Route Cards Grid */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//               {tradingRoutes.map((route) => (
//                 <RouteCard key={route.id} route={route} />
//               ))}
//             </div>
//
//             {/* Quick Actions Bar */}
//             <div className="mt-16 bg-slate-800/20 backdrop-blur-xl border border-slate-700/30 rounded-3xl p-8">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
//                     <Shield className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-white font-semibold">Risk Management</h3>
//                     <p className="text-slate-400 text-sm">Advanced position sizing and stop-loss automation</p>
//                   </div>
//                 </div>
//
//                 <div className="flex items-center space-x-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-emerald-400">5</div>
//                     <div className="text-slate-400 text-xs">Active Accounts</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-400">24/7</div>
//                     <div className="text-slate-400 text-xs">Monitoring</div>
//                   </div>
//                   <ArrowRight className="w-6 h-6 text-slate-400" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//
//         {/* Footer */}
//         <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
//           <div className="max-w-7xl mx-auto px-8 py-8">
//             <div className="text-center">
//               <p className="text-slate-500">
//                 Secure • Automated • Professional Trading Execution Platform
//               </p>
//               <p className="text-slate-600 text-sm mt-2">
//                 Real-time market data • Advanced risk management • Multi-account support
//               </p>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }









// ######### New Version ##########\




import React, { useState, useEffect } from "react";
import {
  Activity,
  BarChart3,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Edit3,
  X,
  ArrowRight,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TradingHomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketStats] = useState([
    { label: 'Active Sessions', value: '5', icon: Activity, change: '+2' },
    { label: 'Total Volume', value: '45.7', icon: BarChart3, change: '+12.5%' },
    { label: 'Success Rate', value: '87.5%', icon: Target, change: '+2.1%' },
    { label: 'P&L Today', value: '+$1,247', icon: TrendingUp, change: '+15.3%' }
  ]);
  const navigate = useNavigate();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active sessions
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await fetch('http://localhost:8000/active_sessions');
        const data = await response.json();
        setActiveSessions(data.sessions || {});
      } catch (error) {
        console.error('Error fetching active sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSessions();
  }, []);

  const handleModify = (sessionId) => {
    navigate(`/modify-order?sessionId=${sessionId}`);
  };

  const handleClose = (sessionId) => {
    navigate(`/close-order?sessionId=${sessionId}`);
  };

  const handleExecuteTrade = () => {
    navigate('/execute-order');
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
              {marketStats.map((stat, index) => (
                <div key={index} className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-blue-400" />
                    <span className="text-emerald-400 text-sm font-medium">
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 pb-12">
          <div className="max-w-7xl mx-auto">
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

              {/* Right Column - Active Sessions */}
              <div className="lg:w-2/3">
                <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Active Trading Sessions</h2>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : Object.keys(activeSessions).length === 0 ? (
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
                                  {sessionData.trade_details.symbol}
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
                            </div>

                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleModify(sessionId)}
                                className="flex items-center space-x-1 px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-200 hover:text-white rounded-xl transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Modify</span>
                              </button>
                              <button
                                onClick={() => handleClose(sessionId)}
                                className="flex items-center space-x-1 px-4 py-2 bg-rose-600/50 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl transition-colors"
                              >
                                <X className="w-4 h-4" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/*// Modify session data mapping*/}
                      {/*{Object.entries(activeSessions).map(([sessionId, sessionData]) => {*/}
                      {/*  const details = sessionData.trade_details;*/}
                      {/*  return (*/}
                      {/*    <div key={sessionId} className="...">*/}
                      {/*      /!* ... existing code ... *!/*/}
                      {/*      <div className="text-sm text-slate-400 flex flex-wrap gap-4">*/}
                      {/*        <span>SL: {details.stop_loss}</span>*/}
                      {/*        {details.target_level && (*/}
                      {/*          <span>TP: {details.target_level}</span>*/}
                      {/*        )}*/}
                      {/*        <span>{new Date(sessionData.timestamp).toLocaleTimeString()}</span>*/}
                      {/*      </div>*/}
                      {/*    </div>*/}
                      {/*  );*/}
                      {/*})}*/}
                    </div>
                  )}
                </div>
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
    </div>
  );
}