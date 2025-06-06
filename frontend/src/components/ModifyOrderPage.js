import React, { useState } from "react";
import { Shield, Target, Edit3, CheckCircle, XCircle } from "lucide-react";
import {useLocation} from "react-router-dom";

export default function ModifyOrderPage() {

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlSessionId = queryParams.get("sessionId");

  const [form, setForm] = useState({
    session_id: urlSessionId,
    new_sl: "",
    new_tp: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];

    if (!form.session_id) errors.push("Session ID is required");
    if (!form.new_sl && !form.new_tp) {
      errors.push("At least one of Stop Loss or Take Profit must be provided");
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setLastResult({
        success: false,
        error: validationErrors.join(", "),
        type: "validation"
      });
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const payload = {
        session_id: form.session_id,
        ...(form.new_sl && { new_sl: parseFloat(form.new_sl) }),
        ...(form.new_tp && { new_tp: parseFloat(form.new_tp) })
      };

      const response = await fetch("http://localhost:8000/modify_positions", {
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
        setForm({ session_id: "", new_sl: "", new_tp: "" });
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

  const inputClass = (fieldName) => `
    w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
    text-white placeholder-slate-400 backdrop-blur-sm
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
    focus:bg-slate-800/70 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/10
    hover:border-slate-600/50 hover:bg-slate-800/60
    ${focusedField === fieldName ? 'transform scale-[1.02]' : ''}
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
            {isSuccess ? 'Modification Successful!' : 'Modification Failed'}
          </span>
        </div>

        {isSuccess && result.data ? (
          <div className="text-slate-300 text-sm space-y-1">
            <p>✓ Positions modified: {result.data.successful_modifications}</p>
            {result.data.failed_modifications > 0 && (
              <p className="text-amber-400">⚠ Failed modifications: {result.data.failed_modifications}</p>
            )}
            {result.data.new_sl && <p>New Stop Loss: {result.data.new_sl}</p>}
            {result.data.new_tp && <p>New Take Profit: {result.data.new_tp}</p>}
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl mb-4 shadow-lg shadow-purple-500/25">
            <Edit3 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Modify Order
          </h1>
          <p className="text-slate-400">Adjust stop loss and take profit levels for existing positions</p>
        </div>

        <ResultDisplay result={lastResult} />

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Edit3 className="w-5 h-5" />
                <span className="font-medium">Session Information</span>
              </div>

              <div className="relative">
                <input
                  name="session_id"
                  type="text"
                  placeholder="Session ID (Required)"
                  value={form.session_id}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("session_id")}
                  onBlur={() => setFocusedField("")}
                  className={inputClass("session_id")}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-300 mb-3">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Adjust Levels</span>
              </div>

              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  name="new_sl"
                  type="number"
                  step="0.00001"
                  placeholder="New Stop Loss (Optional)"
                  value={form.new_sl}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("new_sl")}
                  onBlur={() => setFocusedField("")}
                  className={`${inputClass("new_sl")} pl-10`}
                />
              </div>

              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  name="new_tp"
                  type="number"
                  step="0.00001"
                  placeholder="New Take Profit (Optional)"
                  value={form.new_tp}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("new_tp")}
                  onBlur={() => setFocusedField("")}
                  className={`${inputClass("new_tp")} pl-10`}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-lg">Updating Positions...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Edit3 className="w-6 h-6" />
                  <span className="text-lg">Modify Positions</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Position Management • Risk Adjustment • Active Session Control
          </p>
        </div>
      </div>
    </div>
  );
}