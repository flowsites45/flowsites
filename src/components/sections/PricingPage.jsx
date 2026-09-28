import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, ArrowRight, Loader2, AlertCircle, Tag, Percent } from "lucide-react";
import { createSubscription, verifyPayment, openRazorpayCheckout, getPlanId, getPlanLink } from "../../lib/razorpay.js";
import LiquidMetalButton from "../ui/LiquidMetalButton.jsx";
import LiquidMetalCardBorder from "../ui/LiquidMetalCardBorder.jsx";

const premiumFeatures = [
  { text: "3 Prompt copies / day", included: true },
  { text: "Get access to all future assets", included: true },
  { text: "Commercial license", included: true },
  { text: "Dedicated support", included: true },
  { text: "No background assets", included: false },
];

const premiumPlusFeatures = [
  { text: "Unlimited access to all templates", included: true },
  { text: "Background assets", included: true },
  { text: "Unlimited access to all future assets", included: true },
  { text: "Commercial license", included: true },
  { text: "Dedicated support", included: true },
];

export default function PricingPage({
  onHome,
  onGallery,
  onGetStarted,
  session,
  userProfile,
  onAuthRequired,
  onSubscribeSuccess,
  pendingSubscribePlanId,
  onClearPendingSubscribe,
}) {
  const [yearly, setYearly] = useState(true);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Coupon state: 30% discount applied to all plans
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const hasDiscount = Boolean(appliedCoupon);

  // Plan pricing configurations
  // Premium: $50/mo, $180/yr ($15/mo equivalent, 70% off)
  // Premium+: $80/mo, $288/yr ($24/mo equivalent, 70% off)
  const getPlanPricing = (planKey) => {
    const isPrem = planKey === "premium";

    if (yearly) {
      const regMonthly = isPrem ? 15 : 24;
      const regAnnual = isPrem ? 180 : 288;

      if (hasDiscount) {
        // 30% off yearly: Premium $126/yr ($10.50/mo), Premium+ $202/yr ($16.83/mo)
        const discAnnual = isPrem ? 126 : 202;
        const discMonthly = isPrem ? 10.5 : 16.83;
        return {
          displayMonthly: discMonthly % 1 === 0 ? discMonthly : discMonthly.toFixed(2),
          originalMonthly: regMonthly,
          displayAnnual: discAnnual,
          originalAnnual: regAnnual,
          subtext: `Billed annually ($${discAnnual}/yr, was $${regAnnual}/yr)`,
        };
      }

      return {
        displayMonthly: regMonthly,
        originalMonthly: null,
        displayAnnual: regAnnual,
        originalAnnual: regAnnual,
        subtext: `Billed annually ($${regAnnual}/yr)`,
      };
    } else {
      const regMonthly = isPrem ? 50 : 80;

      if (hasDiscount) {
        // 30% off monthly
        const discMonthly = +(regMonthly * 0.7).toFixed(2);
        return {
          displayMonthly: discMonthly % 1 === 0 ? discMonthly : discMonthly.toFixed(2),
          originalMonthly: regMonthly,
          subtext: `30% discount applied (was $${regMonthly}/mo)`,
        };
      }

      return {
        displayMonthly: regMonthly,
        originalMonthly: null,
        subtext: `Billed monthly`,
      };
    }
  };

  const premiumPricing = getPlanPricing("premium");
  const premiumPlusPricing = getPlanPricing("premium+");

  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a valid coupon code");
      return;
    }
    // Accept valid coupon codes (e.g. FLOW30, SAVE30, or custom codes)
    setAppliedCoupon(code);
    setCouponInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Auto-trigger checkout if user just authenticated with a pending plan
  useEffect(() => {
    if (pendingSubscribePlanId && session) {
      onClearPendingSubscribe && onClearPendingSubscribe();
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
      const planName = (planKey === "premium" ? "Premium" : "Premium+") + (hasDiscount ? " (30% Off)" : "");

      // If a direct payment link is configured for this plan, redirect directly
      const directLink = getPlanLink(planKey, billingCycle, hasDiscount);
      if (directLink && directLink.startsWith("http")) {
        window.location.href = directLink;
        return;
      }

      const planId = getPlanId(planKey, billingCycle, hasDiscount);
      const userEmail = session?.user?.email || "";

      const { subscription_id, key_id } = await createSubscription(planKey, billingCycle, userEmail, hasDiscount);

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
      <div
        className="lg-glow"
        style={{
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "500px",
          background: "rgba(255,255,255,0.02)",
        }}
      />

      {/* Header */}
      <header className="lg-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16 gap-2">
            <button
              onClick={onHome}
              className="text-lg sm:text-xl font-semibold tracking-tight text-white flex items-center gap-1.5 shrink-0 cursor-pointer hover:text-white/80 transition-colors"
            >
              <span>✦ Flowsites</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onGallery}
                className="lg-pill px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                <span className="sm:hidden">Browse</span>
                <span className="hidden sm:inline">Browse Gallery</span>
              </button>
              <button
                onClick={onGetStarted}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-[#070707] text-xs sm:text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
              >
                <span>Get Started</span> <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
          className="text-center max-w-xl mx-auto mb-10"
        >
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-white mb-4">
            Pricing
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed">
            Choose the plan that fits your creative workflow.
          </p>
        </motion.div>

        {/* Billing Toggle — Tactile Dark Liquid Glass (Save 70% Badge) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-3.5 mb-8 select-none"
        >
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`text-sm tracking-tight transition-all duration-200 cursor-pointer ${
              !yearly
                ? "text-white font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                : "text-white/40 hover:text-white/70 font-medium"
            }`}
          >
            Monthly
          </button>

          {/* Luxury Switch Pill */}
          <button
            type="button"
            onClick={() => setYearly((v) => !v)}
            className="relative w-12 h-7 rounded-full flex items-center p-0.5 transition-all duration-300 bg-[#16161a] border border-white/15 border-t-white/30 shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)] hover:border-white/25 cursor-pointer focus:outline-none"
            aria-label="Toggle billing period"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              className="w-5 h-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)]"
              style={{ marginLeft: yearly ? "auto" : 0 }}
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`text-sm tracking-tight transition-all duration-200 cursor-pointer ${
                yearly
                  ? "text-white font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                  : "text-white/40 hover:text-white/70 font-medium"
              }`}
            >
              Yearly
            </button>

            {/* Silver Badge — Save 70% */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight text-white/90 bg-white/[0.07] border border-white/15 border-t-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
              Save 70%
            </span>
          </div>
        </motion.div>

        {/* 30% Discount Coupon System */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md mb-10"
        >
          {hasDiscount ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/20 border-t-white/35 shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
                  <Percent className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white tracking-wide truncate">
                    Coupon <span className="underline font-mono">{appliedCoupon}</span> Applied
                  </p>
                  <p className="text-[11px] text-white/60">30% discount added to all plans & checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-xs text-white/50 hover:text-white underline cursor-pointer shrink-0 transition-colors px-2 py-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#111215]/80 border border-white/10 p-2 sm:p-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError("");
                    }}
                    placeholder="Enter coupon (e.g. FLOW30)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 uppercase tracking-wider focus:outline-none focus:border-white/30 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white text-[#070707] text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer shrink-0"
                >
                  Apply 30% Off
                </button>
              </form>
              <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-white/40">
                <span>Have a discount coupon?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon("FLOW30");
                    setCouponError("");
                  }}
                  className="text-white/70 hover:text-white underline cursor-pointer font-mono"
                >
                  Quick Apply: FLOW30
                </button>
              </div>
              {couponError && (
                <p className="text-[11px] text-red-400 mt-1.5 px-2">{couponError}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
          {/* Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-[1.5rem] w-full md:flex-1 p-8 md:p-10 bg-gradient-to-b from-[#121317]/95 via-[#0d0e12]/95 to-[#08080a]/98 border border-white/10 border-t-white/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85),0_8px_20px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_12px_28px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:-translate-y-1.5 will-change-transform"
          >
            {/* White Liquid Metal Procedural WebGL2 Shader Border Effect (Active on Hover) */}
            <LiquidMetalCardBorder borderRadius={24} speed={0.15} glow="subtle" />

            {hasDiscount && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-white/[0.12] border border-white/30 text-white text-[10px] font-bold tracking-wider uppercase shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md z-30 select-none">
                30% COUPON APPLIED
              </div>
            )}

            <div className="text-center mb-6 relative z-10">
              <h2 className="font-display text-xl text-white/90 mb-4">Premium</h2>
              <div className="flex items-end justify-center gap-1.5 mb-2">
                {premiumPricing.originalMonthly && (
                  <span className="font-display text-2xl text-white/30 line-through mb-1.5 mr-1">
                    ${premiumPricing.originalMonthly}
                  </span>
                )}
                <span className="font-display text-5xl text-white tracking-tight">
                  ${premiumPricing.displayMonthly}
                </span>
                <span className="text-white/40 text-sm mb-2">/mo</span>
              </div>
              <p className="text-xs text-white/40 mb-4 transition-opacity duration-200">
                {premiumPricing.subtext}
              </p>

              <div className={`w-full h-[50px] mb-3 ${loading !== null ? "opacity-60 pointer-events-none" : ""}`}>
                <LiquidMetalButton
                  onClick={() => loading === null && handleSubscribe("premium")}
                  labelStyle={{
                    fontSize: "14px",
                    fontWeight: "600",
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading === "premium" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Subscribe <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </LiquidMetalButton>
              </div>

              <p className="text-[10px] text-white/30 tracking-wide">
                Flowsites — service operated by Greyo AI company.
              </p>
            </div>

            <div className="w-full h-px bg-white/8 mb-7 relative z-10" />

            <ul className="space-y-4 mb-3 relative z-10">
              {premiumFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      f.included
                        ? "bg-white/[0.08] border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                        : "bg-white/[0.02] border-white/5"
                    }`}
                  >
                    {f.included ? (
                      <Check className="w-3 h-3 text-white/85" />
                    ) : (
                      <X className="w-3 h-3 text-white/25" />
                    )}
                  </div>
                  <span className={f.included ? "text-white/80 font-normal" : "text-white/30 font-normal"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Premium+ Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-[1.5rem] w-full md:flex-1 p-8 md:p-10 bg-gradient-to-b from-[#14151b]/95 via-[#0e0f14]/95 to-[#08080a]/98 border border-white/12 border-t-white/25 shadow-[0_24px_55px_-12px_rgba(0,0,0,0.9),0_10px_24px_-6px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_34px_75px_-15px_rgba(0,0,0,0.98),0_14px_30px_-6px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:-translate-y-1.5 will-change-transform"
          >
            {/* White Liquid Metal Procedural WebGL2 Shader Border Effect (Active on Hover) */}
            <LiquidMetalCardBorder borderRadius={24} speed={0.15} glow="subtle" />

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-white text-[#070707] text-[10px] font-bold tracking-wider uppercase shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.25)] z-30 select-none">
              {hasDiscount ? "BEST VALUE • 30% OFF" : "BEST VALUE"}
            </div>

            <div className="text-center mb-6 relative z-10">
              <h2 className="font-display text-xl text-white/90 mb-4">Premium+</h2>
              <div className="flex items-end justify-center gap-1.5 mb-2">
                {premiumPlusPricing.originalMonthly && (
                  <span className="font-display text-2xl text-white/30 line-through mb-1.5 mr-1">
                    ${premiumPlusPricing.originalMonthly}
                  </span>
                )}
                <span className="font-display text-5xl text-white tracking-tight">
                  ${premiumPlusPricing.displayMonthly}
                </span>
                <span className="text-white/40 text-sm mb-2">/mo</span>
              </div>
              <p className="text-xs text-white/40 mb-4 transition-opacity duration-200">
                {premiumPlusPricing.subtext}
              </p>

              <div className={`w-full h-[50px] mb-3 ${loading !== null ? "opacity-60 pointer-events-none" : ""}`}>
                <LiquidMetalButton
                  onClick={() => loading === null && handleSubscribe("premium+")}
                  labelStyle={{
                    fontSize: "14px",
                    fontWeight: "600",
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading === "premium+" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Subscribe <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </LiquidMetalButton>
              </div>

              <p className="text-[10px] text-white/30 tracking-wide">
                Flowsites — service operated by Greyo AI company.
              </p>
            </div>

            <div className="w-full h-px bg-white/8 mb-7 relative z-10" />

            <ul className="space-y-4 mb-3 relative z-10">
              {premiumPlusFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white/85" />
                  </div>
                  <span className="text-white/80 font-normal">{f.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 mt-8 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-5 py-2.5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 mt-8 text-sm text-white/90 bg-white/[0.06] border border-white/15 border-t-white/30 rounded-full px-5 py-2.5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl"
          >
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-medium tracking-tight">Subscription activated! Welcome to Flowsites Premium.</span>
          </motion.div>
        )}
      </main>
    </div>
  );
}
