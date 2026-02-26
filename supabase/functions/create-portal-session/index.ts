import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

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

    // Get customer ID from billing_data
    const { data: billing } = await supabaseClient
      .from("billing_data")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = billing?.stripe_customer_id;

    // Always verify the customer exists in Stripe, fall back to email lookup
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        logStep("Verified existing Stripe customer", { customerId });
      } catch {
        logStep("Stored customer ID invalid, clearing and looking up by email", { customerId });
        customerId = null;
        // Clear the invalid ID
        await supabaseClient
          .from("billing_data")
          .update({ stripe_customer_id: null })
          .eq("user_id", userId);
      }
    }

    if (!customerId) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length === 0) {
        throw new Error("No Stripe customer found for this user. Please subscribe to a plan first.");
      }
      customerId = customers.data[0].id;
      
      // Store for future use
      const { data: existingBilling } = await supabaseClient
        .from("billing_data")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingBilling) {
        await supabaseClient
          .from("billing_data")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", userId);
      } else {
        await supabaseClient
          .from("billing_data")
          .insert({ user_id: userId, stripe_customer_id: customerId });
      }
    }

    logStep("Found Stripe customer", { customerId });
    const origin = req.headers.get("origin") || "https://ghostlink.lovable.app";
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-portal-session", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
