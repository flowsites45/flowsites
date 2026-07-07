import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase.js";

export default function Auth({ onBack, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function toggleMode() {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setShowPassword(false);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user && !data.session) {
        setError("Check your email for a confirmation link to complete sign up.");
        setLoading(false);
        return;
      }
      if (data.session && onSuccess) onSuccess();
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      if (data.user && onSuccess) onSuccess();
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen relative text-[#f4f4f5] font-body selection:bg-white/20 flex items-center justify-center px-4 overflow-x-hidden"
      style={{ background: "#070707" }}
    >
      {/* Ambient glow orbs */}
      <div className="lg-glow" style={{ top: "15%", left: "15%", width: "450px", height: "450px", background: "rgba(167,139,250,0.08)" }} />
      <div className="lg-glow" style={{ bottom: "15%", right: "15%", width: "400px", height: "400px", background: "rgba(52,211,153,0.05)" }} />
      <div className="lg-glow" style={{ top: "45%", right: "25%", width: "350px", height: "350px", background: "rgba(251,191,36,0.03)" }} />

      {/* Back button */}
      <button
        onClick={onBack}
        className="lg-pill absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white/60 hover:text-white transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </button>

      {/* Brand */}
      <div className="absolute top-6 right-6 z-20 text-xl font-semibold tracking-tight text-white font-body">
        <span>✦ Flowsites</span>
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="lg-modal relative z-10 w-full max-w-md rounded-[2rem] p-8 md:p-10"
      >
        {/* Mode toggle */}
        <div className="relative flex mb-8 p-1 rounded-full bg-white/5 border border-white/10">
          <motion.div
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white/15 border border-white/10"
            style={{ left: mode === "login" ? 4 : "calc(50% + 0px)" }}
          />
          <button
            onClick={() => setMode("login")}
            className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "login" ? "text-white" : "text-white/40"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "signup" ? "text-white" : "text-white/40"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h1 className="font-display text-3xl text-white mb-1.5">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-white/30">
              {mode === "login"
                ? "Sign in to continue building beautiful sites."
                : "Start designing with premium AI prompts today."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-xs text-[#f87171]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "login" ? 16 : -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name field — signup only */}
            {mode === "signup" && (
              <div className="relative w-full">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Full name"
                  className="lg-input w-full rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative w-full">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email address"
                className="lg-input w-full rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative w-full">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                className="lg-input w-full rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot password — login only */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white text-[#070707] font-medium text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-white/20">or continue with</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Toggle link */}
        <p className="text-center text-sm text-white/30 mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="font-medium text-white hover:underline transition-all"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
