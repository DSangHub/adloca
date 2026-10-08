alter table public.listings
  add column location_latitude double precision,
  add column location_longitude double precision,
  add column location_accuracy_meters double precision,
  add column location_verified boolean not null default false,
  add column location_verified_at timestamptz;

alter table public.listings
  add constraint listings_valid_verified_location check (
    location_verified = false or (
      location_latitude between -90 and 90 and
      location_longitude between -180 and 180 and
      location_accuracy_meters > 0 and
      location_accuracy_meters <= 5000 and
      location_verified_at is not null
    )
  );

-- Listing creation is server-only so clients cannot forge verification fields.
revoke insert, update on public.listings from authenticated;
grant update (title, category, description, location_text, price_cents)
  on public.listings to authenticated;

drop policy if exists "listings_insert_own" on public.listings;
