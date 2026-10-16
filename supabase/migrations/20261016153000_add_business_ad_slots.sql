create table public.business_ads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  zone text not null check (zone in ('Fresno', 'Tulare', 'Visalia', 'Madera', 'Bakersfield')),
  slot_number smallint not null check (slot_number between 1 and 5),
  line_one text not null check (char_length(line_one) between 1 and 80),
  line_two text not null check (char_length(line_two) between 1 and 80),
  line_three text not null check (char_length(line_three) between 1 and 80),
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'archived')),
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_ads enable row level security;

create policy "active_business_ads_public" on public.business_ads
for select to anon, authenticated
using (status = 'active' or (select auth.uid()) = owner_id);

grant select on public.business_ads to anon, authenticated;
revoke insert, update, delete on public.business_ads from anon, authenticated;

create unique index business_ads_claimed_slot_idx
on public.business_ads(zone, slot_number)
where status in ('pending', 'active');

create index business_ads_owner_idx on public.business_ads(owner_id, created_at desc);
create index business_ads_active_zone_idx on public.business_ads(zone, slot_number) where status = 'active';

create trigger business_ads_updated_at before update on public.business_ads
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-ads', 'business-ads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

