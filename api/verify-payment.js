import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    plan_name,
    billing_cycle,
    razorpay_plan_id,
    user_email,
  } = req.body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required payment fields" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: "Razorpay keys not configured" });
  }

  try {
    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.VITE_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("subscriptions").upsert({
        email: user_email || null,
        plan: plan_name,
        billing_cycle,
        razorpay_plan_id,
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature,
        status: "active",
      }, { onConflict: "razorpay_subscription_id" });
    }

    return res.status(200).json({ verified: true });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
}
