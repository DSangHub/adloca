import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: prior } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (prior) return NextResponse.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    if (userId) await admin.from("profiles").update({ stripe_customer_id: String(session.customer), subscription_status: "active" }).eq("id", userId);
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await admin.from("profiles").update({ subscription_status: subscription.status }).eq("stripe_customer_id", String(subscription.customer));
  }
  await admin.from("stripe_events").insert({ id: event.id, event_type: event.type });
  return NextResponse.json({ received: true });
}
