import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const text = (value: FormDataEntryValue | null, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Sign in before posting" }, { status: 401 });

  const form = await request.formData();
  if (text(form.get("companyWebsite"), 200)) {
    return NextResponse.json({ error: "Listing verification failed" }, { status: 400 });
  }
  const price = Number(text(form.get("price"), 12));
  const latitude = Number(text(form.get("latitude"), 30));
  const longitude = Number(text(form.get("longitude"), 30));
  const accuracy = Number(text(form.get("locationAccuracy"), 30));
  const validLocation = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
    Number.isFinite(accuracy) && accuracy > 0 && accuracy <= 5000;
  if (!validLocation) {
    return NextResponse.json({ error: "Confirm your device location before posting" }, { status: 400 });
  }
  const listing = {
    owner_id: data.user.id,
    title: text(form.get("title"), 120),
    category: text(form.get("category"), 60),
    description: text(form.get("description"), 2000),
    location_text: text(form.get("location"), 100),
    location_latitude: latitude,
    location_longitude: longitude,
    location_accuracy_meters: accuracy,
    location_verified: true,
    location_verified_at: new Date().toISOString(),
    price_cents: Math.round(price * 100),
    status: "pending",
  };
  if (!listing.title || !listing.category || !listing.description || !listing.location_text || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Complete every listing field" }, { status: 400 });
  }
  const admin = createAdminClient();
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await admin.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", data.user.id).gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Too many listings. Please wait five minutes and try again." }, { status: 429 });
  }
  const result = await admin.from("listings").insert(listing).select("id").single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ id: result.data.id });
}
