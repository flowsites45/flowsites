export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan_id, plan_name, billing_cycle, user_email } = req.body;

  if (!plan_id) {
    return res.status(400).json({ error: "plan_id is required" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: "Razorpay keys not configured" });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Build payload: include total_count only for Yearly; omit for Monthly to avoid BAD_REQUEST
    const payload = {
      plan_id,
      quantity: 1,
      customer_notify: 1,
      notes: {
        plan_name: plan_name || "",
        billing_cycle: billing_cycle || "",
        user_email: user_email || "",
      },
    };
    if (billing_cycle === "Yearly") {
      payload.total_count = 12;
    } else {
      payload.total_count = 1;
    }

    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.description || `Razorpay returned ${response.status}`, details: data });
    }

    return res.status(200).json({
      subscription_id: data.id,
      key_id: keyId,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
