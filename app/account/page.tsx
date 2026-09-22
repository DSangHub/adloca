import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccountActions from "./account-actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");
  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("display_name,home_zip,account_type,business_name,subscription_status,stripe_customer_id").eq("id", data.user.id).maybeSingle(),
    supabase.from("listings").select("id,title,status,price_cents,created_at").eq("owner_id", data.user.id).order("created_at", { ascending: false }),
  ]);
  return <main className="account"><Link className="back" href="/">← Back to AdLoca</Link><section className="accountcard"><span className="kicker">ADLOCA ACCOUNT</span><h1>{profile?.display_name || data.user.email}</h1><p>{data.user.email} · {profile?.home_zip || "Add ZIP code"}</p><div className="status"><b>{profile?.account_type === "business" ? "Business advertiser" : "Personal account"}</b><span>{profile?.subscription_status === "active" ? "Pro advertising active" : "Free plan"}</span></div><AccountActions hasBilling={Boolean(profile?.stripe_customer_id)} /></section><section className="accountcard"><h2>Your listings</h2>{listings?.length?<div className="listingrows">{listings.map(item=><div key={item.id}><span><b>{item.title}</b><small>{item.status}</small></span><strong>${(item.price_cents/100).toFixed(2)}</strong></div>)}</div>:<p>No listings yet. Return home to post your first item.</p>}</section></main>;
}
