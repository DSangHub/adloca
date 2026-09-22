import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_RESTRICTED_KEY ?? process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
}
