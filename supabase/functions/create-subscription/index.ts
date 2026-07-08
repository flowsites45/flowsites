// Supabase Edge Function: create-subscription
// Creates a Razorpay subscription server-side using the secret key
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan_id, plan_name, billing_cycle, user_email } = await req.json();

    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create subscription via Razorpay API
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id,
        total_count: billing_cycle === "Yearly" ? 12 : 1,
        quantity: 1,
        customer_notify: 1,
        notify_info: user_email ? { notify_email: user_email } : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay error:", data);
      return new Response(
        JSON.stringify({ error: data.error?.description || "Failed to create subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ subscription_id: data.id, key_id: RAZORPAY_KEY_ID }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
