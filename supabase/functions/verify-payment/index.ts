// Supabase Edge Function: verify-payment
// Verifies Razorpay payment signature and updates user plan in Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      plan_name,
      billing_cycle,
      user_email,
    } = payload;

    // Verify HMAC signature
    const message = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(message)
    );
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Payment signature verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine plan key from plan_name
    let plan = "free";
    if (plan_name === "Premium+" || plan_name === "Premium Plus") plan = "premium_plus";
    else if (plan_name === "Premium") plan = "premium";

    // Update user profile in Supabase using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.find((u) => u.email === user_email);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        plan,
        razorpay_subscription_id,
        updated_at: new Date().toISOString(),
      });

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, plan }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
