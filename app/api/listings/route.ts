import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const text = (value: FormDataEntryValue | null, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Sign in before posting" }, { status: 401 });

  const form = await request.formData();
  const price = Number(text(form.get("price"), 12));
  const listing = {
    owner_id: data.user.id,
    title: text(form.get("title"), 120),
    category: text(form.get("category"), 60),
    description: text(form.get("description"), 2000),
    location_text: text(form.get("location"), 100),
    price_cents: Math.round(price * 100),
    status: "pending",
  };
  if (!listing.title || !listing.category || !listing.description || !listing.location_text || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Complete every listing field" }, { status: 400 });
  }
  const result = await supabase.from("listings").insert(listing).select("id").single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ id: result.data.id });
}
