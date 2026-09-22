import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const price = process.env.STRIPE_ADLOCA_PRO_PRICE_ID;
  if (!price) return NextResponse.json({ error: "Advertising plan is not configured" }, { status: 503 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", data.user.id).maybeSingle();
  const stripe = getStripe();
  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    integration_identifier: "adloca_web_qtzmpfke",
    line_items: [{ price, quantity: 1 }],
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : data.user.email,
    client_reference_id: data.user.id,
    metadata: { user_id: data.user.id },
    subscription_data: { metadata: { user_id: data.user.id } },
    success_url: `${origin}/account?billing=success`,
    cancel_url: `${origin}/account?billing=cancelled`,
  });
  return NextResponse.json({ url: session.url });
}
