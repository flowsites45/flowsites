/**
 * Access control & Daily Quota helper.
 * 
 * Subscription Tiers:
 * - Free: Can copy free templates. Requires auth.
 * - Premium (Monthly):
 *     ✓ 3 Prompt copies / day
 *     ✓ Access to all future assets
 *     ✓ Commercial license
 *     ✓ Dedicated support
 *     ✕ No background assets
 * - Premium (Yearly):
 *     ✓ Unlimited prompt copies & downloads
 *     ✓ Unlimited access to all templates
 *     ✓ Background assets
 *     ✓ Unlimited access to all future assets
 *     ✓ Commercial license
 *     ✓ Dedicated support
 */

import { supabase } from "./supabase.js";
import { isBackgroundAsset } from "./categories.js";

export const DAILY_PREMIUM_LIMIT = 3;

/**
 * Checks whether user has an active Yearly Premium plan.
 * Covers plan='premium_plus', plan='yearly', plan='premium_yearly', or billing_cycle='Yearly'/'yearly'.
 */
export function isYearlyPlan(userProfile) {
  if (!userProfile) return false;
  const plan = String(userProfile.plan || "").toLowerCase();
  const cycle = String(
    userProfile.billing_cycle ||
    userProfile.billingCycle ||
    userProfile.subscription_cycle ||
    ""
  ).toLowerCase();
  return (
    plan === "premium_plus" ||
    plan === "yearly" ||
    plan === "premium_yearly" ||
    cycle === "yearly"
  );
}

/**
 * Checks whether user has an active Monthly Premium plan.
 * Covers plan='premium' with non-yearly billing cycle, plan='monthly', etc.
 */
export function isMonthlyPlan(userProfile) {
  if (!userProfile) return false;
  const plan = String(userProfile.plan || "").toLowerCase();
  const cycle = String(
    userProfile.billing_cycle ||
    userProfile.billingCycle ||
    userProfile.subscription_cycle ||
    ""
  ).toLowerCase();
  return (
    (plan === "premium" && cycle !== "yearly") ||
    plan === "monthly" ||
    plan === "premium_monthly"
  );
}

/**
 * Returns true if the user has any active premium tier (monthly or yearly).
 */
export function isPremiumUser(userProfile) {
  return isYearlyPlan(userProfile) || isMonthlyPlan(userProfile);
}

/**
 * Returns true if the user plan grants access to the given template.
 * - Background Assets: ONLY Yearly Premium members have access.
 * - Free templates: Anyone can copy.
 * - Premium templates: Monthly and Yearly Premium members can copy.
 *   (Monthly members have a 3 prompt copies / day limit checked at copy time).
 */
export function canCopy(template, userProfile) {
  const isYearly = isYearlyPlan(userProfile);
  const isMonthly = isMonthlyPlan(userProfile);
  const isBg = isBackgroundAsset(template);
  const type = template?.type || "Free";

  // Background assets: Exclusive to Yearly Premium Plan
  if (isBg) {
    return isYearly;
  }

  // Free templates: Available to all
  if (type === "Free") {
    return true;
  }

  // Premium templates: Available to Monthly and Yearly Premium subscribers
  if (type === "Premium") {
    return isMonthly || isYearly;
  }

  // Legacy Premium Plus type (if any): Available to Yearly Premium subscribers
  if (type === "Premium Plus") {
    return isYearly;
  }

  return false;
}

/** Returns YYYY-MM-DD in the user's local timezone. */
export function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns daily copy statistics for the current user and plan.
 */
export function getDailyCopyStats(userProfile, session) {
  const isYearly = isYearlyPlan(userProfile);
  const isMonthly = isMonthlyPlan(userProfile);
  const userId = session?.user?.id || userProfile?.id || "";

  // Yearly Premium: Unlimited prompt copies & downloads!
  if (isYearly) {
    return {
      plan: "premium_yearly",
      isYearly: true,
      isUnlimited: true,
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      canCopyToday: true,
      hasReachedLimit: false,
    };
  }

  // Free or unauthenticated: 0 copies allowed for premium
  if (!isMonthly) {
    return {
      plan: userProfile?.plan || "free",
      isYearly: false,
      isUnlimited: false,
      limit: 0,
      used: 0,
      remaining: 0,
      canCopyToday: false,
      hasReachedLimit: false,
    };
  }

  // Monthly Premium: 3 prompt copies per day per user
  const today = getTodayKey();
  let used = 0;

  if (userId && typeof window !== "undefined") {
    try {
      const storageKey = `flowsites_daily_copies_${userId}_${today}`;
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        used = parseInt(stored, 10) || 0;
      }
    } catch (e) {
      console.warn("Could not read local copy quota:", e);
    }

    if (userProfile?.daily_copies_date === today && typeof userProfile?.daily_copies_count === "number") {
      used = Math.max(used, userProfile.daily_copies_count);
    }
  }

  const remaining = Math.max(0, DAILY_PREMIUM_LIMIT - used);
  return {
    plan: "premium_monthly",
    isYearly: false,
    isUnlimited: false,
    limit: DAILY_PREMIUM_LIMIT,
    used,
    remaining,
    canCopyToday: remaining > 0,
    hasReachedLimit: remaining <= 0,
  };
}

/**
 * Increments and records a prompt copy for monthly premium users.
 * Returns the updated stats.
 */
export async function recordDailyCopy(userProfile, session) {
  const isYearly = isYearlyPlan(userProfile);
  const isMonthly = isMonthlyPlan(userProfile);
  const userId = session?.user?.id || userProfile?.id || "";

  // Yearly users have unlimited prompt copies (no daily quota deduction)
  if (isYearly) {
    return getDailyCopyStats(userProfile, session);
  }

  if (!userId || !isMonthly) {
    return getDailyCopyStats(userProfile, session);
  }

  const today = getTodayKey();
  const storageKey = `flowsites_daily_copies_${userId}_${today}`;
  let currentUsed = 0;

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) currentUsed = parseInt(stored, 10) || 0;
    } catch (e) {}

    const nextUsed = currentUsed + 1;
    try {
      localStorage.setItem(storageKey, String(nextUsed));
    } catch (e) {}

    const remaining = Math.max(0, DAILY_PREMIUM_LIMIT - nextUsed);
    const detail = {
      userId,
      date: today,
      used: nextUsed,
      remaining,
      limit: DAILY_PREMIUM_LIMIT,
      hasReachedLimit: remaining <= 0,
    };

    window.dispatchEvent(new CustomEvent("flowsites_daily_copy_updated", { detail }));

    // Attempt to sync to Supabase user_profiles if columns exist
    try {
      await supabase
        .from("user_profiles")
        .update({
          daily_copies_count: nextUsed,
          daily_copies_date: today,
        })
        .eq("id", userId);
    } catch (err) {
      // Graceful silent fallback to localStorage
    }

    return {
      plan: "premium_monthly",
      isYearly: false,
      isUnlimited: false,
      limit: DAILY_PREMIUM_LIMIT,
      used: nextUsed,
      remaining,
      canCopyToday: remaining > 0,
      hasReachedLimit: remaining <= 0,
    };
  }

  return getDailyCopyStats(userProfile, session);
}

/** Returns the display label for a plan key or profile. */
export function planLabel(planOrProfile) {
  if (!planOrProfile) return "Free";
  const profile = typeof planOrProfile === "object" ? planOrProfile : { plan: planOrProfile };
  if (isYearlyPlan(profile)) return "Premium (Yearly)";
  if (isMonthlyPlan(profile)) return "Premium (Monthly)";
  return "Free";
}

/** Returns the badge label shown on a locked template. */
export function requiredPlanLabel(templateOrType, userProfile = null) {
  if (!templateOrType) return null;
  const isBg = isBackgroundAsset(templateOrType);
  if (isBg) {
    return isYearlyPlan(userProfile) ? null : "Yearly";
  }
  const type = typeof templateOrType === "object" ? templateOrType.type : templateOrType;
  if (type === "Premium Plus") return "Yearly";
  if (type === "Premium") {
    return (isMonthlyPlan(userProfile) || isYearlyPlan(userProfile)) ? null : "Premium";
  }
  return null;
}
