import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Price ID to tier mapping - must match webhook
const PRICE_TO_TIER: Record<string, { tier: string; cycle: string }> = {
  "price_1T40RUJEtCuiUlkpbRCOpK5X": { tier: "pro", cycle: "monthly" },
  "price_1T40RqJEtCuiUlkpqlHF3ndZ": { tier: "pro", cycle: "yearly" },
  "price_1T40SKJEtCuiUlkpoyShtOnU": { tier: "business", cycle: "monthly" },
  "price_1T40SlJEtCuiUlkph6VPCrU7": { tier: "business", cycle: "yearly" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    
    let userId: string;
    let userEmail: string;
    
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (!claimsError && claimsData?.claims) {
      userId = claimsData.claims.sub as string;
      userEmail = claimsData.claims.email as string;
      logStep("User authenticated via claims", { userId, email: userEmail });
    } else {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (!userData.user?.email) throw new Error("User not authenticated or email not available");
      userId = userData.user.id;
      userEmail = userData.user.email;
      logStep("User authenticated via getUser", { userId, email: userEmail });
    }
    
    if (!userId || !userEmail) throw new Error("Could not determine user identity");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email in Stripe
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, user is free tier");
      // Ensure profile is set to free
      await supabaseClient.from("profiles").update({ tier: "free" }).eq("id", userId);
      return new Response(JSON.stringify({
        subscribed: false,
        tier: "free",
        subscription_status: null,
        billing_cycle: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or past_due subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let tier = "free";
    let subscriptionStatus: string | null = null;
    let billingCycle: string | null = null;
    let subscriptionId: string | null = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;
      const tierInfo = PRICE_TO_TIER[priceId] || { tier: "pro", cycle: "monthly" };

      tier = tierInfo.tier;
      subscriptionStatus = "active";
      billingCycle = tierInfo.cycle;
      subscriptionId = subscription.id;

      logStep("Active subscription found", { subscriptionId: subscription.id, priceId, tier, cycle: billingCycle });
    } else {
      // Check for past_due
      const pastDueSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "past_due",
        limit: 1,
      });

      if (pastDueSubs.data.length > 0) {
        const subscription = pastDueSubs.data[0];
        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "pro", cycle: "monthly" };

        tier = tierInfo.tier;
        subscriptionStatus = "past_due";
        billingCycle = tierInfo.cycle;
        subscriptionId = subscription.id;

        logStep("Past due subscription found", { subscriptionId: subscription.id, tier });
      } else {
        logStep("No active subscription, user is free tier");
      }
    }

    // Sync to database - update profiles tier
    await supabaseClient.from("profiles").update({ tier }).eq("id", userId);

    // Upsert billing_data
    const { data: existingBilling } = await supabaseClient
      .from("billing_data")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const billingPayload = {
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      subscription_status: subscriptionStatus || "inactive",
      billing_cycle: billingCycle,
    };

    if (existingBilling) {
      await supabaseClient.from("billing_data").update(billingPayload).eq("user_id", userId);
    } else {
      await supabaseClient.from("billing_data").insert({ user_id: userId, ...billingPayload });
    }

    logStep("Database synced", { tier, subscriptionStatus, billingCycle });

    return new Response(JSON.stringify({
      subscribed: subscriptionStatus === "active",
      tier,
      subscription_status: subscriptionStatus,
      billing_cycle: billingCycle,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
