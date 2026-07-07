import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase.js";

export default function AdminAuth({ onSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message || "Authentication failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    if (data.user) {
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen relative text-[#f4f4f5] font-body selection:bg-white/20 flex items-center justify-center px-4 overflow-x-hidden"
      style={{ background: "#070707" }}
    >
      {/* Ambient glow */}
      <div className="lg-glow" style={{ top: "20%", left: "20%", width: "400px", height: "400px", background: "rgba(167,139,250,0.08)" }} />
      <div className="lg-glow" style={{ bottom: "20%", right: "20%", width: "350px", height: "350px", background: "rgba(52,211,153,0.05)" }} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="lg-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white/60 hover:text-white transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </button>

        {/* Auth card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="lg-modal rounded-2xl p-8 sm:p-10"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl lg-elevated flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white/80" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl text-white text-center mb-2">
            Admin Access
          </h1>
          <p className="text-sm text-white/30 text-center mb-8">
            Sign in to manage templates
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Admin email"
                autoFocus
                className={`lg-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all ${
                  error ? "!border-[#f87171]/50" : ""
                }`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Password"
                className={`lg-input w-full rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all ${
                  error ? "!border-[#f87171]/50" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-[#f87171] px-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-[#070707] text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {loading ? "Authenticating..." : "Authenticate"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
