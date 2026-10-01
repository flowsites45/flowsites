import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Zap, Crown, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { getDailyCopyStats } from "../lib/access.js";

const planConfig = {
  free: {
    label: "Free Plan",
    icon: Sparkles,
    pillClass: "bg-white/[0.04] border-white/10 border-t-white/20 text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]",
    dotClass: "bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.6)]",
    dotPingClass: "bg-white/40",
  },
  premium: {
    label: "Premium Plan",
    icon: Zap,
    pillClass: "bg-white/[0.08] border-white/20 border-t-white/35 text-white shadow-[0_2px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
    dotClass: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]",
    dotPingClass: "bg-white/50",
  },
  premium_plus: {
    label: "Premium+ Plan",
    icon: Crown,
    pillClass: "bg-white/[0.1] border-white/25 border-t-white/45 text-white shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]",
    dotClass: "bg-white shadow-[0_0_10px_rgba(255,255,255,1)]",
    dotPingClass: "bg-white/60",
  },
};

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return email ? email[0].toUpperCase() : "U";
}

export default function UserProfileMenu({ session, userProfile, onUpgrade, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const plan = userProfile?.plan || "free";
  const config = planConfig[plan] || planConfig.free;
  const PlanIcon = config.icon;

  const name = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || userProfile?.full_name || "";
  const email = session?.user?.email || userProfile?.email || "";
  const avatarUrl = session?.user?.user_metadata?.avatar_url || userProfile?.avatar_url || "";
  const initials = getInitials(name, email);

  const renewalDate = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const [dailyStats, setDailyStats] = useState(() => getDailyCopyStats(userProfile, session));

  useEffect(() => {
    setDailyStats(getDailyCopyStats(userProfile, session));

    const handleCopyUpdate = () => {
      setDailyStats(getDailyCopyStats(userProfile, session));
    };

    window.addEventListener("flowsites_daily_copy_updated", handleCopyUpdate);
    return () => window.removeEventListener("flowsites_daily_copy_updated", handleCopyUpdate);
  }, [userProfile, session]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session) return null;

  return (
    <div ref={ref} className="relative inline-block text-left">
      {/* Avatar Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.98] border border-white/10 border-t-white/25 shadow-[0_2px_8px_rgba(0,0,0,0.3),0_8px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.4),0_12px_28px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.25)] hover:border-white/20 backdrop-blur-xl transition-all duration-300 cursor-pointer select-none"
        aria-expanded={open}
        aria-label="User profile menu"
      >
        {/* Top specular highlight line */}
        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-80" />

        {/* Avatar badge (Solid, NO gradient) */}
        <div className="relative w-7 h-7 rounded-full bg-[#16161a] border border-white/15 border-t-white/30 shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_-1px_1px_rgba(0,0,0,0.4)] flex items-center justify-center text-xs font-semibold text-white select-none shrink-0 tracking-tight overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name || email} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Chevron indicator */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-all duration-300 ease-out ${
            open ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel — Apple-inspired Dark Liquid Glass */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2.5 w-80 max-w-[calc(100vw-1.5rem)] rounded-[22px] overflow-hidden z-[100] bg-[#0c0c0f]/95 backdrop-blur-2xl backdrop-saturate-[200%] border border-white/12 border-t-white/30 border-b-white/5 shadow-[0_8px_16px_rgba(0,0,0,0.4),0_24px_48px_-8px_rgba(0,0,0,0.7),0_48px_88px_-16px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_-1px_1px_0_rgba(0,0,0,0.4)] select-none"
          >
            {/* Optical glass sheen & ambient glow */}
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-white/[0.04] blur-2xl rounded-full pointer-events-none" />

            {/* User Identity Header */}
            <div className="p-4 sm:p-5 relative z-10">
              <div className="flex items-center gap-3.5 mb-3.5">
                {/* Solid Avatar (NO GRADIENT) */}
                <div className="relative w-11 h-11 rounded-full bg-[#16161a] border border-white/15 border-t-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_1.5px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.5)] flex items-center justify-center text-sm font-bold text-white select-none shrink-0 tracking-tight overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name || email} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-semibold text-base">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {name ? (
                    <>
                      <p className="text-sm font-semibold text-white tracking-tight leading-snug truncate">{name}</p>
                      <p className="text-xs text-white/45 truncate font-mono mt-0.5">{email}</p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-white truncate font-mono">{email}</p>
                  )}
                </div>
              </div>

              {/* Plan Badge — Tactile, Multi-layer Jewel Capsule */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${config.pillClass}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotPingClass}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
                  </span>
                  <PlanIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{config.label}</span>
                </div>

                {renewalDate && plan !== "free" && (
                  <span className="text-[11px] text-white/40 font-mono tracking-tight">
                    Renews {renewalDate}
                  </span>
                )}
              </div>

              {/* Quota Indicator for Premium Tier */}
              {plan === "premium" && (
                <div className="mt-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/85 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Daily Prompts Quota
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        dailyStats.remaining > 0
                          ? "bg-white/10 text-white border border-white/15"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {dailyStats.used}/3 used today
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dailyStats.remaining > 0
                          ? "bg-gradient-to-r from-amber-400 to-amber-200"
                          : "bg-red-400"
                      }`}
                      style={{
                        width: `${Math.min(100, (dailyStats.used / 3) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-white/45 mt-1.5 font-medium flex items-center justify-between">
                    <span>
                      {dailyStats.remaining > 0
                        ? `${dailyStats.remaining} ${
                            dailyStats.remaining === 1 ? "prompt copy" : "prompt copies"
                          } left today`
                        : "Daily limit reached for today"}
                    </span>
                    {dailyStats.remaining === 0 && (
                      <button
                        type="button"
                        className="text-amber-400 font-semibold hover:underline cursor-pointer"
                        onClick={() => {
                          setOpen(false);
                          onUpgrade?.();
                        }}
                      >
                        Upgrade to Unlimited →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quota Indicator for Premium+ Tier */}
              {plan === "premium_plus" && (
                <div className="mt-3 p-2.5 px-3 rounded-2xl bg-white/[0.04] border border-white/10 border-t-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/85 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    Prompt Copies & Downloads
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Unlimited VIP
                  </span>
                </div>
              )}
            </div>

            {/* Etched Glass Divider */}
            <div className="relative mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent shadow-[0_1px_0_rgba(0,0,0,0.5)]" />

            {/* Actions Menu */}
            <div className="p-2 space-y-1.5 relative z-10">
              {(plan === "free" || plan === "premium") && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); onUpgrade?.(); }}
                  className="group relative w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 border-t-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300 cursor-pointer text-left overflow-hidden"
                >
                  <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-80" />

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-8 h-8 rounded-xl bg-white/[0.06] border border-white/15 shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center text-white shrink-0 group-hover:bg-white/[0.1] group-hover:border-white/25 transition-all duration-200">
                      <Crown className="w-4 h-4 fill-white/15 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-tight group-hover:text-white transition-colors">
                        {plan === "free" ? "Upgrade to Premium" : "Upgrade to Premium+"}
                      </p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5 font-normal">
                        {plan === "free" ? "Unlock full prompt library" : "Unlimited VIP access"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2" />
                </button>
              )}

              <button
                type="button"
                onClick={() => { setOpen(false); onLogout?.(); }}
                className="group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.05] active:scale-[0.99] border border-transparent hover:border-white/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/8 group-hover:bg-red-500/15 group-hover:border-red-500/30 group-hover:text-red-400 flex items-center justify-center text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] transition-all duration-200 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                    Sign out
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
