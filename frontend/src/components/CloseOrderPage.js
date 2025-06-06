import React, { useState } from "react";
import { BookOpen, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "react-router-dom";



export default function CloseOrderPage() {

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlSessionId = queryParams.get("sessionId");

  const [sessionId, setSessionId] = useState(urlSessionId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSubmit = async () => {


    if (isSubmitting || !sessionId) {
      setLastResult({
        success: false,
        error: "Session ID is required",
        type: "validation"
      });
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const payload = { session_id: sessionId };

      const response = await fetch("http://localhost:8000/close_positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          data: data,
          type: "success"
        });
        setSessionId("");
      } else {
        setLastResult({
          success: false,
          error: data.detail || "Unknown error occurred",
          type: "api_error"
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        error: `Network error: ${error.message}`,
        type: "network_error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `
    w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
    text-white placeholder-slate-400 backdrop-blur-sm mb-6
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
    focus:bg-slate-800/70 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10
    hover:border-slate-600/50 hover:bg-slate-800/60
  `;

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
            {isSuccess ? 'Positions Closed Successfully!' : 'Closure Failed'}
          </span>
        </div>

        {isSuccess && result.data ? (
          <div className="text-slate-300 text-sm space-y-1">
            <p>✓ Positions closed: {result.data.successful_closures}</p>
            {result.data.failed_closures > 0 && (
              <p className="text-amber-400">⚠ Failed closures: {result.data.failed_closures}</p>
            )}
          </div>
        ) : (
          <p className="text-slate-300 text-sm">{result.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl mb-4 shadow-lg shadow-orange-500/25">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Close Positions
          </h1>
          <p className="text-slate-400">Close all positions in a trading session</p>
        </div>

        <ResultDisplay result={lastResult} />

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Session Information</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Session ID (Required)"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-lg">Closing Positions...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <BookOpen className="w-6 h-6" />
                  <span className="text-lg">Close All Positions</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Position Management • Session Control • Risk Mitigation
          </p>
        </div>
      </div>
    </div>
  );
}