import React, { useState } from "react";
import Axios from "../Api/Axios";
import { FiX } from "react-icons/fi";

const ForgetPasswordDialog = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await Axios.post("/otp/send-otp", { email });
      onSuccess(email);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <FiX size={16} />
        </button>
        <h2 className="text-base font-bold text-white mb-1">Forgot Password</h2>
        <p className="text-xs text-white/40 mb-5">Enter your email and we'll send an OTP</p>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email Address</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgetPasswordDialog;
