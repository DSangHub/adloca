import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const zones = new Set(["Fresno", "Tulare", "Visalia", "Madera", "Bakersfield"]);
const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const text = (value: FormDataEntryValue | null, max = 80) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET(request: Request) {
  const zone = new URL(request.url).searchParams.get("zone") ?? "";
  if (!zones.has(zone)) return NextResponse.json({ ads: [] });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("business_ads")
    .select("id,slot_number,line_one,line_two,line_three,image_path")
    .eq("zone", zone)
    .eq("status", "active")
    .order("slot_number");
  if (error) return NextResponse.json({ ads: [] });
  const ads = (data ?? []).map((ad) => ({
    ...ad,
    image_url: admin.storage.from("business-ads").getPublicUrl(ad.image_path).data.publicUrl,
  }));
  return NextResponse.json({ ads }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in with a business account to claim this ad box" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("account_type").eq("id", auth.user.id).single();
  if (profile?.account_type !== "business") {
    return NextResponse.json({ error: "A business account is required to claim an ad box" }, { status: 403 });
  }

  const form = await request.formData();
  const zone = text(form.get("zone"), 30);
  const slotNumber = Number(text(form.get("slotNumber"), 2));
  const lineOne = text(form.get("lineOne"));
  const lineTwo = text(form.get("lineTwo"));
  const lineThree = text(form.get("lineThree"));
  const image = form.get("image");
  if (!zones.has(zone) || !Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 5 || !lineOne || !lineTwo || !lineThree) {
    return NextResponse.json({ error: "Complete all three ad lines and choose a valid box" }, { status: 400 });
  }
  if (!(image instanceof File) || !imageTypes[image.type] || image.size === 0 || image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Upload one JPG, PNG, or WebP image up to 5 MB" }, { status: 400 });
  }

  const imagePath = `${auth.user.id}/${crypto.randomUUID()}.${imageTypes[image.type]}`;
  const upload = await admin.storage.from("business-ads").upload(imagePath, await image.arrayBuffer(), {
    contentType: image.type,
    upsert: false,
  });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 400 });

  const result = await admin.from("business_ads").insert({
    owner_id: auth.user.id,
    zone,
    slot_number: slotNumber,
    line_one: lineOne,
    line_two: lineTwo,
    line_three: lineThree,
    image_path: imagePath,
    status: "pending",
  }).select("id,status").single();
  if (result.error) {
    await admin.storage.from("business-ads").remove([imagePath]);
    const claimed = result.error.code === "23505";
    return NextResponse.json({ error: claimed ? "This ad box has already been claimed" : result.error.message }, { status: claimed ? 409 : 400 });
  }
  return NextResponse.json({ ad: result.data });
}
