import React, { useState } from "react";
import Axios from "../Api/Axios";
import { FiX } from "react-icons/fi";

const SetPasswordDialog = ({ open, email, onClose }) => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resending, setResending] = useState(false);

  if (!open || !email) return null;

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await Axios.post("/otp/set-password", { email, otp, password });
      setSuccess("Password updated. Redirecting...");
      setTimeout(() => { window.location.href = "/login"; }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError("");
    try {
      await Axios.post("/otp/send-otp", { email });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <FiX size={16} />
        </button>
        <h2 className="text-base font-bold text-white mb-1">Set New Password</h2>
        <p className="text-xs text-white/40 mb-5">Enter the OTP sent to <span className="text-white/60">{email}</span></p>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-white/50">OTP</label>
              <button type="button" onClick={handleResendOtp} disabled={resending}
                className="text-xs text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors">
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
            <input
              type="text"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
          {success && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">{success}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-md transition-colors">
            {loading ? "Setting..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordDialog;
