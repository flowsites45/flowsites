import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { createSubscription, verifyPayment, openRazorpayCheckout, getPlanId } from "../../lib/razorpay.js";

const premiumFeatures = [
  { text: "Unlimited access to all assets", included: true },
  { text: "Background assets", included: false },
  { text: "Unlimited access to all future assets", included: true },
  { text: "Commercial license", included: true },
  { text: "Dedicated support", included: true },
];

const premiumPlusFeatures = [
  { text: "Unlimited access to all assets", included: true },
  { text: "Background assets", included: true },
  { text: "Unlimited access to all future assets", included: true },
  { text: "Commercial license", included: true },
  { text: "Dedicated support", included: true },
];

export default function PricingPage({ onHome, onGallery, onGetStarted, session, userProfile, onAuthRequired, onSubscribeSuccess, pendingSubscribePlanId, onClearPendingSubscribe }) {
  const [yearly, setYearly] = useState(true);
  const premiumPrice = yearly ? 10 : 20;
  const premiumPlusPrice = yearly ? 15 : 30;
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-trigger checkout if user just authenticated with a pending plan
  useEffect(() => {
    if (pendingSubscribePlanId && session) {
      onClearPendingSubscribe && onClearPendingSubscribe();
      // Small delay to let the page render before opening Razorpay
      setTimeout(() => handleSubscribe(pendingSubscribePlanId), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSubscribePlanId, session]);

  const handleSubscribe = async (planKey) => {
    setError("");
    setSuccess(false);
    setLoading(planKey);

    // Gate behind authentication
    if (!session) {
      setLoading(null);
      onAuthRequired && onAuthRequired(planKey);
      return;
    }

    try {
      const billingCycle = yearly ? "Yearly" : "Monthly";
      const planName = planKey === "premium" ? "Premium" : "Premium+";
      const planId = getPlanId(planKey, billingCycle);

      const userEmail = session?.user?.email || "";

      const { subscription_id, key_id } = await createSubscription(planKey, billingCycle, userEmail);

      openRazorpayCheckout({
        key_id,
        subscription_id,
        planName,
        billingCycle,
        userEmail,
        onSuccess: async (paymentData) => {
          try {
            await verifyPayment({
              ...paymentData,
              plan_name: planName,
              billing_cycle: billingCycle,
              razorpay_plan_id: planId,
              user_email: userEmail,
            });
            setSuccess(true);
            setLoading(null);
            onSubscribeSuccess && onSubscribeSuccess(planKey);
          } catch (err) {
            setError("Payment verification failed: " + err.message);
            setLoading(null);
          }
        },
        onDismiss: () => {
          setLoading(null);
        },
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen relative text-[#f4f4f5] font-body selection:bg-white/20 overflow-x-hidden flex flex-col"
      style={{ background: "#070707" }}
    >
      {/* Subtle ambient glow */}
      <div className="lg-glow" style={{ top: "10%", left: "50%", transform: "translateX(-50%)", width: "500px", height: "500px", background: "rgba(255,255,255,0.02)" }} />

      {/* Header */}
      <header className="lg-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <button onClick={onHome} className="text-xl font-semibold tracking-tight text-white flex items-center gap-1.5 justify-self-start cursor-pointer hover:text-white/80 transition-colors">
              <span>✦ Flowsites</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={onGallery} className="lg-pill px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors">
                Browse Gallery
              </button>
              <button
                onClick={onGetStarted}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#070707] text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-xl mx-auto mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-white mb-4">
            GO UNLIMITED
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed">
            Choose the plan that fits your needs.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <span className={`text-sm font-medium transition-colors ${!yearly ? "text-white" : "text-white/35"}`}>Monthly</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className="lg-pill relative w-14 h-8 rounded-full flex items-center px-1 transition-colors"
            aria-label="Toggle billing period"
          >
            <motion.div
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
              style={{ marginLeft: yearly ? "auto" : 0 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? "text-white" : "text-white/35"}`}>
            Yearly
            <span className="text-[10px] font-semibold text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 px-2 py-0.5 rounded-full">Save 50%</span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
          {/* Premium Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg-card rounded-[1.5rem] w-full md:flex-1 p-8 md:p-10"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-xl text-white/90 mb-4">Premium</h2>
              <div className="flex items-end justify-center gap-1.5 mb-2">
                <span className="font-display text-5xl text-white tracking-tight">${premiumPrice}</span>
                <span className="text-white/40 text-sm mb-2">/mo</span>
              </div>
              {yearly && (
                <p className="text-xs text-white/40">Billed annually (${premiumPrice * 12}/yr)</p>
              )}
            </div>

            <div className="w-full h-px bg-white/8 mb-7" />

            <ul className="space-y-4 mb-8">
              {premiumFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                    {f.included ? (
                      <Check className="w-3 h-3 text-white/70" />
                    ) : (
                      <span className="text-white/30 text-xs">✕</span>
                    )}
                  </div>
                  <span className={f.included ? "text-white/75" : "text-white/35 line-through"}>{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe("premium")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-[#070707] text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading === "premium" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </motion.div>

          {/* Premium+ Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg-card rounded-[1.5rem] w-full md:flex-1 p-8 md:p-10 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-[#070707] text-[10px] font-semibold tracking-wide">
              BEST VALUE
            </div>
            <div className="text-center mb-8">
              <h2 className="font-display text-xl text-white/90 mb-4">Premium+</h2>
              <div className="flex items-end justify-center gap-1.5 mb-2">
                <span className="font-display text-5xl text-white tracking-tight">${premiumPlusPrice}</span>
                <span className="text-white/40 text-sm mb-2">/mo</span>
              </div>
              {yearly && (
                <p className="text-xs text-white/40">Billed annually (${premiumPlusPrice * 12}/yr)</p>
              )}
            </div>

            <div className="w-full h-px bg-white/8 mb-7" />

            <ul className="space-y-4 mb-8">
              {premiumPlusFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white/70" />
                  </div>
                  <span className="text-white/75">{f.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe("premium+")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-[#070707] text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading === "premium+" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </motion.div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-4 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 mt-6 text-sm text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 rounded-full px-4 py-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Subscription activated! Welcome to Flowsites Pro.</span>
          </div>
        )}

      </main>
    </div>
  );
}
