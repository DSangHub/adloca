import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", data.user.id).single();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${new URL(request.url).origin}/account`,
  });
  return NextResponse.json({ url: session.url });
}
