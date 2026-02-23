import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Price ID to tier mapping
const PRICE_TO_TIER: Record<string, { tier: string; cycle: string }> = {
  "price_1T40RUJEtCuiUlkpbRCOpK5X": { tier: "pro", cycle: "monthly" },
  "price_1T40RqJEtCuiUlkpqlHF3ndZ": { tier: "pro", cycle: "yearly" },
  "price_1T40SKJEtCuiUlkpoyShtOnU": { tier: "business", cycle: "monthly" },
  "price_1T40SlJEtCuiUlkph6VPCrU7": { tier: "business", cycle: "yearly" },
};

// Helper to upsert billing_data
async function upsertBillingData(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  data: Record<string, unknown>
) {
  // Try update first
  const { data: existing } = await supabaseClient
    .from("billing_data")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabaseClient
      .from("billing_data")
      .update(data)
      .eq("user_id", userId);
  } else {
    await supabaseClient
      .from("billing_data")
      .insert({ user_id: userId, ...data });
  }
}

// Helper to find user ID by stripe customer ID
async function findUserByCustomer(
  supabaseClient: ReturnType<typeof createClient>,
  customerId: string
): Promise<string | null> {
  const { data } = await supabaseClient
    .from("billing_data")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .limit(1);
  return data?.[0]?.user_id || null;
}

// Helper to find user ID by subscription ID
async function findUserBySubscription(
  supabaseClient: ReturnType<typeof createClient>,
  subscriptionId: string
): Promise<string | null> {
  const { data } = await supabaseClient
    .from("billing_data")
    .select("user_id")
    .eq("subscription_id", subscriptionId)
    .limit(1);
  return data?.[0]?.user_id || null;
}

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
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          const tierInfo = PRICE_TO_TIER[priceId] || { tier: "pro", cycle: "monthly" };

          // Find user by customer ID in billing_data
          let userId = await findUserByCustomer(supabaseClient, session.customer as string);

          if (!userId) {
            // Try metadata
            userId = session.metadata?.supabase_user_id || null;
          }

          if (userId) {
            // Update billing_data
            await upsertBillingData(supabaseClient, userId, {
              stripe_customer_id: session.customer as string,
              subscription_id: session.subscription as string,
              subscription_status: "active",
              billing_cycle: tierInfo.cycle,
            });

            // Update tier in profiles
            await supabaseClient
              .from("profiles")
              .update({ tier: tierInfo.tier })
              .eq("id", userId);

            logStep("Updated billing_data and profile", { userId, tier: tierInfo.tier });
          } else {
            logStep("Could not find user for checkout session");
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

        const userId = await findUserBySubscription(supabaseClient, subscription.id);
        if (userId) {
          await supabaseClient
            .from("billing_data")
            .update({
              subscription_status: subscription.status,
              billing_cycle: subscription.status === "active" ? tierInfo.cycle : null,
            })
            .eq("user_id", userId);

          await supabaseClient
            .from("profiles")
            .update({
              tier: subscription.status === "active" ? tierInfo.tier : "free",
            })
            .eq("id", userId);

          logStep("Profile and billing updated for subscription change");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const userId = await findUserBySubscription(supabaseClient, subscription.id);
        if (userId) {
          await supabaseClient
            .from("billing_data")
            .update({
              subscription_id: null,
              subscription_status: "canceled",
              billing_cycle: null,
            })
            .eq("user_id", userId);

          await supabaseClient
            .from("profiles")
            .update({ tier: "free" })
            .eq("id", userId);

          logStep("Profile downgraded to free tier");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          const userId = await findUserBySubscription(supabaseClient, invoice.subscription as string);
          if (userId) {
            await supabaseClient
              .from("billing_data")
              .update({ subscription_status: "past_due" })
              .eq("user_id", userId);

            logStep("Billing marked as past_due");
          }
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
