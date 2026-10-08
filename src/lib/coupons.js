/**
 * Coupon Configurations for Flowsites
 * All 30% Off discount codes accepted in frontend and backend.
 */

export const VALID_COUPONS = {
  FLOW30: { discount: 30, description: "30% off" },
  VIBE30: { discount: 30, description: "30% off" },
  BUILD30: { discount: 30, description: "30% off" },
  CREATE30: { discount: 30, description: "30% off" },
  SHIP30: { discount: 30, description: "30% off" },
  CODEFLOW: { discount: 30, description: "30% off" },
  PIXEL30: { discount: 30, description: "30% off" },
  LAUNCH30: { discount: 30, description: "30% off" },
  INSIDER30: { discount: 30, description: "30% off" },
};

/**
 * Validates a coupon code string (case-insensitive, trimmed).
 * Returns coupon details if valid, or null if invalid.
 */
export function validateCoupon(code) {
  if (!code || typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(VALID_COUPONS, normalized)) {
    return {
      code: normalized,
      ...VALID_COUPONS[normalized],
    };
  }
  return null;
}

export function isValidCoupon(code) {
  return Boolean(validateCoupon(code));
}
