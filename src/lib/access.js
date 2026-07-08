/**
 * Access control helper.
 * Returns true if the user plan grants copy access to the given template.
 */
export function canCopy(template, userProfile) {
  const plan = userProfile?.plan || "free";
  const type = template?.type || "Free";

  if (type === "Free") return true;
  if (type === "Premium") return plan === "premium" || plan === "premium_plus";
  if (type === "Premium Plus") return plan === "premium_plus";
  return false;
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
