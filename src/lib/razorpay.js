import { supabase } from "./supabase.js";

/**
 * Razorpay Plan Configurations
 * Live Plan IDs created in Razorpay Dashboard:
 */
export const RAZORPAY_PLANS = {
  // Standard Plans (Regular Pricing)
  regular: {
    premium: {
      Monthly: {
        id: "plan_ThRumHtSv8MKfx", // Flowsites Premium Monthly - $50.00 / month
        link: "",
        price: 50,
      },
      Yearly: {
        id: "plan_ThRvxx4pqFcRKb", // Flowsites Premium Yearly - $180.00 / year (70% Off = $15/mo)
        link: "",
        price: 180,
      },
    },
    "premium+": {
      Monthly: {
        id: "plan_ThRyQzGSStOTM5", // Flowsites Premium+ Monthly - $80.00 / month
        link: "",
        price: 80,
      },
      Yearly: {
        id: "plan_ThRzIcHXMPC6W7", // Flowsites Premium+ Yearly - $288.00 / year (70% Off = $24/mo)
        link: "",
        price: 288,
      },
    },
  },

  // Discounted Plans (30% Coupon Discount Applied)
  discounted: {
    premium: {
      Monthly: {
        id: "plan_ThRwtxJvaOvtfl", // Flowsites Premium Monthly - 30% Off ($35.00 / month)
        link: "",
        price: 35,
      },
      Yearly: {
        id: "plan_ThRxkA4HEQBk6P", // Flowsites Premium Yearly - 30% Off ($126.00 / year)
        link: "",
        price: 126,
      },
    },
    "premium+": {
      Monthly: {
        id: "plan_ThS0wSRnyOkYj4", // Flowsites Premium+ Monthly - 30% Off ($56.00 / month)
        link: "",
        price: 56,
      },
      Yearly: {
        id: "plan_ThS1tg6WMzrlhI", // Flowsites Premium+ Yearly - 30% Off ($202.00 / year)
        link: "",
        price: 202,
      },
    },
  },
};

/**
 * Returns the Razorpay Plan ID for the specified tier, billing cycle, and discount status.
 */
export function getPlanId(planKey, billingCycle, hasDiscount = false) {
  const tier = hasDiscount ? RAZORPAY_PLANS.discounted : RAZORPAY_PLANS.regular;
  const plan = tier[planKey]?.[billingCycle];
  if (!plan) return null;
  return typeof plan === "string" ? plan : plan.id;
}

/**
 * Returns optional direct redirect link if configured for the plan.
 */
export function getPlanLink(planKey, billingCycle, hasDiscount = false) {
  const tier = hasDiscount ? RAZORPAY_PLANS.discounted : RAZORPAY_PLANS.regular;
  const plan = tier[planKey]?.[billingCycle];
  return plan?.link || null;
}

export async function createSubscription(planKey, billingCycle, userEmail, hasDiscount = false) {
  const plan_id = getPlanId(planKey, billingCycle, hasDiscount);
  if (!plan_id) throw new Error("Invalid plan or billing cycle");

  const plan_name = (planKey === "premium" ? "Premium" : "Premium+") + (hasDiscount ? " (30% Off)" : "");

  const { data, error } = await supabase.functions.invoke("create-subscription", {
    body: {
      plan_id,
      plan_name,
      billing_cycle: billingCycle,
      user_email: userEmail,
    },
  });

  if (error) throw new Error(error.message || "Failed to create subscription");
  return data;
}

export async function verifyPayment(payload) {
  const { data, error } = await supabase.functions.invoke("verify-payment", {
    body: payload,
  });

  if (error) throw new Error(error.message || "Payment verification failed");
  return data;
}

export function openRazorpayCheckout({
  key_id,
  subscription_id,
  planName,
  billingCycle,
  userEmail,
  onSuccess,
  onDismiss,
}) {
  const options = {
    key: key_id,
    subscription_id,
    name: "Flowsites",
    description: `${planName} — ${billingCycle}`,
    prefill: userEmail ? { email: userEmail } : {},
    theme: { color: "#070707" },
    handler: async function (response) {
      await onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_subscription_id: response.razorpay_subscription_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
