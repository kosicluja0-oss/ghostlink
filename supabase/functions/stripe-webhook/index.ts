import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Price ID to tier mapping - UPDATE THESE WITH REAL PRICE IDs
const PRICE_TO_TIER: Record<string, { tier: string; cycle: string }> = {
  // Pro plan
  "price_pro_monthly_placeholder": { tier: "pro", cycle: "monthly" },
  "price_pro_yearly_placeholder": { tier: "pro", cycle: "yearly" },
  // Business plan
  "price_business_monthly_placeholder": { tier: "business", cycle: "monthly" },
  "price_business_yearly_placeholder": { tier: "business", cycle: "yearly" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errorMessage });
        return new Response(JSON.stringify({ error: `Webhook Error: ${errorMessage}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // In development, parse without verification
      event = JSON.parse(body) as Stripe.Event;
      logStep("Webhook parsed without signature verification (dev mode)");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Processing event", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        if (session.mode === "subscription" && session.subscription) {
          // Fetch the subscription to get price details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          const tierInfo = PRICE_TO_TIER[priceId] || { tier: "pro", cycle: "monthly" };

          // Find user by Stripe customer ID
          const { data: profiles, error: findError } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", session.customer)
            .limit(1);

          if (findError || !profiles?.length) {
            // Try to find by metadata
            const userId = session.metadata?.supabase_user_id;
            if (userId) {
              await supabaseClient
                .from("profiles")
                .update({
                  stripe_customer_id: session.customer as string,
                  subscription_id: session.subscription as string,
                  subscription_status: "active",
                  tier: tierInfo.tier,
                  billing_cycle: tierInfo.cycle,
                })
                .eq("id", userId);
              logStep("Updated profile by user ID", { userId, tier: tierInfo.tier });
            }
          } else {
            await supabaseClient
              .from("profiles")
              .update({
                subscription_id: session.subscription as string,
                subscription_status: "active",
                tier: tierInfo.tier,
                billing_cycle: tierInfo.cycle,
              })
              .eq("stripe_customer_id", session.customer);
            logStep("Updated profile by customer ID", { tier: tierInfo.tier });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status 
        });

        const priceId = subscription.items.data[0]?.price.id;
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "pro", cycle: "monthly" };

        await supabaseClient
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            tier: subscription.status === "active" ? tierInfo.tier : "free",
            billing_cycle: subscription.status === "active" ? tierInfo.cycle : null,
          })
          .eq("subscription_id", subscription.id);

        logStep("Profile updated for subscription change");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        await supabaseClient
          .from("profiles")
          .update({
            subscription_id: null,
            subscription_status: "canceled",
            tier: "free",
            billing_cycle: null,
          })
          .eq("subscription_id", subscription.id);

        logStep("Profile downgraded to free tier");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          await supabaseClient
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("subscription_id", invoice.subscription);

          logStep("Profile marked as past_due");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
