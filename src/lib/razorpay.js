import { supabase } from "./supabase.js";

const PLAN_IDS = {
  premium: {
    Monthly: "plan_TAgBmeNsqoZf00",
    Yearly: "plan_TAgDGwhKtGcQDk",
  },
  "premium+": {
    Monthly: "plan_TAgDzEGYIZLgSU",
    Yearly: "plan_TAgF5eOwWXYszq",
  },
};

export function getPlanId(planKey, billingCycle) {
  return PLAN_IDS[planKey]?.[billingCycle] || null;
}

export async function createSubscription(planKey, billingCycle, userEmail) {
  const plan_id = getPlanId(planKey, billingCycle);
  if (!plan_id) throw new Error("Invalid plan or billing cycle");

  const plan_name = planKey === "premium" ? "Premium" : "Premium+";

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
