import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Zap, Crown, Sparkles, ChevronDown, User } from "lucide-react";
import { planLabel } from "../lib/access.js";

const planConfig = {
  free: {
    label: "Free",
    icon: Sparkles,
    color: "text-white/50",
    bg: "bg-white/8 border-white/10",
    dot: "bg-white/30",
  },
  premium: {
    label: "Premium",
    icon: Zap,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    dot: "bg-violet-400",
  },
  premium_plus: {
    label: "Premium+",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
};

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "U";
}

export default function UserProfileMenu({ session, userProfile, onUpgrade, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const plan = userProfile?.plan || "free";
  const config = planConfig[plan] || planConfig.free;
  const PlanIcon = config.icon;

  const name = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || "";
  const email = session?.user?.email || "";
  const initials = getInitials(name, email);

  const renewalDate = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

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
    <div ref={ref} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 lg-pill px-2 py-1.5 rounded-full transition-all hover:bg-white/10"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/50 to-amber-500/30 border border-white/20 flex items-center justify-center text-xs font-semibold text-white select-none">
          {initials}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-72 lg-modal rounded-2xl overflow-hidden z-[100] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/50 to-amber-500/30 border border-white/20 flex items-center justify-center text-sm font-bold text-white select-none shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  {name && (
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                  )}
                  <p className="text-xs text-white/40 truncate">{email}</p>
                </div>
              </div>

              {/* Plan badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${config.bg} ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                <PlanIcon className="w-3 h-3" />
                {config.label} Plan
              </div>

              {renewalDate && plan !== "free" && (
                <p className="text-xs text-white/30 mt-2">Renews {renewalDate}</p>
              )}
            </div>

            {/* Actions */}
            <div className="p-2">
              {plan === "free" && (
                <button
                  onClick={() => { setOpen(false); onUpgrade?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </button>
              )}
              {plan === "premium" && (
                <button
                  onClick={() => { setOpen(false); onUpgrade?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium+
                </button>
              )}
              <button
                onClick={() => { setOpen(false); onLogout?.(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-[#f87171] hover:bg-[#f87171]/8 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
