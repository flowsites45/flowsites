/**
 * Access control & Daily Quota helper.
 * 
 * Subscription Tiers:
 * - Free: Can copy free templates. Requires auth.
 * - Premium: Max 3 prompt copies per day per user across all templates.
 * - Premium+: Unlimited prompt copies and downloads per day.
 */

import { supabase } from "./supabase.js";

export const DAILY_PREMIUM_LIMIT = 3;

/**
 * Returns true if the user plan grants access to the given template type.
 */
export function canCopy(template, userProfile) {
  const plan = userProfile?.plan || "free";
  const type = template?.type || "Free";

  if (type === "Free") return true;
  if (type === "Premium") return plan === "premium" || plan === "premium_plus";
  if (type === "Premium Plus") return plan === "premium_plus";
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
  const plan = userProfile?.plan || "free";
  const userId = session?.user?.id || userProfile?.id || "";

  if (plan === "premium_plus") {
    return {
      plan,
      isUnlimited: true,
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      canCopyToday: true,
      hasReachedLimit: false,
    };
  }

  if (plan !== "premium") {
    return {
      plan,
      isUnlimited: false,
      limit: 0,
      used: 0,
      remaining: 0,
      canCopyToday: false,
      hasReachedLimit: false,
    };
  }

  // Premium plan: 3 per day
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
    plan,
    isUnlimited: false,
    limit: DAILY_PREMIUM_LIMIT,
    used,
    remaining,
    canCopyToday: remaining > 0,
    hasReachedLimit: remaining <= 0,
  };
}

/**
 * Increments and records a prompt copy for premium users.
 * Returns the updated stats.
 */
export async function recordDailyCopy(userProfile, session) {
  const plan = userProfile?.plan || "free";
  const userId = session?.user?.id || userProfile?.id || "";

  if (!userId || plan !== "premium") {
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
      plan,
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

/** Returns the display label for a plan key. */
export function planLabel(plan) {
  if (plan === "premium_plus") return "Premium+";
  if (plan === "premium") return "Premium";
  return "Free";
}

/** Returns the badge label shown on a locked template. */
export function requiredPlanLabel(templateType) {
  if (templateType === "Premium Plus") return "Premium+";
  if (templateType === "Premium") return "Premium";
  return null;
}
