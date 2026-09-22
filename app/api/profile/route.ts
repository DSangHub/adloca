import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const profile = {
    id: data.user.id,
    display_name: text(body.displayName, 80),
    home_zip: text(body.homeZip, 10),
    account_type: body.accountType === "business" ? "business" : "personal",
    business_name: text(body.businessName, 120) || null,
  };
  if (!profile.display_name || !/^\d{5}(?:-\d{4})?$/.test(profile.home_zip)) {
    return NextResponse.json({ error: "Enter a name and valid ZIP code" }, { status: 400 });
  }
  const result = await supabase.from("profiles").upsert(profile).select().single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ profile: result.data });
}
