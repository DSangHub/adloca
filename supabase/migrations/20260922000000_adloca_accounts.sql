create type public.account_type as enum ('personal', 'business');
create type public.listing_status as enum ('draft', 'pending', 'active', 'sold', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  home_zip text not null check (home_zip ~ '^\d{5}(-\d{4})?$'),
  account_type public.account_type not null default 'personal',
  business_name text,
  stripe_customer_id text unique,
  subscription_status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null,
  description text not null check (char_length(description) <= 2000),
  location_text text not null,
  price_cents integer not null check (price_cents > 0),
  status public.listing_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.stripe_events enable row level security;

create policy "profiles_read_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "active_listings_public" on public.listings for select to anon, authenticated using (status = 'active' or (select auth.uid()) = owner_id);
create policy "listings_insert_own" on public.listings for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "listings_update_own" on public.listings for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "listings_delete_own" on public.listings for delete to authenticated using ((select auth.uid()) = owner_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;

create index listings_owner_id_idx on public.listings(owner_id);
create index listings_status_created_at_idx on public.listings(status, created_at desc);

create schema if not exists private;
create function private.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, home_zip, account_type, business_name)
  values (new.id,
    coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(left(new.raw_user_meta_data ->> 'home_zip', 10), ''), '00000'),
    case when new.raw_user_meta_data ->> 'account_type' = 'business' then 'business'::public.account_type else 'personal'::public.account_type end,
    nullif(left(new.raw_user_meta_data ->> 'business_name', 120), ''));
  return new;
end;
$$;
revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.create_profile_for_new_user();

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger listings_updated_at before update on public.listings for each row execute function public.set_updated_at();
